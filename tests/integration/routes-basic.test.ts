import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("routes integration", () => {
  test("serves root and params", async () => {
    const server = await startTestServer();
    try {
      const root = await fetch(`${server.baseUrl}/`);
      expect(root.status).toBe(200);
      const rootBody = await root.json();
      expect(rootBody).toEqual({ ok: true, route: "/" });

      const user = await fetch(`${server.baseUrl}/users/123`);
      expect(user.status).toBe(200);
      expect(await user.json()).toEqual({ id: "123" });
    } finally {
      await server.stop();
    }
  });
});

  test("returns 404 for unknown route", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/nope`);
      expect(res.status).toBe(404);
      expect(await res.text()).toBe("Not Found");
    } finally {
      await server.stop();
    }
  });
