import type { RouteParams, SchemaLike } from "./types";
import { HttpError } from "./errors";
import { cache as cacheManager, type CacheStore } from "./cache";
import { render, renderWithLayout } from "./views";
import { type CorsConfig, type CorsOptions, applyCorsHeaders } from "./cors";
import { HintCollector, type ResourceType, type ResourceHint } from "./hints";

/** Response cache entry for HTTP caching with ETags */
interface ResponseCacheEntry {
  etag: string;
  body: string;
  contentType: string;
  status: number;
  createdAt: number;
  ttl?: number;
}

/** Cache options for response methods */
interface ResponseCacheOptions {
  /** Cache key (defaults to request URL path) */
  key?: string;
  /** TTL in seconds (defaults to controller's responseCacheTtl) */
  ttl?: number;
  /** Disable caching for this response */
  noCache?: boolean;
}

/** Symbol for internal server setter - not part of public API */
export const kSetServer = Symbol("setServer");

export abstract class Controller {
  private req!: Request;
  private params: RouteParams = {};
  private query: URLSearchParams = new URLSearchParams();
  private validatedParams: unknown;
  private validatedQuery: unknown;
  private validatedBody: unknown;
  private statusCode = 200;
  protected headers = new Headers();
  private server?: import("bun").Server<unknown>;
  protected maxBodyBytes = 1_048_576;
  protected schemaCoerce = false;
  protected schema?: {
    params?: SchemaLike<unknown>;
    query?: SchemaLike<unknown>;
    body?: SchemaLike<unknown>;
  };

  /** 
   * Default TTL for response caching in seconds.
   * Set to 0 or undefined to disable caching by default.
   * Can be overridden per-response via options.
   * @example
   * protected responseCacheTtl = 300; // 5 minutes
   */
  protected responseCacheTtl?: number;

  /**
   * CORS configuration for this controller.
   * - `true` - Enable CORS with defaults from config
   * - `false` or undefined - No CORS headers (default)
   * - `CorsOptions` - Custom CORS configuration
   * @example
   * // Enable with defaults
   * protected cors = true;
   * 
   * // Custom configuration
   * protected cors: CorsOptions = {
   *   origin: ["https://example.com", "https://app.example.com"],
   *   credentials: true,
   * };
   */
  protected cors?: CorsConfig;

  /** Hint collector for resource hints */
  private hintCollector = new HintCollector();

  /** 
   * Access to the cache system for storing/retrieving data.
   * @example
   * const data = await this.cache.remember('key', 300, async () => fetchData());
   */
  protected get cache(): typeof cacheManager {
    return cacheManager;
  }

  async before(_req: Request): Promise<void> {}
  async after(_req: Request, _res: Response): Promise<void> {}

  async run(req: Request, params: RouteParams, query: URLSearchParams): Promise<Response> {
    this.req = req;
    this.params = params;
    this.query = query;
    this.statusCode = 200;
    this.headers = new Headers();
    this.validatedParams = undefined;
    this.validatedQuery = undefined;
    this.validatedBody = undefined;
    this.hintCollector.clear();

    await this.applyValidation();
    await this.before(req);
    let res = await this.handle();
    await this.after(req, res);
    
    // Apply CORS headers if configured
    if (this.cors) {
      res = applyCorsHeaders(req, res, this.cors);
    }
    
    return res;
  }

  protected abstract handle(): Promise<Response>;

  /**
   * Preload a resource (high priority, needed for current page).
   * @example
   * this.preload("/css/page.css", "style");
   * this.preload("/fonts/custom.woff2", "font", { crossorigin: true });
   */
  protected preload(href: string, as: ResourceType, options?: {
    crossorigin?: boolean | "anonymous" | "use-credentials";
    media?: string;
    mimeType?: string;
    integrity?: string;
    fetchpriority?: "high" | "low" | "auto";
  }): void {
    this.hintCollector.preload(href, as, options);
  }

