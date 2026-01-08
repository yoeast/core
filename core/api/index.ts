/**
 * API Module - Token-based API authentication and authorization.
 */

export * from "./types";
export { DefaultTokenStore, getTokenStore, setTokenStore } from "./token-store";
export {
  extractToken,
  verifyToken,
  scopeMatches,
  resourceMatches,
  generateSimpleToken,
} from "./verifier";
export {
  generateOpenApiSpec,
  clearOpenApiCache,
  type OpenApiSpec,
} from "./openapi";
