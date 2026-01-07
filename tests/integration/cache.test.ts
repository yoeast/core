import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("cache integration", () => {
  test("returns etag and 304 on match", async () => {
    const server = await startTestServer();
    try {
      const res1 = await fetch(`${server.baseUrl}/cache?key=alpha`);
      expect(res1.status).toBe(200);
      const etag = res1.headers.get("ETag");
      expect(etag).not.toBeNull();
      const body1 = await res1.json();
      expect(body1.key).toBe("alpha");

      const res2 = await fetch(`${server.baseUrl}/cache?key=alpha`, {
        headers: { "If-None-Match": etag ?? "" },
      });
      expect(res2.status).toBe(304);
    } finally {
      await server.stop();
    }
  });
});
