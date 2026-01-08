import { describe, expect, test, beforeEach } from "bun:test";
import {
  extractToken,
  verifyToken,
  scopeMatches,
  resourceMatches,
  generateSimpleToken,
  DefaultTokenStore,
  setTokenStore,
  getTokenStore,
} from "@yoeast/core/api";

describe("extractToken", () => {
  test("extracts from X-API-Token header", () => {
    const req = new Request("http://example.test", {
      headers: { "X-API-Token": "my-token" },
    });
    expect(extractToken(req)).toBe("my-token");
  });

  test("extracts Bearer token from Authorization header", () => {
    const req = new Request("http://example.test", {
      headers: { Authorization: "Bearer bearer-token" },
    });
    expect(extractToken(req)).toBe("bearer-token");
  });

  test("extracts raw token from Authorization header", () => {
    const req = new Request("http://example.test", {
      headers: { Authorization: "raw-token" },
    });
    expect(extractToken(req)).toBe("raw-token");
  });

  test("extracts from X-Api-Key header", () => {
    const req = new Request("http://example.test", {
      headers: { "X-Api-Key": "api-key" },
    });
    expect(extractToken(req)).toBe("api-key");
  });

  test("extracts from Api-Key header", () => {
    const req = new Request("http://example.test", {
      headers: { "Api-Key": "api-key-2" },
    });
    expect(extractToken(req)).toBe("api-key-2");
  });

  test("prefers X-API-Token over other headers", () => {
    const req = new Request("http://example.test", {
      headers: {
        "X-API-Token": "primary",
        Authorization: "Bearer secondary",
      },
    });
    expect(extractToken(req)).toBe("primary");
  });

  test("returns null when no token present", () => {
    const req = new Request("http://example.test");
    expect(extractToken(req)).toBeNull();
  });
});

