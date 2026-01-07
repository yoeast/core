import type { RouteParams, SchemaLike } from "./types";
import { HttpError } from "./errors";
import { getDefaultCacheStore, type CacheEntry } from "./cache";
import { render, renderWithLayout } from "./views";

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
  private headers = new Headers();
  private server?: Server;
  protected maxBodyBytes = 1_048_576;
  protected schemaCoerce = false;
  protected schema?: {
    params?: SchemaLike<unknown>;
    query?: SchemaLike<unknown>;
    body?: SchemaLike<unknown>;
  };

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

    await this.applyValidation();
    await this.before(req);
    const res = await this.handle();
    await this.after(req, res);
    return res;
  }

  protected abstract handle(): Promise<Response>;

  protected getRequest(): Request {
    return this.req;
  }

  protected getServer(): Server | undefined {
    return this.server;
  }

  /** @internal */
  [kSetServer](server: Server): void {
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

  protected async getBodyForm(): Promise<FormData> {
    this.assertBodySize();
    return await this.req.formData();
  }

  protected status(code: number): this {
    this.statusCode = code;
    return this;
  }

  protected text(body: string, status?: number): Response {
    return this.buildResponse(body, "text/plain; charset=utf-8", status);
  }

  protected json(data: unknown, status?: number): Response {
    return this.buildResponse(JSON.stringify(data), "application/json; charset=utf-8", status);
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
   * @param options - Render options
   * @returns HTML Response
   * 
   * @example
   * return this.render('home', { title: 'Welcome' })
   * return this.render('home', { title: 'Welcome' }, { layout: 'layouts/admin' })
   * return this.render('home', { title: 'Welcome' }, { layout: false })
   */
  protected async render(
    name: string,
    data: Record<string, unknown> = {},
    options: { layout?: string | false; status?: number } = {}
  ): Promise<Response> {
    const { layout = "layouts/main", status } = options;
    
    let html: string;
    if (layout === false) {
      html = await render(`pages/${name}`, data);
    } else {
      html = await renderWithLayout(`pages/${name}`, data, layout);
    }
    
    return this.buildResponse(html, "text/html; charset=utf-8", status);
  }

  protected async cacheJson(key: string, data: unknown, ttlMs?: number): Promise<Response> {
    const body = JSON.stringify(data);
    return this.cacheResponse(key, body, "application/json; charset=utf-8", ttlMs);
  }

  protected async cacheText(key: string, data: string, ttlMs?: number): Promise<Response> {
    return this.cacheResponse(key, data, "text/plain; charset=utf-8", ttlMs);
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

  private async cacheResponse(key: string, body: string, contentType: string, ttlMs?: number): Promise<Response> {
    const store = getDefaultCacheStore();
    const cached = await store.get(key);
    if (cached) {
      const ifNoneMatch = this.getHeader("If-None-Match");
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        return new Response(null, { status: 304, headers: { ETag: cached.etag } });
      }
      return new Response(cached.body, {
        status: cached.status,
        headers: this.buildCacheHeaders(cached),
      });
    }

    const etag = await this.computeEtag(body);
    const entry: CacheEntry = {
      etag,
      body,
      contentType,
      status: this.statusCode,
      createdAt: Date.now(),
      ttlMs,
    };
    await store.set(key, entry, ttlMs);

    const ifNoneMatch = this.getHeader("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    return new Response(body, {
      status: this.statusCode,
      headers: this.buildCacheHeaders(entry),
    });
  }

  private buildCacheHeaders(entry: CacheEntry): HeadersInit {
    const headers = new Headers(this.headers);
    headers.set("Content-Type", entry.contentType);
    headers.set("ETag", entry.etag);
    if (entry.ttlMs) {
      headers.set("Cache-Control", `max-age=${Math.floor(entry.ttlMs / 1000)}`);
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
    body: BodyInit | null,
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
