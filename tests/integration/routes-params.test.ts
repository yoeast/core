import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("param routes integration", () => {
  test("matches multiple params", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/users/7/posts/9`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ userId: "7", postId: "9" });
    } finally {
      await server.stop();
    }
  });

  test("matches slug matcher", async () => {
    const server = await startTestServer();
    try {
      const ok = await fetch(`${server.baseUrl}/tags/hello-world`);
      expect(ok.status).toBe(200);
      expect(await ok.json()).toEqual({ tag: "hello-world" });

      const bad = await fetch(`${server.baseUrl}/tags/Bad!`);
      expect(bad.status).toBe(404);
    } finally {
      await server.stop();
    }
  });
});

  test("decodes percent-encoded params", async () => {
    const server = await startTestServer();
    try {
      const encoded = encodeURIComponent("hello world");
      const res = await fetch(`${server.baseUrl}/users/${encoded}/posts/1`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ userId: "hello world", postId: "1" });
    } finally {
      await server.stop();
    }
  });

  test("handles long query strings", async () => {
    const server = await startTestServer();
    try {
      const query = Array.from({ length: 200 }, (_, i) => `k${i}=v${i}`).join("&");
      const res = await fetch(`${server.baseUrl}/echo/query?${query}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.query.k0).toBe("v0");
      expect(body.query.k199).toBe("v199");
    } finally {
      await server.stop();
    }
  });

  test("invalid percent-encoding returns 400", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/users/%E0%A4%A/posts/1`);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Invalid URL encoding");
    } finally {
      await server.stop();
    }
  });