  /**
   * Preconnect to an origin (establish early connection).
   * @example
   * this.preconnect("https://api.example.com");
   * this.preconnect("https://cdn.example.com", true); // with CORS
   */
  protected preconnect(href: string, crossorigin?: boolean | "anonymous" | "use-credentials"): void {
    this.hintCollector.preconnect(href, crossorigin);
  }

  /**
   * Prefetch a resource (low priority, might be needed for next navigation).
   * @example
   * this.prefetch("/api/users"); // Prefetch API data
   * this.prefetch("/next-page.js", "script");
   */
  protected prefetch(href: string, as?: ResourceType): void {
    this.hintCollector.prefetch(href, as);
  }

  /**
   * DNS prefetch for an origin.
   * @example
   * this.dnsPrefetch("https://analytics.example.com");
   */
  protected dnsPrefetch(href: string): void {
    this.hintCollector.dnsPrefetch(href);
  }

  /**
   * Get collected hints (for server to send 103 Early Hints).
   * @internal
   */
  getHints(): ResourceHint[] {
    return this.hintCollector.getHints();
  }

  /**
   * Check if controller has any hints.
   * @internal
   */
  hasHints(): boolean {
    return this.hintCollector.hasHints();
  }

  protected getRequest(): Request {
    return this.req;
  }

  protected getServer(): import("bun").Server<unknown> | undefined {
    return this.server;
  }

  /** @internal */
  [kSetServer](server: import("bun").Server<unknown>): void {
    this.server = server;
  }

  protected getUrl(): URL {
    return new URL(this.req.url);
  }

  protected getHeaders(): Headers {
    return new Headers(this.req.headers);
  }

  protected getHeader(name: string): string | null {
    return this.req.headers.get(name);
  }

  protected setHeader(name: string, value: string): void {
    this.headers.set(name, value);
  }

  protected setHeaders(values: Record<string, string>): void {
    for (const [key, value] of Object.entries(values)) {
      this.headers.set(key, value);
    }
  }

  protected getCookies(): Record<string, string> {
    const cookieMap = (this.req as unknown as { cookies?: { toJSON?: () => Record<string, string> } }).cookies;
    if (cookieMap?.toJSON) {
      return cookieMap.toJSON();
    }

    const header = this.req.headers.get("cookie");
    if (!header) return {};

    const out: Record<string, string> = {};
    for (const part of header.split(";")) {
      const [rawKey, ...rest] = part.trim().split("=");
      const key = rawKey ?? "";
      const value = rest.join("=");
      if (key) out[key] = decodeURIComponent(value);
    }
    return out;
  }

  protected getCookie(name: string): string | undefined {
    const cookieMap = (this.req as unknown as { cookies?: { get?: (name: string) => string | null } }).cookies;
    if (cookieMap?.get) {
      return cookieMap.get(name) ?? undefined;
    }
    return this.getCookies()[name];
  }

