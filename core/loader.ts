import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type {
  ParamMatcher,
  RouteDefinition,
  HttpMethod,
  ControllerConstructor,
  RealtimeRouteDefinition,
} from "./types";
import { buildRoutePath, buildRoutePathWithSuffix, compileRoutePattern, extractMethodFromFilename } from "./router";
import type { MiddlewareConstructor } from "./middleware";
import type { PluginConstructor } from "./plugin";
import type { CronJobConstructor, QueueJobConstructor } from "./jobs";
import type { WebSocketControllerConstructor } from "./websocket";
import type { SseControllerConstructor } from "./sse";
import { LruCacheStore, type CacheStore } from "./cache";

const ROUTE_EXTENSIONS = new Set([".ts", ".js", ".tsx", ".jsx"]);

export interface LoadedApp {
  routes: RouteDefinition[];
  wsRoutes: RealtimeRouteDefinition<WebSocketControllerConstructor>[];
  sseRoutes: RealtimeRouteDefinition<SseControllerConstructor>[];
  middleware: MiddlewareConstructor[];
  plugins: PluginConstructor[];
  cron: CronJobConstructor[];
  queue: QueueJobConstructor[];
  params: Record<string, ParamMatcher>;
  cacheStore: CacheStore;
}

export async function loadApp(rootDir: string): Promise<LoadedApp> {
  const appDir = path.join(rootDir, "app");

  const params = await loadParamMatchers(path.join(appDir, "params"));
  const routes = await loadRoutes(path.join(appDir, "routes"), params);
  const wsRoutes = await loadRealtimeRoutes<WebSocketControllerConstructor>(
    path.join(appDir, "routes"),
    params,
    "ws"
  );
  const sseRoutes = await loadRealtimeRoutes<SseControllerConstructor>(
    path.join(appDir, "routes"),
    params,
    "sse"
  );
  const middleware = await loadMiddleware(path.join(appDir, "middleware"));
  const plugins = await loadClasses<PluginConstructor>(path.join(appDir, "plugins"));
  const cron = await loadClasses<CronJobConstructor>(path.join(appDir, "cron"));
  const queue = await loadClasses<QueueJobConstructor>(path.join(appDir, "queue"));
  const cacheStore = new LruCacheStore();

  return { routes, wsRoutes, sseRoutes, middleware, plugins, cron, queue, params, cacheStore };
}

async function loadRoutes(
  routesDir: string,
  matchers: Record<string, ParamMatcher>
): Promise<RouteDefinition[]> {
  const files = await listFiles(routesDir);
  const routes: RouteDefinition[] = [];

  for (const file of files) {
    const method = extractMethodFromFilename(file);
    if (!method) continue;

    const relative = path.relative(routesDir, file);
    const routePath = buildRoutePath(relative);

    const mod = await import(pathToFileURL(file).href);
    const Controller = mod.default as ControllerConstructor | undefined;
    if (!Controller) {
      throw new Error(`Route file missing default export: ${relative}`);
    }

    const pattern = compileRoutePattern(method, routePath, matchers);
    routes.push({ method, path: routePath, pattern, Controller });
  }

  return routes;
}

async function loadRealtimeRoutes<TController>(
  routesDir: string,
  matchers: Record<string, ParamMatcher>,
  suffix: "ws" | "sse"
): Promise<RealtimeRouteDefinition<TController>[]> {
  const files = await listFiles(routesDir);
  const routes: RealtimeRouteDefinition<TController>[] = [];

  for (const file of files) {
    if (!file.endsWith(`.${suffix}.ts`) && !file.endsWith(`.${suffix}.js`)) continue;

    const relative = path.relative(routesDir, file);
    const routePath = buildRoutePathWithSuffix(relative, suffix);

    const mod = await import(pathToFileURL(file).href);
    const Controller = mod.default as TController | undefined;
    if (!Controller) {
      throw new Error(`Route file missing default export: ${relative}`);
    }

    const pattern = compileRoutePattern("GET", routePath, matchers);
    routes.push({ path: routePath, pattern, Controller });
  }

  return routes;
}

async function loadParamMatchers(paramsDir: string): Promise<Record<string, ParamMatcher>> {
  const files = await listFiles(paramsDir);
  const matchers: Record<string, ParamMatcher> = {};

  for (const file of files) {
    const ext = path.extname(file);
    if (!ROUTE_EXTENSIONS.has(ext)) continue;
    const name = path.basename(file, ext);
    const mod = await import(pathToFileURL(file).href);
    const matcher = (mod.default ?? mod.matcher) as ParamMatcher | undefined;
    if (typeof matcher !== "function") {
      throw new Error(`Param matcher must export a function: ${file}`);
    }
    matchers[name] = matcher;
  }

  return matchers;
}

async function loadMiddleware(dir: string): Promise<MiddlewareConstructor[]> {
  const files = await listFiles(dir);
  const items: Array<{ cls: MiddlewareConstructor; file: string; priority: number }> = [];

  for (const file of files) {
    const ext = path.extname(file);
    if (!ROUTE_EXTENSIONS.has(ext)) continue;
    const mod = await import(pathToFileURL(file).href);
    if (!mod.default) continue;
    const cls = mod.default as MiddlewareConstructor;
    const priority = Number((cls as unknown as { priority?: number }).priority ?? 0);
    items.push({ cls, file, priority });
  }

  items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.file.localeCompare(b.file);
  });

  return items.map((item) => item.cls);
}

async function loadClasses<T>(dir: string): Promise<T[]> {
  const files = await listFiles(dir);
  const classes: T[] = [];

  for (const file of files) {
    const ext = path.extname(file);
    if (!ROUTE_EXTENSIONS.has(ext)) continue;
    const mod = await import(pathToFileURL(file).href);
    if (!mod.default) continue;
    classes.push(mod.default as T);
  }

  return classes;
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const out: string[] = [];

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...(await listFiles(full)));
      } else if (ROUTE_EXTENSIONS.has(path.extname(entry.name))) {
        out.push(full);
      }
    }

    return out;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
