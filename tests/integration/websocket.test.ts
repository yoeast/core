import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("websocket integration", () => {
  test("connects and echoes messages", async () => {
    const server = await startTestServer();
    try {
      const url = server.baseUrl.replace("http", "ws") + "/chat";
      const messages: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url);
        ws.onmessage = (event) => {
          messages.push(String(event.data));
          if (messages.length === 2) {
            ws.close();
            resolve();
          }
        };
        ws.onerror = () => reject(new Error("WebSocket error"));
        ws.onopen = () => ws.send("ping");
      });

      expect(messages[0]).toBe("connected");
      expect(messages[1]).toBe("ping");
    } finally {
      await server.stop();
    }
  });
});
