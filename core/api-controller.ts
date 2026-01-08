/**
 * API Controller - Base controller for API endpoints with schema validation.
 * 
 * Provides:
 * - Input validation via `static input` (zod schema)
 * - Output validation via `static responses` (zod schemas by status code)
 * - Type-safe `this.response(status, data)` helper
 * - API token authentication (optional)
 * 
 * @example
 * export default class GetUserController extends ApiController {
 *   static input = z.object({
 *     id: z.string().regex(/^[a-f\d]{24}$/i),
 *   });
 * 
 *   static responses = {
 *     200: z.object({
 *       user: z.object({ id: z.string(), email: z.string() }),
 *     }),
 *     404: z.object({
 *       error: z.literal("NotFound"),
 *       message: z.string(),
 *     }),
 *   };
 * 
 *   async handle() {
 *     const { id } = this.input;
 *     const user = await User.findById(id);
 *     
 *     if (!user) {
 *       return this.response(404, { error: "NotFound", message: "User not found" });
 *     }
 *     
 *     return this.response(200, { user: { id: user.id, email: user.email } });
 *   }
 * }
 */

import { Controller } from "./controller";
import { HttpError } from "./errors";
import { logError, logWarn } from "./logger";
import type { RouteParams, SchemaLike } from "./types";
import type {
  ApiScope,
  ApiProtectionOptions,
  ApiRequestContext,
  ApiTokenConfig,
  ApiTokenVerifyResult,
  ResourcePattern,
} from "./api/types";
import { extractToken, verifyToken } from "./api/verifier";

/** Validation error detail */
export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
  code?: string;
}

/** Response schemas by status code */
export type ResponseSchemas = Record<number, SchemaLike<unknown>>;

/** Extract the inferred type from a schema */
type InferSchema<T> = T extends SchemaLike<infer U> ? U : unknown;

/** Get response type for a status code */
type ResponseType<T extends ResponseSchemas, S extends keyof T> = InferSchema<T[S]>;

export class ApiController extends Controller {
  /**
   * Input validation schema (zod or compatible).
   * Validated before handle() is called.
   */
  static input?: SchemaLike<unknown>;

  /**
   * Response schemas by status code.
   * Output is validated before sending.
   */
  static responses?: ResponseSchemas;

  /**
   * Legacy: still supported for backwards compatibility.
   * @deprecated Use `static input` instead
   */
  static validate?: SchemaLike<unknown>;

  /**
   * Whether this endpoint requires API token authentication.
   */
  protected apiProtected = false;

  /**
   * Required scopes for this endpoint.
   */
  protected apiScopes?: ApiScope[];

  /**
   * Resource pattern for authorization.
   */
  protected apiResource?: ResourcePattern;

  /**
   * Custom verification function.
   */
  protected apiVerify?: ApiProtectionOptions["verify"];

  /**
   * API request context (populated after authentication).
   */
  private apiContext: ApiRequestContext = {
    authenticated: false,
    scopes: [],
  };

  /**
   * The verified token (if authenticated).
   */
  private verifiedToken?: ApiTokenConfig;

  /**
   * The validated input data.
   */
  private _input: unknown;

  /**
   * Get the validated input data.
   * Use this in handle() to access validated input.
   */
  protected get input(): unknown {
    return this._input;
  }

  /**
   * Override run to add authentication and input validation.
   */
  override async run(
    req: Request,
    params: RouteParams,
    query: URLSearchParams
  ): Promise<Response> {
    // Run authentication if endpoint is protected
    if (this.apiProtected) {
      const authResult = await this.authenticate(req);
      
      if (!authResult.valid) {
        return this.handleAuthError(authResult);
      }

      // Store token and context
      this.verifiedToken = authResult.token;
      this.apiContext = {
        authenticated: true,
        token: authResult.token,
        clientId: authResult.token?.clientId,
        scopes: authResult.scopes ?? [],
      };
    }

    // Build input from params, query, and body
    const rawInput = await this.buildInput(req, params, query);
    
    // Get input schema (prefer `input` over legacy `validate`)
    const ControllerClass = this.constructor as typeof ApiController;
    let inputSchema = ControllerClass.input;
    
    // Backward compatibility: fall back to deprecated `validate`
    if (!inputSchema && ControllerClass.validate) {
      logWarn(`[${ControllerClass.name}] 'static validate' is deprecated, use 'static input' instead`);
      inputSchema = ControllerClass.validate;
    }
    
    // Validate input if schema exists
    if (inputSchema) {
      const validationResult = this.validateData(inputSchema, rawInput);
      if (!validationResult.valid) {
        return this.handleValidationError("input", validationResult.errors);
      }
      this._input = validationResult.data;
    } else {
      this._input = rawInput;
    }

    // Initialize controller state
    this.initRequest(req, params, query);
    
    // Run lifecycle hooks and handler
    await this.before(req);
    const res = await this.handle();
    await this.after(req, res);
    
    return res;
  }