describe("verifyToken", () => {
  beforeEach(() => {
    setTokenStore(new DefaultTokenStore());
  });

  test("returns error for null token", async () => {
    const result = await verifyToken(null);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("MISSING_TOKEN");
  });

  test("returns error for empty token", async () => {
    const result = await verifyToken("");
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("MISSING_TOKEN"); // Empty string = missing
  });

  test("returns error for 'false' token", async () => {
    const result = await verifyToken("false");
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_TOKEN");
  });

  test("returns valid for any other token (stub behavior)", async () => {
    const result = await verifyToken("any-valid-token");
    expect(result.valid).toBe(true);
    expect(result.token?.token).toBe("any-valid-token");
    expect(result.scopes).toContain("*");
  });

  test("validates registered token with correct scopes", async () => {
    const store = getTokenStore();
    store.registerToken({
      token: "read-only-token",
      scopes: ["read"],
      clientId: "test-client",
    });

    const result = await verifyToken("read-only-token");
    expect(result.valid).toBe(true);
    expect(result.token?.scopes).toEqual(["read"]);
  });

  test("rejects token with insufficient scopes", async () => {
    const store = getTokenStore();
    store.registerToken({
      token: "limited-token",
      scopes: ["read"],
    });

    const result = await verifyToken("limited-token", { scopes: ["admin"] });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_SCOPE");
  });

  test("accepts token with wildcard scope", async () => {
    const store = getTokenStore();
    store.registerToken({
      token: "wildcard-token",
      scopes: ["*"],
    });

    const result = await verifyToken("wildcard-token", { scopes: ["admin", "write", "delete"] });
    expect(result.valid).toBe(true);
  });

  test("rejects expired token", async () => {
    const store = getTokenStore();
    store.registerToken({
      token: "expired-token",
      scopes: ["*"],
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await verifyToken("expired-token");
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("EXPIRED_TOKEN");
  });

  test("rejects token without resource access", async () => {
    const store = getTokenStore();
    store.registerToken({
      token: "limited-resource-token",
      scopes: ["*"],
      resources: ["posts:*"],
    });

    const result = await verifyToken("limited-resource-token", { resource: "users:read" });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("FORBIDDEN_RESOURCE");
  });
});

describe("scopeMatches", () => {
  test("exact match returns true", () => {
    expect(scopeMatches("read", "read")).toBe(true);
    expect(scopeMatches("write", "write")).toBe(true);
  });

  test("different scope returns false", () => {
    expect(scopeMatches("read", "write")).toBe(false);
    expect(scopeMatches("write", "admin")).toBe(false);
  });

  test("wildcard matches any scope", () => {
    expect(scopeMatches("*", "read")).toBe(true);
    expect(scopeMatches("*", "admin")).toBe(true);
  });

  test("admin matches any scope", () => {
    expect(scopeMatches("admin", "read")).toBe(true);
    expect(scopeMatches("admin", "write")).toBe(true);
  });
});

describe("resourceMatches", () => {
  test("exact match returns true", () => {
    expect(resourceMatches("users", "users")).toBe(true);
    expect(resourceMatches("posts:read", "posts:read")).toBe(true);
  });

  test("different resource returns false", () => {
    expect(resourceMatches("users", "posts")).toBe(false);
    expect(resourceMatches("users:read", "users:write")).toBe(false);
  });

  test("global wildcard matches everything", () => {
    expect(resourceMatches("*", "users")).toBe(true);
    expect(resourceMatches("*", "posts:read")).toBe(true);
  });

  test("colon wildcard matches prefix", () => {
    expect(resourceMatches("users:*", "users:read")).toBe(true);
    expect(resourceMatches("users:*", "users:write")).toBe(true);
    expect(resourceMatches("users:*", "posts:read")).toBe(false);
  });

  test("dot wildcard matches prefix", () => {
    expect(resourceMatches("users.*", "users.read")).toBe(true);
    expect(resourceMatches("users.*", "posts.read")).toBe(false);
  });
});

describe("generateSimpleToken", () => {
  test("generates unique tokens", () => {
    const token1 = generateSimpleToken();
    const token2 = generateSimpleToken();
    expect(token1).not.toBe(token2);
  });

  test("includes prefix", () => {
    const token = generateSimpleToken("myapp");
    expect(token.startsWith("myapp_")).toBe(true);
  });

  test("default prefix is core", () => {
    const token = generateSimpleToken();
    expect(token.startsWith("core_")).toBe(true);
  });
});

describe("DefaultTokenStore", () => {
  let store: DefaultTokenStore;

  beforeEach(() => {
    store = new DefaultTokenStore();
  });

  test("registerToken and findToken", async () => {
    store.registerToken({
      token: "test-token",
      scopes: ["read"],
      name: "Test Token",
    });

    const found = await store.findToken("test-token");
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Test Token");
  });

  test("revokeToken removes token", async () => {
    store.registerToken({
      token: "to-revoke",
      scopes: ["*"],
    });

    expect(await store.findToken("to-revoke")).not.toBeNull();
    
    const revoked = store.revokeToken("to-revoke");
    expect(revoked).toBe(true);
    expect(await store.findToken("to-revoke")).toBeNull();
  });

  test("hasScopes with wildcard", () => {
    const token = { token: "t", scopes: ["*"] as ("*")[], name: "t" };
    expect(store.hasScopes(token, ["read", "write", "admin"])).toBe(true);
  });

  test("hasScopes with admin", () => {
    const token = { token: "t", scopes: ["admin"] as ("admin")[], name: "t" };
    expect(store.hasScopes(token, ["read", "write"])).toBe(true);
  });

  test("hasScopes with specific scopes", () => {
    const token = { token: "t", scopes: ["read", "write"] as ("read" | "write")[], name: "t" };
    expect(store.hasScopes(token, ["read"])).toBe(true);
    expect(store.hasScopes(token, ["read", "write"])).toBe(true);
    expect(store.hasScopes(token, ["admin"])).toBe(false);
  });

  test("canAccessResource with no restrictions", () => {
    const token = { token: "t", scopes: ["*"] as ("*")[] };
    expect(store.canAccessResource(token, "users:read")).toBe(true);
  });

  test("canAccessResource with exact match", () => {
    const token = { token: "t", scopes: ["*"] as ("*")[], resources: ["users:read"] };
    expect(store.canAccessResource(token, "users:read")).toBe(true);
    expect(store.canAccessResource(token, "users:write")).toBe(false);
  });

  test("canAccessResource with wildcard pattern", () => {
    const token = { token: "t", scopes: ["*"] as ("*")[], resources: ["users:*"] };
    expect(store.canAccessResource(token, "users:read")).toBe(true);
    expect(store.canAccessResource(token, "users:write")).toBe(true);
    expect(store.canAccessResource(token, "posts:read")).toBe(false);
  });
});
