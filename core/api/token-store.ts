/**
 * API Token Store - Default in-memory implementation
 * 
 * This is a stub implementation that always validates tokens.
 * In production, replace with a database-backed store.
 */

import type {
  ApiTokenConfig,
  ApiTokenStore,
  ApiScope,
  ResourcePattern,
} from "./types";

/**
 * Default token store - in-memory with stub validation.
 * 
 * Current behavior:
 * - Returns valid for any token EXCEPT "false" or empty
 * - Grants all scopes by default
 * - Allows all resources
 * 
 * TODO: Replace with database-backed implementation
 */
export class DefaultTokenStore implements ApiTokenStore {
  private tokens = new Map<string, ApiTokenConfig>();
  private revokedTokens = new Set<string>();

  /**
   * Register a token (for testing or static configuration).
   */
  registerToken(config: ApiTokenConfig): void {
    this.tokens.set(config.token, config);
    this.revokedTokens.delete(config.token); // Un-revoke if previously revoked
  }

  /**
   * Remove a registered token.
   */
  revokeToken(token: string): boolean {
    this.revokedTokens.add(token); // Track as revoked for stub behavior
    return this.tokens.delete(token);
  }

  /**
   * Find token by value.
   * 
   * Stub behavior: Returns a default config for any non-empty token
   * except "false", which returns null (for testing).
   */
  async findToken(token: string): Promise<ApiTokenConfig | null> {
    // Check if explicitly revoked
    if (this.revokedTokens.has(token)) {
      return null;
    }

    // Check registered tokens first
    const registered = this.tokens.get(token);
    if (registered) {
      return registered;
    }

    // Stub behavior: reject "false" token for testing
    if (!token || token === "false" || token === "invalid") {
      return null;
    }

    // Stub: return a default token config with all permissions
    return {
      token,
      name: "stub-token",
      scopes: ["*"],
      clientId: "stub-client",
    };
  }

  /**
   * Validate token (check expiration, etc.).
   */
  async validateToken(config: ApiTokenConfig): Promise<boolean> {
    // Check expiration
    if (config.expiresAt && new Date() > config.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Check if token has required scopes.
   */
  hasScopes(token: ApiTokenConfig, requiredScopes: ApiScope[]): boolean {
    // Wildcard scope grants everything
    if (token.scopes.includes("*")) {
      return true;
    }

    // Admin scope grants everything
    if (token.scopes.includes("admin")) {
      return true;
    }

    // Check each required scope
    return requiredScopes.every((required) => {
      if (required === "*") {
        // Requesting all scopes - need admin or wildcard
        return token.scopes.includes("admin");
      }
      return token.scopes.includes(required);
    });
  }

  /**
   * Check if token can access resource.
   * 
   * Resource patterns support:
   * - Exact match: "users" matches "users"
   * - Wildcard: "users:*" matches "users:read", "users:write"
   * - Global wildcard: "*" matches everything
   */
  canAccessResource(token: ApiTokenConfig, resource: ResourcePattern): boolean {
    // No resource restrictions
    if (!token.resources || token.resources.length === 0) {
      return true;
    }

    return token.resources.some((pattern) => {
      // Global wildcard
      if (pattern === "*") {
        return true;
      }

      // Exact match
      if (pattern === resource) {
        return true;
      }

      // Wildcard pattern: "users:*" matches "users:read"
      if (pattern.endsWith(":*")) {
        const prefix = pattern.slice(0, -1); // "users:"
        return resource.startsWith(prefix);
      }

      // Wildcard pattern: "users.*" matches "users.read"
      if (pattern.endsWith(".*")) {
        const prefix = pattern.slice(0, -1); // "users."
        return resource.startsWith(prefix);
      }

      return false;
    });
  }

  /**
   * Check rate limit (stub - always allows).
   * 
   * TODO: Implement with Redis or in-memory sliding window
   */
  async checkRateLimit(_token: ApiTokenConfig): Promise<boolean> {
    // Stub: always allow
    return true;
  }
}

// Singleton instance
let defaultStore: DefaultTokenStore | null = null;

/**
 * Get the default token store instance.
 */
export function getTokenStore(): DefaultTokenStore {
  if (!defaultStore) {
    defaultStore = new DefaultTokenStore();
  }
  return defaultStore;
}

/**
 * Set a custom token store (for testing or custom implementations).
 */
export function setTokenStore(store: DefaultTokenStore): void {
  defaultStore = store;
}
