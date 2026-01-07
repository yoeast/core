import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("error handling integration", () => {
  test("returns json for HttpError", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/error`);
      expect(res.status).toBe(418);
      expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
      const body = await res.json();
      expect(body).toEqual({
        error: "HttpError",
        message: "Teapot",
        status: 418,
        code: "E_TEAPOT",
      });
    } finally {
      await server.stop();
    }
  });
});
