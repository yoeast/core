/**
 * API Token Verifier
 * 
 * Handles token extraction, validation, and authorization.
 */

import type {
  ApiScope,
  ApiTokenConfig,
  ApiTokenVerifyResult,
  ApiProtectionOptions,
  ResourcePattern,
} from "./types";
import { getTokenStore } from "./token-store";
import { config } from "../config";

/** Default header name for API tokens */
const DEFAULT_TOKEN_HEADER = "X-API-Token";

/** Alternative header names to check */
const ALTERNATIVE_HEADERS = [
  "Authorization",
  "X-Api-Key",
  "Api-Key",
];

/**
 * Extract API token from request headers.
 * 
 * Checks (in order):
 * 1. X-API-Token header
 * 2. Authorization header (Bearer token)
 * 3. X-Api-Key header
 * 4. Api-Key header
 */
export function extractToken(req: Request): string | null {
  // Get custom header name from config, with fallback
  let headerName = DEFAULT_TOKEN_HEADER;
  try {
    headerName = config<string>("api.tokenHeader", DEFAULT_TOKEN_HEADER);
  } catch {
    // Config not initialized, use default
  }
  
  // Primary header
  const primaryToken = req.headers.get(headerName);
  if (primaryToken) {
    return primaryToken;
  }

  // Authorization header with Bearer prefix
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
    // Also accept raw token in Authorization header
    if (!authHeader.includes(" ")) {
      return authHeader;
    }
  }

  // Check alternative headers
  for (const header of ALTERNATIVE_HEADERS) {
    if (header === "Authorization") continue; // Already checked
    const token = req.headers.get(header);
    if (token) {
      return token;
    }
  }

  return null;
}

/**
 * Verify an API token.
 * 
 * @param token - The token string to verify
 * @param options - Protection options (required scopes, resource, custom verify)
 * @param req - The request object (for custom verification)
 */
export async function verifyToken(
  token: string | null,
  options: ApiProtectionOptions = {},
  req?: Request
): Promise<ApiTokenVerifyResult> {
  // No token provided
  if (!token) {
    return {
      valid: false,
      error: "API token required",
      errorCode: "MISSING_TOKEN",
    };
  }

  // Custom verification function
  if (options.verify && req) {
    return options.verify(token, req);
  }

  const store = getTokenStore();

  // Find token
  const tokenConfig = await store.findToken(token);
  if (!tokenConfig) {
    return {
      valid: false,
      error: "Invalid API token",
      errorCode: "INVALID_TOKEN",
    };
  }

  // Validate token (expiration, etc.)
  const isValid = await store.validateToken(tokenConfig);
  if (!isValid) {
    return {
      valid: false,
      error: "API token expired or revoked",
      errorCode: "EXPIRED_TOKEN",
    };
  }

  // Check required scopes
  if (options.scopes && options.scopes.length > 0) {
    if (!store.hasScopes(tokenConfig, options.scopes)) {
      return {
        valid: false,
        error: `Insufficient permissions. Required scopes: ${options.scopes.join(", ")}`,
        errorCode: "INSUFFICIENT_SCOPE",
        token: tokenConfig,
      };
    }
  }

  // Check resource access
  if (options.resource) {
    if (!store.canAccessResource(tokenConfig, options.resource)) {
      return {
        valid: false,
        error: `Access denied to resource: ${options.resource}`,
        errorCode: "FORBIDDEN_RESOURCE",
        token: tokenConfig,
      };
    }
  }

  // Check rate limit
  if (store.checkRateLimit) {
    const allowed = await store.checkRateLimit(tokenConfig);
    if (!allowed) {
      return {
        valid: false,
        error: "Rate limit exceeded",
        errorCode: "RATE_LIMITED",
        token: tokenConfig,
      };
    }
  }

  // All checks passed
  return {
    valid: true,
    token: tokenConfig,
    scopes: tokenConfig.scopes,
  };
}

/**
 * Helper to check if a scope matches requirements.
 * 
 * @example
 * scopeMatches("read", "read")     // true
 * scopeMatches("*", "read")        // true
 * scopeMatches("admin", "read")    // true
 * scopeMatches("write", "read")    // false
 */
export function scopeMatches(tokenScope: ApiScope, requiredScope: ApiScope): boolean {
  if (tokenScope === "*" || tokenScope === "admin") {
    return true;
  }
  return tokenScope === requiredScope;
}

/**
 * Helper to check if a resource pattern matches.
 * 
 * @example
 * resourceMatches("users", "users")           // true
 * resourceMatches("users:*", "users:read")    // true
 * resourceMatches("users:read", "users:write") // false
 */
export function resourceMatches(pattern: ResourcePattern, resource: ResourcePattern): boolean {
  if (pattern === "*") {
    return true;
  }

  if (pattern === resource) {
    return true;
  }

  // Wildcard patterns
  if (pattern.endsWith(":*") || pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -1);
    return resource.startsWith(prefix);
  }

  return false;
}

/**
 * Generate a simple API token (for development/testing).
 * 
 * In production, use a proper token generation service with:
 * - Cryptographically secure random bytes
 * - Proper hashing/signing
 * - Token storage
 */
export function generateSimpleToken(prefix = "core"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2);
  const random2 = Math.random().toString(36).slice(2);
  return `${prefix}_${timestamp}_${random}${random2}`;
}
