import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("response throwing integration", () => {
  test("returns thrown Response as-is", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/throw`);
      expect(res.status).toBe(403);
      expect(await res.text()).toBe("Forbidden");
    } finally {
      await server.stop();
    }
  });
});