  protected setCookie(
    name: string,
    value: string,
    options: {
      path?: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "Strict" | "Lax" | "None";
      maxAge?: number;
    } = {}
  ): void {
    const cookieMap = (this.req as unknown as { cookies?: { set?: (name: string, value: string, options?: unknown) => void } })
      .cookies;
    if (cookieMap?.set) {
      cookieMap.set(name, value, options);
    }
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.httpOnly) parts.push("HttpOnly");
    if (options.secure) parts.push("Secure");
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    this.headers.append("Set-Cookie", parts.join("; "));
  }

  protected getParams(): RouteParams {
    return { ...this.params };
  }

  protected getParam(name: string): string | undefined {
    return this.params[name];
  }

  protected getParamsCoerced(): Record<string, string | number | boolean | null> {
    return coerceRecord(this.params);
  }

  protected getQuery(): URLSearchParams {
    return new URLSearchParams(this.query);
  }

  protected getQueryObject(): Record<string, string> {
    return Object.fromEntries(this.query);
  }

  protected getQueryParam(name: string): string | null {
    return this.query.get(name);
  }

  protected getQueryCoerced(): Record<string, string | number | boolean | null> {
    return coerceRecord(this.getQueryObject());
  }

  protected async getBodyJson<T = unknown>(schema?: SchemaLike<T>): Promise<T> {
    this.assertBodySize();
    
    const contentType = this.req.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      throw new HttpError(415, "Unsupported Media Type: expected application/json");
    }
    
    let data: unknown;
    try {
      data = await this.req.json();
    } catch (error) {
      throw new HttpError(400, "Invalid JSON: " + (error instanceof Error ? error.message : "malformed body"));
    }
    
    if (!schema) return data as T;
    return this.validate(schema, data);
  }

  protected async getBodyText(): Promise<string> {
    this.assertBodySize();
    return await this.req.text();
  }

  protected async getBodyForm(): Promise<globalThis.FormData> {
    this.assertBodySize();
    return await this.req.formData() as globalThis.FormData;
  }

  protected status(code: number): this {
    this.statusCode = code;
    return this;
  }

  /**
   * Return a plain text response.
   * @param body - Text content
   * @param options - Cache options or status code
   */
  protected text(body: string, options?: number | ResponseCacheOptions): Promise<Response> {
    const opts = typeof options === "number" ? { status: options } : options;
    return this.cachedResponse(body, "text/plain; charset=utf-8", opts);
  }

  /**
   * Return a JSON response.
   * @param data - Data to serialize as JSON
   * @param options - Cache options or status code
   */
  protected json(data: unknown, options?: number | ResponseCacheOptions): Promise<Response> {
    const opts = typeof options === "number" ? { status: options } : options;
    return this.cachedResponse(JSON.stringify(data), "application/json; charset=utf-8", opts);
  }

  protected redirect(url: string, status = 302): Response {
    this.headers.set("Location", url);
    return this.buildResponse(null, null, status);
  }

  protected stream(body: ReadableStream<Uint8Array>, contentType = "application/octet-stream", status?: number): Response {
    return this.buildResponse(body, contentType, status);
  }

  /**
   * Render a view template with optional layout.
   * 
   * @param name - Template name (relative to views/pages/)
   * @param data - Data to pass to the template
   * @param options - Render and cache options
   * @returns HTML Response
   * 
   * @example
   * return this.render('home', { title: 'Welcome' })
   * return this.render('home', { title: 'Welcome' }, { layout: 'layouts/admin' })
   * return this.render('home', { title: 'Welcome' }, { layout: false })
   * return this.render('home', { title: 'Welcome' }, { ttl: 300 }) // Cache for 5 min
   */
  protected async render(
    name: string,
    data: Record<string, unknown> = {},
    options: { layout?: string | false; status?: number } & ResponseCacheOptions = {}
  ): Promise<Response> {
    const { layout = "layouts/main", status, ...cacheOpts } = options;
    
    let html: string;
    if (layout === false) {
      html = await render(`pages/${name}`, data);
    } else {
      html = await renderWithLayout(`pages/${name}`, data, layout);
    }
    
    return this.cachedResponse(html, "text/html; charset=utf-8", { ...cacheOpts, status });
  }

  protected getValidatedParams<T = unknown>(): T | undefined {
    return this.validatedParams as T | undefined;
  }

  protected getValidatedQuery<T = unknown>(): T | undefined {
    return this.validatedQuery as T | undefined;
  }

  protected getValidatedBody<T = unknown>(): T | undefined {
    return this.validatedBody as T | undefined;
  }

  protected validate<T>(schema: SchemaLike<T>, input: unknown): T {
    if (typeof schema === "function") return schema(input);
    if ("parse" in schema) return schema.parse(input);

    const result = schema.safeParse(input);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  /**
   * Build a response with optional caching.
   * Uses controller's responseCacheTtl as default, can be overridden per-call.
   */
  private async cachedResponse(
    body: string,
    contentType: string,
    options: (ResponseCacheOptions & { status?: number }) | undefined
  ): Promise<Response> {
    const status = options?.status;
    const noCache = options?.noCache;
    const ttl = options?.ttl ?? this.responseCacheTtl;
    
    // If no caching configured or explicitly disabled, return plain response
    if (!ttl || noCache || !cacheManager.isEnabled()) {
      this.headers.set("X-Cache", "SKIP");
      return this.buildResponse(body, contentType, status);
    }

    // Generate cache key from request URL or use provided key
    const cacheKey = options?.key ?? `response:${this.getUrl().pathname}${this.getUrl().search}`;
    
    // Check cache
    const { value: cached, hit } = await cacheManager.getWithStatus<ResponseCacheEntry>(cacheKey);
    
    if (cached && hit) {
      const ifNoneMatch = this.getHeader("If-None-Match");
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        const headers = new Headers({ ETag: cached.etag, "X-Cache": "HIT" });
        return new Response(null, { status: 304, headers });
      }
      const headers = this.buildCacheHeaders(cached, true);
      return new Response(cached.body, { status: cached.status, headers });
    }

    // Compute ETag and cache the response
    const etag = await this.computeEtag(body);
    const entry: ResponseCacheEntry = {
      etag,
      body,
      contentType,
      status: status ?? this.statusCode,
      createdAt: Date.now(),
      ttl,
    };
    await cacheManager.set(cacheKey, entry, ttl);

    // Check If-None-Match for new entry
    const ifNoneMatch = this.getHeader("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      const headers = new Headers({ ETag: etag, "X-Cache": "MISS" });
      return new Response(null, { status: 304, headers });
    }

    return new Response(body, {
      status: status ?? this.statusCode,
      headers: this.buildCacheHeaders(entry, false),
    });
  }

  private buildCacheHeaders(entry: ResponseCacheEntry, hit: boolean): Headers {
    const headers = new Headers(this.headers);
    headers.set("Content-Type", entry.contentType);
    headers.set("ETag", entry.etag);
    headers.set("X-Cache", hit ? "HIT" : "MISS");
    if (entry.ttl) {
      headers.set("Cache-Control", `max-age=${entry.ttl}`);
    }
    return headers;
  }

  private async computeEtag(body: string): Promise<string> {
    const data = new TextEncoder().encode(body);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(hash));
    const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `\"${hex}\"`;
  }

  private assertBodySize(): void {
    const header = this.req.headers.get("content-length");
    if (!header) return;
    const length = Number.parseInt(header, 10);
    if (Number.isFinite(length) && length > this.maxBodyBytes) {
      throw new HttpError(413, "Payload Too Large");
    }
  }

  private async applyValidation(): Promise<void> {
    if (!this.schema) return;

    if (this.schema.params) {
      const params = this.schemaCoerce ? coerceRecord(this.params) : { ...this.params };
      this.validatedParams = this.validate(this.schema.params, params);
    }

    if (this.schema.query) {
      const query = this.schemaCoerce ? this.getQueryCoerced() : this.getQueryObject();
      this.validatedQuery = this.validate(this.schema.query, query);
    }

    if (this.schema.body) {
      this.validatedBody = await this.getBodyJson(this.schema.body);
    }
  }

  private buildResponse(
    body: string | ArrayBuffer | ReadableStream<Uint8Array> | null,
    contentType: string | null,
    status?: number
  ): Response {
    const headers = new Headers(this.headers);
    if (contentType && !headers.has("Content-Type")) {
      headers.set("Content-Type", contentType);
    }

    return new Response(body, {
      status: status ?? this.statusCode,
      headers,
    });
  }
}

function coerceRecord(input: Record<string, string | undefined>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    out[key] = coerceValue(value);
  }
  return out;
}

function coerceValue(value: string): string | number | boolean | null {
  const lower = value.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  if (lower === "null") return null;
  if (value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}
