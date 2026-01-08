import type { HttpMethod } from "./types";
import { loadApp } from "./loader";
import { getAllowedMethods, getRoutesForPath, matchPath, matchRoute } from "./router";
import { applyMiddleware, type Middleware } from "./middleware";
import type { AppContext } from "./plugin";
import { HttpError } from "./errors";
import { initCache, shutdownCache, cache } from "./cache";
import type { WebSocketController } from "./websocket";
import { kSetServer } from "./controller";
import { printStartupBanner, logError } from "./logger";
import { initConfig, config } from "./config";
import { initStatic, serveStaticWithCache } from "./static";
import { initViews } from "./views";
import { initStorage } from "./storage";
import { bootServices, shutdownServices, hasService, service } from "./service";
import { createPreflightResponse, type CorsConfig } from "./cors";
import { buildLinkHeader, configToHints, type HintsConfig, type ResourceHint } from "./hints";

export interface ServerOptions {
  rootDir?: string;
  port?: number;
  hostname?: string;
  development?: boolean;
  silent?: boolean;
}

interface WsData {
  controller?: WebSocketController;
}

interface WsRouteInfo {
  path: string;
}

interface RequestWithIP extends Request {
  __clientIP?: string;
}

let currentWsRoutes: WsRouteInfo[] = [];
let currentServer: import("bun").Server<unknown> | undefined;
let currentApp: import("./loader").LoadedApp | undefined;

export function getWsRoutes(): WsRouteInfo[] {
  return [...currentWsRoutes];
}

export function getLoadedRoutes(): import("./types").RouteDefinition[] {
  return currentApp?.routes ?? [];
}