  /**
   * Initialize request state.
   */
  private initRequest(req: Request, params: RouteParams, query: URLSearchParams): void {
    const self = this as unknown as {
      req: Request;
      params: RouteParams;
      query: URLSearchParams;
      statusCode: number;
      headers: Headers;
    };
    self.req = req;
    self.params = params;
    self.query = query;
    self.statusCode = 200;
    self.headers = new Headers();
  }

  /**
   * Build input object from request data.
   */
  private async buildInput(
    req: Request,
    params: RouteParams,
    query: URLSearchParams
  ): Promise<Record<string, unknown>> {
    const input: Record<string, unknown> = {};

    // Add route params
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        input[key] = value;
      }
    }

    // Add query params (don't override route params)
    // Handle array parameters (e.g., ?tags=js&tags=ts)
    const seenKeys = new Set<string>();
    for (const key of query.keys()) {
      if (!(key in input) && !seenKeys.has(key)) {
        seenKeys.add(key);
        const values = query.getAll(key);
        input[key] = values.length === 1 ? values[0] : values;
      }
    }

    // Add body if JSON
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        const body = await req.clone().json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
          Object.assign(input, body);
        }
      } catch {
        // Invalid JSON - will be caught by validation
      }
    }

    return input;
  }

  /**
   * Return a validated response.
   * 
   * @param status - HTTP status code
   * @param data - Response data (validated against static responses[status])
   */
  protected response<S extends number>(status: S, data: unknown): Response {
    const ControllerClass = this.constructor as typeof ApiController;
    const responseSchema = ControllerClass.responses?.[status];
    
    // Validate output if schema exists
    if (responseSchema) {
      const validationResult = this.validateData(responseSchema, data);
      if (!validationResult.valid) {
        // Log error but don't expose internal details to client
        logError(`[ApiController] Response validation failed for status ${status}:`, validationResult.errors);
        return this.handleResponseValidationError(status, validationResult.errors);
      }
      data = validationResult.data;
    }

    // Serialize to JSON with error handling
    let body: string;
    try {
      body = JSON.stringify(data);
      if (body === undefined) {
        throw new Error("Data is not JSON serializable (undefined)");
      }
    } catch (error) {
      logError(`[ApiController] Failed to serialize response for status ${status}:`, error);
      return this.handleResponseValidationError(status, [{
        path: [],
        message: `Failed to serialize response: ${error instanceof Error ? error.message : String(error)}`,
        code: "serialization_error",
      }]);
    }

    // Merge with any headers set via setHeader()
    const headers = new Headers(this.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");

    return new Response(body, { status, headers });
  }

  /**
   * Validate data against a schema.
   */
  private validateData(
    schema: SchemaLike<unknown>,
    data: unknown
  ): { valid: true; data: unknown } | { valid: false; errors: ValidationErrorDetail[] } {
    try {
      // Handle function schemas
      if (typeof schema === "function") {
        return { valid: true, data: schema(data) };
      }

      // Handle zod-style schemas with safeParse
      if ("safeParse" in schema) {
        const result = schema.safeParse(data);
        if (result.success) {
          return { valid: true, data: result.data };
        }
        
        const errors = this.extractZodErrors(result.error);
        return { valid: false, errors };
      }

      // Handle schemas with parse (throws on error)
      if ("parse" in schema) {
        return { valid: true, data: schema.parse(data) };
      }

      // Unknown schema type - pass through
      return { valid: true, data };
    } catch (error) {
      const errors = this.extractErrorDetails(error);
      return { valid: false, errors };
    }
  }

  /**
   * Extract errors from zod error object.
   */
  private extractZodErrors(zodError: unknown): ValidationErrorDetail[] {
    const errors: ValidationErrorDetail[] = [];
    const errorObj = zodError as { issues?: unknown[]; errors?: unknown[]; message?: string };
    const errorList = errorObj.issues ?? errorObj.errors;
    
    if (errorList && Array.isArray(errorList)) {
      for (const err of errorList as Array<{ path?: unknown[]; message?: string; code?: string }>) {
        errors.push({
          path: (err.path ?? []) as (string | number)[],
          message: err.message ?? "Validation failed",
          code: err.code,
        });
      }
    } else {
      errors.push({
        path: [],
        message: errorObj.message ?? "Validation failed",
      });
    }
    
    return errors;
  }

  /**
   * Extract error details from thrown error.
   */
  private extractErrorDetails(error: unknown): ValidationErrorDetail[] {
    const errorObj = error as { issues?: unknown[]; errors?: unknown[] };
    const errorList = errorObj?.issues ?? errorObj?.errors;
    
    if (errorList && Array.isArray(errorList)) {
      const errors: ValidationErrorDetail[] = [];
      for (const err of errorList) {
        const errObj = err as { path?: unknown[]; message?: string; code?: string };
        errors.push({
          path: (errObj.path ?? []) as (string | number)[],
          message: errObj.message ?? "Validation failed",
          code: errObj.code,
        });
      }
      return errors;
    }
    
    if (error instanceof Error) {
      return [{ path: [], message: error.message }];
    }
    
    return [{ path: [], message: "Validation failed" }];
  }

  /**
   * Handle input validation errors.
   */
  protected handleValidationError(type: "input" | "output", errors: ValidationErrorDetail[]): Response {
    return new Response(
      JSON.stringify({
        error: "ValidationError",
        message: `Request ${type} validation failed`,
        details: errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  /**
   * Handle response validation errors.
   * This indicates a bug in the handler - response doesn't match schema.
   */
  protected handleResponseValidationError(status: number, errors: ValidationErrorDetail[]): Response {
    // In production, you might want to return a generic 500 error
    // In development, include details for debugging
    const isDev = process.env.NODE_ENV !== "production";
    
    return new Response(
      JSON.stringify({
        error: "InternalError",
        message: isDev 
          ? `Response validation failed for status ${status}` 
          : "Internal server error",
        details: isDev ? errors : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  /**
   * Handle the request. Override in subclass.
   */
  protected override async handle(): Promise<Response> {
    return this.response(501, { error: "NotImplemented", message: "Not implemented" });
  }

  /**
   * Authenticate the request.
   */
  private async authenticate(req: Request): Promise<ApiTokenVerifyResult> {
    const token = extractToken(req);

    const options: ApiProtectionOptions = {
      scopes: this.apiScopes,
      resource: this.apiResource,
      verify: this.apiVerify,
    };

    return verifyToken(token, options, req);
  }

  /**
   * Handle authentication error.
   */
  protected handleAuthError(result: ApiTokenVerifyResult): Response {
    const status = this.getAuthErrorStatus(result.errorCode);
    
    return new Response(
      JSON.stringify({
        error: "AuthenticationError",
        message: result.error,
        code: result.errorCode,
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "WWW-Authenticate": 'Bearer realm="api"',
        },
      }
    );
  }

  /**
   * Get HTTP status code for auth error.
   */
  private getAuthErrorStatus(errorCode?: string): number {
    switch (errorCode) {
      case "MISSING_TOKEN":
      case "INVALID_TOKEN":
      case "EXPIRED_TOKEN":
        return 401;
      case "INSUFFICIENT_SCOPE":
      case "FORBIDDEN_RESOURCE":
        return 403;
      case "RATE_LIMITED":
        return 429;
      default:
        return 401;
    }
  }

  // ========================================
  // Helper methods for protected endpoints
  // ========================================

  protected getApiContext(): ApiRequestContext {
    return { ...this.apiContext };
  }

  protected getApiToken(): ApiTokenConfig | undefined {
    return this.verifiedToken;
  }

  protected getClientId(): string | undefined {
    return this.verifiedToken?.clientId;
  }

  protected hasScope(scope: ApiScope): boolean {
    if (!this.verifiedToken) return false;
    const scopes = this.verifiedToken.scopes;
    return scopes.includes("*") || scopes.includes("admin") || scopes.includes(scope);
  }

  protected hasScopes(requiredScopes: ApiScope[]): boolean {
    return requiredScopes.every((scope) => this.hasScope(scope));
  }

  protected requireScope(scope: ApiScope): void {
    if (!this.hasScope(scope)) {
      throw new HttpError(403, `Insufficient permissions. Required scope: ${scope}`);
    }
  }

  protected requireScopes(scopes: ApiScope[]): void {
    if (!this.hasScopes(scopes)) {
      throw new HttpError(403, `Insufficient permissions. Required scopes: ${scopes.join(", ")}`);
    }
  }

  protected getTokenMetadata<T = unknown>(key: string): T | undefined {
    return this.verifiedToken?.metadata?.[key] as T | undefined;
  }

  protected isAuthenticated(): boolean {
    return this.apiContext.authenticated;
  }

  // ========================================
  // Legacy support - deprecated methods
  // ========================================

  /**
   * @deprecated Use `this.input` getter instead
   */
  protected getInput<T = unknown>(): T {
    logWarn(`[${this.constructor.name}] getInput() is deprecated, use 'this.input' instead`);
    return this._input as T;
  }

  /**
   * @deprecated Use `handle()` with `this.input` and `this.response()` instead
   */
  protected async handleRequest(_input?: unknown): Promise<Response> {
    logWarn(`[${this.constructor.name}] handleRequest() is deprecated, use 'handle()' instead`);
    return this.handle();
  }
}
