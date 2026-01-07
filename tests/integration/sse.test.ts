import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("sse integration", () => {
  test("streams event data", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/events`);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");
      const reader = res.body?.getReader();
      expect(reader).not.toBeNull();
      const { value } = await reader!.read();
      const chunk = new TextDecoder().decode(value);
      expect(chunk).toContain("event: hello");
      expect(chunk).toContain("data: world");
    } finally {
      await server.stop();
    }
  });

  test("streams multiple events quickly", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/events-fast`);
      expect(res.status).toBe(200);
      const reader = res.body?.getReader();
      expect(reader).not.toBeNull();

      const first = await reader!.read();
      const second = await reader!.read();
      const text =
        new TextDecoder().decode((first.value ?? new Uint8Array()).slice()) +
        new TextDecoder().decode((second.value ?? new Uint8Array()).slice());

      expect(text).toContain("event: one");
      expect(text).toContain("data: first");
      expect(text).toContain("event: two");
      expect(text).toContain("data: second");
    } finally {
      await server.stop();
    }
  });
});
