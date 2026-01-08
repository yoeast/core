import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("validation params/query integration", () => {
  test("accepts valid params and query", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate-params/42?tag=ok`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ id: 42, tag: "ok" });
    } finally {
      await server.stop();
    }
  });

  test("rejects invalid params", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate-params/abc?tag=ok`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { message: string };
      expect(body.message).toBe("Invalid id");
    } finally {
      await server.stop();
    }
  });

  test("rejects missing query", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate-params/42`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { message: string };
      expect(body.message).toBe("Missing tag");
    } finally {
      await server.stop();
    }
  });
});
