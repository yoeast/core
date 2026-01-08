/**
 * CORS - Cross-Origin Resource Sharing support.
 * 
 * Can be configured per-controller or globally via config.
 * 
 * @example Per-controller CORS:
 * ```ts
 * export default class ApiController extends Controller {
 *   // Enable CORS with defaults
 *   protected cors = true;
 *   
 *   // Or with custom options
 *   protected cors: CorsOptions = {
 *     origin: ["https://example.com"],
 *     credentials: true,
 *   };
 * }
 * ```
 */

import { config } from "./config";

export interface CorsOptions {
  /**
   * Allowed origins. Can be:
   * - "*" for any origin
   * - A specific origin string "https://example.com"
   * - An array of origins ["https://example.com", "https://other.com"]
   * - A function that receives the origin and returns true/false
   */
  origin?: string | string[] | ((origin: string) => boolean);

  /**
   * Allowed HTTP methods.
   * Default: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]
   */
  methods?: string[];

  /**
   * Allowed request headers.
   * Default: ["Content-Type", "Authorization", "X-Requested-With"]
   */
  allowedHeaders?: string[];

  /**
   * Headers exposed to the browser.
   */
  exposedHeaders?: string[];

  /**
   * Whether to include credentials (cookies, authorization headers).
   * Default: false
   */
  credentials?: boolean;

  /**
   * Max age for preflight cache in seconds.
   * Default: 86400 (24 hours)
   */
  maxAge?: number;
}

/** CORS configuration: true for defaults, false to disable, or custom options */
export type CorsConfig = boolean | CorsOptions;

const DEFAULT_OPTIONS: Required<Omit<CorsOptions, "origin">> & { origin: string } = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400,
};

/**
 * Check if an origin is allowed.
 */
export function isOriginAllowed(
  origin: string,
  allowed: string | string[] | ((origin: string) => boolean)
): boolean {
  if (allowed === "*") {
    return true;
  }

  if (typeof allowed === "function") {
    return allowed(origin);
  }

  if (Array.isArray(allowed)) {
    return allowed.includes(origin);
  }

  return origin === allowed;
}

/**
 * Resolve CORS options from controller config.
 */
export function resolveCorsOptions(corsConfig: CorsConfig): Required<Omit<CorsOptions, "origin">> & { origin: string | string[] | ((origin: string) => boolean) } {
  if (corsConfig === false) {
    throw new Error("CORS is disabled");
  }

  // Try to get config options, but gracefully handle if config not initialized
  let configOptions: Partial<CorsOptions> = {};
  try {
    configOptions = config<Partial<CorsOptions>>("cors") ?? {};
  } catch {
    // Config not initialized, use defaults
  }
  
  if (corsConfig === true) {
    return {
      ...DEFAULT_OPTIONS,
      ...configOptions,
    };
  }

  return {
    ...DEFAULT_OPTIONS,
    ...configOptions,
    ...corsConfig,
  };
}

/**
 * Build CORS headers for a regular response.
 */
export function buildCorsHeaders(
  req: Request,
  options: ReturnType<typeof resolveCorsOptions>
): Headers {
  const headers = new Headers();
  const origin = req.headers.get("Origin");

  // Access-Control-Allow-Origin
  if (origin && isOriginAllowed(origin, options.origin)) {
    // When credentials are true, we must echo the specific origin
    if (options.credentials || options.origin !== "*") {
      headers.set("Access-Control-Allow-Origin", origin);
    } else {
      headers.set("Access-Control-Allow-Origin", "*");
    }
  } else if (options.origin === "*") {
    headers.set("Access-Control-Allow-Origin", "*");
  }

  // Access-Control-Allow-Credentials
  if (options.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Access-Control-Expose-Headers
  if (options.exposedHeaders.length > 0) {
    headers.set("Access-Control-Expose-Headers", options.exposedHeaders.join(", "));
  }

  return headers;
}

/**
 * Build preflight response headers.
 */
export function buildPreflightHeaders(
  req: Request,
  options: ReturnType<typeof resolveCorsOptions>
): Headers {
  const headers = buildCorsHeaders(req, options);

  // Access-Control-Allow-Methods
  headers.set("Access-Control-Allow-Methods", options.methods.join(", "));

  // Access-Control-Allow-Headers
  const requestHeaders = req.headers.get("Access-Control-Request-Headers");
  if (requestHeaders) {
    // Echo back requested headers
    headers.set("Access-Control-Allow-Headers", requestHeaders);
  } else if (options.allowedHeaders.length > 0) {
    headers.set("Access-Control-Allow-Headers", options.allowedHeaders.join(", "));
  }

  // Access-Control-Max-Age
  if (options.maxAge > 0) {
    headers.set("Access-Control-Max-Age", String(options.maxAge));
  }

  return headers;
}

/**
 * Create a preflight response for OPTIONS requests.
 */
export function createPreflightResponse(req: Request, corsConfig: CorsConfig): Response {
  const options = resolveCorsOptions(corsConfig);
  const headers = buildPreflightHeaders(req, options);
  return new Response(null, { status: 204, headers });
}

/**
 * Apply CORS headers to an existing response.
 */
export function applyCorsHeaders(req: Request, response: Response, corsConfig: CorsConfig): Response {
  const options = resolveCorsOptions(corsConfig);
  const corsHeaders = buildCorsHeaders(req, options);

  // Clone response and add headers
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of corsHeaders) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
