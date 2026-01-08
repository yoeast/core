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
      expect(res1.headers.get("X-Cache")).toBe("MISS"); // First request is a miss

      const res2 = await fetch(`${server.baseUrl}/cache-ttl`, {
        headers: { "If-None-Match": etag ?? "" },
      });
      expect(res2.status).toBe(304);
      expect(res2.headers.get("X-Cache")).toBe("HIT"); // Second request is a hit

      // Wait for cache to expire (TTL is 2 seconds)
      await sleep(2100);

      const res3 = await fetch(`${server.baseUrl}/cache-ttl`, {
        headers: { "If-None-Match": etag ?? "" },
      });
      expect(res3.status).toBe(200);
      expect(res3.headers.get("ETag")).not.toBe(etag);
      expect(res3.headers.get("X-Cache")).toBe("MISS"); // After expiry, it's a miss again
    } finally {
      await server.stop();
    }
  });
});
