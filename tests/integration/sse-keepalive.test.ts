import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("sse keep-alive integration", () => {
  test("emits keep-alive comment", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/events-ping`);
      const reader = res.body?.getReader();
      expect(reader).not.toBeNull();

      const first = await reader!.read();
      const second = await reader!.read();
      const text =
        new TextDecoder().decode(first.value ?? new Uint8Array()) +
        new TextDecoder().decode(second.value ?? new Uint8Array());

      expect(text).toContain("event: ping");
      expect(text).toContain("data: 1");
      expect(text).toContain(": keep-alive");
    } finally {
      await server.stop();
    }
  });
});
