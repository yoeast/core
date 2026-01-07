import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("route matchers integration", () => {
  test("accepts number param and rejects non-number", async () => {
    const server = await startTestServer();
    try {
      const ok = await fetch(`${server.baseUrl}/api/users/123`);
      expect(ok.status).toBe(200);
      expect(await ok.json()).toEqual({ id: "123", type: "number" });

      const bad = await fetch(`${server.baseUrl}/api/users/herp`);
      expect(bad.status).toBe(404);
    } finally {
      await server.stop();
    }
  });
});
