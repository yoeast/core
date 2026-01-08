/**
 * Tests for ApiController input validation.
 */
import { describe, test, expect, afterAll } from "bun:test";
import { startServer, stopServer } from "@yoeast/core";

const TEST_PORT = 3098;

async function startTestServer(): Promise<{ server: import("bun").Server<unknown>; baseUrl: string }> {
  const server = await startServer({
    port: TEST_PORT,
    rootDir: "tests/fixtures",
    silent: true,
  });
  return { server, baseUrl: `http://localhost:${TEST_PORT}` };
}

afterAll(async () => {
  await stopServer();
});

describe("ApiController input validation", () => {
  describe("with zod schema", () => {
    test("valid input returns 200", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            name: "Test User",
          }),
        });
        expect(res.status).toBe(200);
        const data = await res.json() as { success: boolean; user: { email: string; name: string } };
        expect(data.success).toBe(true);
        expect(data.user.email).toBe("test@example.com");
        expect(data.user.name).toBe("Test User");
      } finally {
        await stopServer();
      }
    });

    test("valid input without optional field returns 200", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        });
        expect(res.status).toBe(200);
        const data = await res.json() as { user: { name: string | null } };
        expect(data.user.name).toBe(null);
      } finally {
        await stopServer();
      }
    });

    test("invalid email returns 400 validation error", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email",
            password: "password123",
          }),
        });
        expect(res.status).toBe(400);
        const data = await res.json() as { error: string; message: string; details: unknown[] };
        expect(data.error).toBe("ValidationError");
        expect(data.details.length).toBeGreaterThan(0);
      } finally {
        await stopServer();
      }
    });

    test("password too short returns 400 validation error", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "short",
          }),
        });
        expect(res.status).toBe(400);
        const data = await res.json() as { error: string; details: Array<{ path: string[] }> };
        expect(data.error).toBe("ValidationError");
        // Should have path to the failed field
        const passwordError = data.details.find(d => d.path.includes("password"));
        expect(passwordError).toBeDefined();
      } finally {
        await stopServer();
      }
    });

    test("missing required fields returns 400 validation error", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        expect(res.status).toBe(400);
        const data = await res.json() as { error: string };
        expect(data.error).toBe("ValidationError");
      } finally {
        await stopServer();
      }
    });
  });

  describe("without schema (types only)", () => {
    test("route params are passed as input", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/echo/test_123`);
        expect(res.status).toBe(200);
        const data = await res.json() as { input: { id: string } };
        expect(data.input.id).toBe("test_123");
      } finally {
        await stopServer();
      }
    });
  });

  describe("input merging", () => {
    test("query params are included in input", async () => {
      const { baseUrl } = await startTestServer();
      try {
        const res = await fetch(`${baseUrl}/api/echo/test_456?format=json&limit=10`);
        expect(res.status).toBe(200);
        const data = await res.json() as { input: { id: string; format: string; limit: string } };
        expect(data.input.id).toBe("test_456");
        expect(data.input.format).toBe("json");
        expect(data.input.limit).toBe("10");
      } finally {
        await stopServer();
      }
    });
  });
});
