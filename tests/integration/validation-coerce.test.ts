import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("coercion integration", () => {
  test("coerces params and query types", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/coerce/42?active=true&score=3.5&empty=null`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        params: { id: 42 },
        query: { active: true, score: 3.5, empty: null },
      });
    } finally {
      await server.stop();
    }
  });
});
