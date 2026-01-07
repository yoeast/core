import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("websocket close integration", () => {
  test("close handler runs on client close", async () => {
    const server = await startTestServer();
    try {
      await fetch(`${server.baseUrl}/ws/close-count?reset=1`);
      const url = server.baseUrl.replace("http", "ws") + "/ws/track";

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url);
        ws.onopen = () => {
          ws.close();
        };
        ws.onclose = () => resolve();
        ws.onerror = () => reject(new Error("WebSocket error"));
      });

      const res = await fetch(`${server.baseUrl}/ws/close-count`);
      const body = await res.json();
      expect(body.closeCount).toBe(1);
    } finally {
      await server.stop();
    }
  });
});
