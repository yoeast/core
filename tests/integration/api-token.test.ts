import { describe, expect, test, beforeEach } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";
import { getTokenStore, setTokenStore, DefaultTokenStore } from "@core";

describe("API token authentication", () => {
  // Reset token store before each test
  beforeEach(() => {
    setTokenStore(new DefaultTokenStore());
  });

  test("unprotected endpoint returns 200 without token", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/public`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { authenticated: boolean };
      expect(body.authenticated).toBe(false);
    } finally {
      await server.stop();
    }
  });

  test("protected endpoint returns 401 without token", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/protected`);
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string; code: string };
      expect(body.error).toBe("AuthenticationError");
      expect(body.code).toBe("MISSING_TOKEN");
    } finally {
      await server.stop();
    }
  });

  test("protected endpoint returns 401 with invalid token", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { "X-API-Token": "invalid" },
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("INVALID_TOKEN");
    } finally {
      await server.stop();
    }
  });

  test("protected endpoint returns 401 with 'false' token", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { "X-API-Token": "false" },
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("INVALID_TOKEN");
    } finally {
      await server.stop();
    }
  });

  test("protected endpoint returns 200 with valid token", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { "X-API-Token": "valid-token-123" },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { authenticated: boolean; clientId: string };
      expect(body.authenticated).toBe(true);
      expect(body.clientId).toBe("stub-client");
    } finally {
      await server.stop();
    }
  });

  test("accepts Bearer token in Authorization header", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { Authorization: "Bearer my-bearer-token" },
      });
      expect(res.status).toBe(200);
    } finally {
      await server.stop();
    }
  });

  test("accepts X-Api-Key header", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { "X-Api-Key": "my-api-key" },
      });
      expect(res.status).toBe(200);
    } finally {
      await server.stop();
    }
  });
});

describe("API token scopes", () => {
  beforeEach(() => {
    setTokenStore(new DefaultTokenStore());
  });

  test("admin endpoint requires admin scope", async () => {
    const server = await startTestServer();
    try {
      // Register a token without admin scope
      const store = getTokenStore();
      store.registerToken({
        token: "limited-token",
        scopes: ["read"],
        clientId: "limited-client",
      });

      const res = await fetch(`${server.baseUrl}/api/admin`, {
        headers: { "X-API-Token": "limited-token" },
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("INSUFFICIENT_SCOPE");
    } finally {
      await server.stop();
    }
  });

  test("admin endpoint allows token with admin scope", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "admin-token",
        scopes: ["admin"],
        clientId: "admin-client",
      });

      const res = await fetch(`${server.baseUrl}/api/admin`, {
        headers: { "X-API-Token": "admin-token" },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { clientId: string };
      expect(body.clientId).toBe("admin-client");
    } finally {
      await server.stop();
    }
  });

  test("wildcard scope grants access to admin endpoint", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "wildcard-token",
        scopes: ["*"],
        clientId: "wildcard-client",
      });

      const res = await fetch(`${server.baseUrl}/api/admin`, {
        headers: { "X-API-Token": "wildcard-token" },
      });
      expect(res.status).toBe(200);
    } finally {
      await server.stop();
    }
  });
});

describe("API token resources", () => {
  beforeEach(() => {
    setTokenStore(new DefaultTokenStore());
  });

  test("resource endpoint denies token without resource access", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "posts-only-token",
        scopes: ["*"],
        resources: ["posts:*"], // Only posts, not users
        clientId: "posts-client",
      });

      const res = await fetch(`${server.baseUrl}/api/users`, {
        headers: { "X-API-Token": "posts-only-token" },
      });
      expect(res.status).toBe(403);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("FORBIDDEN_RESOURCE");
    } finally {
      await server.stop();
    }
  });

  test("resource endpoint allows token with exact resource match", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "users-read-token",
        scopes: ["*"],
        resources: ["users:read"],
        clientId: "users-client",
      });

      const res = await fetch(`${server.baseUrl}/api/users`, {
        headers: { "X-API-Token": "users-read-token" },
      });
      expect(res.status).toBe(200);
    } finally {
      await server.stop();
    }
  });

  test("resource endpoint allows token with wildcard resource", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "users-all-token",
        scopes: ["*"],
        resources: ["users:*"],
        clientId: "users-client",
      });

      const res = await fetch(`${server.baseUrl}/api/users`, {
        headers: { "X-API-Token": "users-all-token" },
      });
      expect(res.status).toBe(200);
    } finally {
      await server.stop();
    }
  });
});

describe("API token expiration", () => {
  beforeEach(() => {
    setTokenStore(new DefaultTokenStore());
  });

  test("expired token returns 401", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "expired-token",
        scopes: ["*"],
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        clientId: "expired-client",
      });

      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { "X-API-Token": "expired-token" },
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("EXPIRED_TOKEN");
    } finally {
      await server.stop();
    }
  });

  test("non-expired token returns 200", async () => {
    const server = await startTestServer();
    try {
      const store = getTokenStore();
      store.registerToken({
        token: "valid-token",
        scopes: ["*"],
        expiresAt: new Date(Date.now() + 3600000), // Expires in 1 hour
        clientId: "valid-client",
      });

      const res = await fetch(`${server.baseUrl}/api/protected`, {
        headers: { "X-API-Token": "valid-token" },
      });
      expect(res.status).toBe(200);
    } finally {
      await server.stop();
    }
  });
});
