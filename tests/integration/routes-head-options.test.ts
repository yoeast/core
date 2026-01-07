import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("HEAD/OPTIONS routes integration", () => {
  test("HEAD fallback uses GET and strips body", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/auto`, { method: "HEAD" });
      expect(res.status).toBe(200);
      expect(res.headers.get("X-Auto")).toBe("ok");
      const text = await res.text();
      expect(text).toBe("");
    } finally {
      await server.stop();
    }
  });

  test("OPTIONS auto-generates allow header", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/auto`, { method: "OPTIONS" });
      expect(res.status).toBe(204);
      const allow = res.headers.get("Allow") ?? "";
      expect(allow).toContain("GET");
      expect(allow).toContain("HEAD");
      expect(allow).toContain("OPTIONS");
    } finally {
      await server.stop();
    }
  });
});
