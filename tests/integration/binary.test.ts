import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("binary streaming integration", () => {
  test("streams bytes", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/binary`);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(Array.from(bytes)).toEqual([0, 1, 2, 255]);
    } finally {
      await server.stop();
    }
  });
});
