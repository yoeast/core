import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("validation schema vs matcher", () => {
  test("accepts numeric id even with slug matcher", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate-schema/123`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ id: 123 });
    } finally {
      await server.stop();
    }
  });

  test("rejects non-numeric id via schema", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/validate-schema/abc`);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { message: string };
      expect(body.message).toBe("Schema requires numeric id");
    } finally {
      await server.stop();
    }
  });
});
