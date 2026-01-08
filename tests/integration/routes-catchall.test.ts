import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("catch-all routes integration", () => {
  test("matches catch-all segment", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/files/a/b/c`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ path: "a/b/c" });
    } finally {
      await server.stop();
    }
  });

  test("handles very long catch-all paths", async () => {
    const server = await startTestServer();
    try {
      const longPath = "segment/".repeat(500) + "end";
      const res = await fetch(`${server.baseUrl}/files/${longPath}`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { path: string };
      expect(body.path.endsWith("end")).toBe(true);
      expect(body.path.length).toBeGreaterThan(1000);
    } finally {
      await server.stop();
    }
  });

  test("matches optional catch-all segment", async () => {
    const server = await startTestServer();
    try {
      const empty = await fetch(`${server.baseUrl}/docs`);
      expect(empty.status).toBe(200);
      expect(await empty.json()).toEqual({ slug: undefined });

      const full = await fetch(`${server.baseUrl}/docs/a/b`);
      expect(full.status).toBe(200);
      expect(await full.json()).toEqual({ slug: "a/b" });
    } finally {
      await server.stop();
    }
  });
});

  test("requires at least one segment for catch-all", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/files`);
      expect(res.status).toBe(404);
    } finally {
      await server.stop();
    }
  });

  test("matches optional catch-all with trailing slash", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/docs/`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ slug: undefined });
    } finally {
      await server.stop();
    }
  });
