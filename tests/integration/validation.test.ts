import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("validation integration", () => {
  test("accepts valid body", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "bun" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, name: "bun" });
    } finally {
      await server.stop();
    }
  });

  test("rejects missing body", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Missing name");
    } finally {
      await server.stop();
    }
  });
});
