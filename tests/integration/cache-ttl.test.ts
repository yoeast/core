import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("cache ttl integration", () => {
  test("cache entry expires after ttl", async () => {
    const server = await startTestServer();
    try {
      const res1 = await fetch(`${server.baseUrl}/cache-ttl`);
      const etag = res1.headers.get("ETag");
      expect(etag).not.toBeNull();

      const res2 = await fetch(`${server.baseUrl}/cache-ttl`, {
        headers: { "If-None-Match": etag ?? "" },
      });
      expect(res2.status).toBe(304);

      await sleep(60);

      const res3 = await fetch(`${server.baseUrl}/cache-ttl`, {
        headers: { "If-None-Match": etag ?? "" },
      });
      expect(res3.status).toBe(200);
      expect(res3.headers.get("ETag")).not.toBe(etag);
    } finally {
      await server.stop();
    }
  });
});
