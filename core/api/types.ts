/**
 * API Token System Types
 * 
 * Provides interfaces and types for API authentication and authorization.
 */

/** API Token scopes - define what actions a token can perform */
export type ApiScope = 
  | "read"           // Read-only access
  | "write"          // Write access (create, update)
  | "delete"         // Delete access
  | "admin"          // Full administrative access
  | "*";             // Wildcard - all scopes

/** Resource pattern for scope matching */
export type ResourcePattern = string; // e.g., "users", "users:*", "posts:read"

/** API Token configuration */
export interface ApiTokenConfig {
  /** The token value */
  token: string;
  /** Token identifier/name (for logging) */
  name?: string;
  /** Allowed scopes */
  scopes: ApiScope[];
  /** Allowed resource patterns (optional - empty means all) */
  resources?: ResourcePattern[];
  /** Rate limit per minute (optional) */
  rateLimit?: number;
  /** Token expiration date (optional) */
  expiresAt?: Date;
  /** Associated user/client ID (optional) */
  clientId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/** Result of token verification */
export interface ApiTokenVerifyResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: ApiTokenErrorCode;
  /** The resolved token config (if valid) */
  token?: ApiTokenConfig;
  /** Resolved scopes for this request */
  scopes?: ApiScope[];
}

/** Token error codes */
export type ApiTokenErrorCode =
  | "MISSING_TOKEN"
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "INSUFFICIENT_SCOPE"
  | "RATE_LIMITED"
  | "FORBIDDEN_RESOURCE";

/** Options for API endpoint protection */
export interface ApiProtectionOptions {
  /** Required scopes for this endpoint */
  scopes?: ApiScope[];
  /** Required resource pattern */
  resource?: ResourcePattern;
  /** Custom verification function */
  verify?: (token: string, req: Request) => Promise<ApiTokenVerifyResult> | ApiTokenVerifyResult;
}

/** Token store interface - for custom token storage implementations */
export interface ApiTokenStore {
  /** Find token by value */
  findToken(token: string): Promise<ApiTokenConfig | null>;
  /** Validate token (check expiration, revocation, etc.) */
  validateToken(token: ApiTokenConfig): Promise<boolean>;
  /** Check if token has required scopes */
  hasScopes(token: ApiTokenConfig, requiredScopes: ApiScope[]): boolean;
  /** Check if token can access resource */
  canAccessResource(token: ApiTokenConfig, resource: ResourcePattern): boolean;
  /** Check rate limit (returns true if allowed) */
  checkRateLimit?(token: ApiTokenConfig): Promise<boolean>;
}

/** Request context added by API authentication */
export interface ApiRequestContext {
  /** Whether request is authenticated */
  authenticated: boolean;
  /** The verified token (if authenticated) */
  token?: ApiTokenConfig;
  /** Client ID from token */
  clientId?: string;
  /** Available scopes */
  scopes: ApiScope[];
}