export async function startServer(options: ServerOptions = {}): Promise<import("bun").Server<unknown>> {
  const rootDir = options.rootDir ?? process.cwd();
  const development = options.development ?? process.env.NODE_ENV !== "production";
  const silent = options.silent ?? false;

  // Initialize core systems
  await initConfig(rootDir);
  initStorage(rootDir);
  initStatic(rootDir);
  await initViews(rootDir);
  await initCache();
  await bootServices(rootDir);

  const app = await loadApp(rootDir);
  currentApp = app;

  const context: AppContext = {
    routes: app.routes,
    middleware: app.middleware,
  };

  currentWsRoutes = app.wsRoutes.map((r) => ({ path: r.path }));

  // Pre-instantiate middleware (they should be stateless)
  const globalMiddleware: Middleware[] = app.middleware.map((M) => new M());

  for (const PluginClass of app.plugins) {
    const plugin = new PluginClass();
    await plugin.init(context);
  }

  let server: import("bun").Server<unknown>;

  const innerFetch = async (req: Request): Promise<Response> => {
    try {
      const url = new URL(req.url);
      const method = req.method.toUpperCase() as HttpMethod;

      // Try static files first (only for GET/HEAD)
      if (method === "GET" || method === "HEAD") {
        const staticResponse = await serveStaticWithCache(req, url.pathname);
        if (staticResponse) {
          if (method === "HEAD") {
            return new Response(null, {
              status: staticResponse.status,
              headers: staticResponse.headers,
            });
          }
          return staticResponse;
        }
      }

      if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
        for (const route of app.wsRoutes) {
          const params = matchPath(url.pathname, route.pattern);
          if (!params) continue;
          const controller = new route.Controller();
          controller._init(req, params, url.searchParams);
          if (server.upgrade(req, { data: { controller } })) {
            return new Response(null);
          }
          return new Response("Upgrade Failed", { status: 400 });
        }
      }

      if (method === "GET") {
        for (const route of app.sseRoutes) {
          const params = matchPath(url.pathname, route.pattern);
          if (!params) continue;
          const controller = new route.Controller();
          return controller.run(req, params, url.searchParams);
        }
      }

      let match = matchRoute(method, url.pathname, app.routes);

      if (!match && method === "HEAD") {
        const getMatch = matchRoute("GET", url.pathname, app.routes);
        if (getMatch) {
          match = getMatch;
          const controller = new match.route.Controller();
          const res = await controller.run(req, match.params, url.searchParams);
          return new Response(null, { status: res.status, headers: res.headers });
        }
      }

      if (!match) {
        if (method === "OPTIONS") {
          const allowed = getAllowedMethods(url.pathname, app.routes);
          if (allowed.has("GET")) {
            allowed.add("HEAD");
          }
          if (allowed.size > 0) {
            // Check if any matching route has CORS enabled for preflight
            const matchingRoutes = getRoutesForPath(url.pathname, app.routes);
            for (const route of matchingRoutes) {
              const corsConfig = (route.Controller as unknown as { prototype: { cors?: CorsConfig } }).prototype.cors;
              if (corsConfig) {
                return createPreflightResponse(req, corsConfig);
              }
            }
            
            // No CORS, return basic Allow header
            const allowHeader = [...allowed, "OPTIONS"].sort().join(",");
            return new Response(null, {
              status: 204,
              headers: { Allow: allowHeader },
            });
          }
        }

        const allowed = getAllowedMethods(url.pathname, app.routes);
        if (allowed.size > 0) {
          if (allowed.has("GET")) {
            allowed.add("HEAD");
          }
          const allowHeader = [...allowed, "OPTIONS"].sort().join(",");
          return new Response(null, {
            status: 405,
            headers: { Allow: allowHeader },
          });
        }

        return new Response("Not Found", { status: 404 });
      }

      const controller = new match.route.Controller();
      (controller as unknown as { [kSetServer]: (s: import("bun").Server<unknown>) => void })[kSetServer](server);
      const routeMiddleware =
        (match.route.Controller as unknown as { middleware?: typeof app.middleware }).middleware ?? [];
      
      let response = await applyMiddleware(routeMiddleware, req, () =>
        controller.run(req, match.params, url.searchParams)
      );
      
      // Add Link header for resource hints
      const controllerHints = (controller as unknown as { getHints?: () => ResourceHint[] }).getHints?.() ?? [];
      const hintsConfig = config<HintsConfig>("hints") ?? {};
      const configHints = configToHints(hintsConfig);
      const allHints = [...configHints, ...controllerHints];
      
      if (allHints.length > 0) {
        const linkHeader = buildLinkHeader(allHints);
        const existingLink = response.headers.get("Link");
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Link", existingLink ? `${existingLink}, ${linkHeader}` : linkHeader);
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }
      
      return response;
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      if (error instanceof HttpError) {
        return new Response(
          JSON.stringify({
            error: error.name,
            message: error.message,
            status: error.status,
            code: error.code,
          }),
          {
            status: error.status,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          }
        );
      }
      if (development) {
        logError("Unexpected error", error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
      logError("Unexpected error", error instanceof Error ? error : new Error(String(error)));
      return new Response(
        JSON.stringify({
          error: "InternalServerError",
          message: "Unexpected error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }
  };

  const portEnv = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : undefined;
  const port = options.port ?? portEnv ?? 3000;

  server = Bun.serve({
    port,
    hostname: options.hostname,
    fetch(req, bunServer) {
      // Store client IP for middleware to access via __clientIP property
      const ip = bunServer.requestIP(req);
      (req as RequestWithIP).__clientIP = ip?.address;
      
      return applyMiddleware(globalMiddleware, req, () => innerFetch(req));
    },
    websocket: {
      open(ws) {
        const controller = (ws.data as WsData | undefined)?.controller;
        controller?.open(ws);
      },
      message(ws, message) {
        const controller = (ws.data as WsData | undefined)?.controller;
        controller?.message?.(ws, message);
      },
      close(ws, code, reason) {
        const controller = (ws.data as WsData | undefined)?.controller;
        controller?.close?.(ws, code, reason);
      },
    },
  });

  if (!silent) {
    // Get database info if available
    let database: { host?: string; port?: number; name?: string } | undefined;
    if (hasService("database")) {
      const db = service("database") as { getInfo?(): { host?: string; port?: number; name?: string } };
      if (typeof db.getInfo === "function") {
        database = db.getInfo();
      }
    }

    // Get cache info
    const cacheInfo = cache.getInfo();

    printStartupBanner({
      hostname: server.hostname ?? "localhost",
      port: server.port ?? port,
      routes: app.routes.length,
      wsRoutes: app.wsRoutes.length,
      sseRoutes: app.sseRoutes.length,
      middleware: app.middleware.length,
      development,
      database,
      cache: cacheInfo,
    });
  }

  currentServer = server;
  return server;
}

/**
 * Gracefully shutdown the server and all services.
 */
export async function stopServer(): Promise<void> {
  if (currentServer) {
    currentServer.stop();
    currentServer = undefined;
  }
  await shutdownCache();
  await shutdownServices();
}
