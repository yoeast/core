import { describe, expect, test } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("echo routes integration", () => {
  test("echoes query parameters", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/query?foo=bar&baz=1&tag=a&tag=b`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ query: { foo: "bar", baz: "1", tag: "b" } });
    } finally {
      await server.stop();
    }
  });

  test("echoes headers (case-insensitive)", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/headers`, {
        headers: { "x-test": "lowercase" },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { header: string; all: Record<string, string> };
      expect(body.header).toBe("lowercase");
      expect(body.all["x-test"]).toBe("lowercase");
    } finally {
      await server.stop();
    }
  });

  test("handles cookies (decode + malformed)", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/cookies`, {
        headers: { Cookie: "flag; session=hello%20world; theme=dark; =oops" },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        session: "hello world",
        all: { flag: "", session: "hello world", theme: "dark" },
      });
    } finally {
      await server.stop();
    }
  });

  test("echoes text body (large payload)", async () => {
    const server = await startTestServer();
    try {
      const large = "a".repeat(100_000);
      const res = await fetch(`${server.baseUrl}/echo/text`, {
        method: "POST",
        body: large,
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { text: string };
      expect(body.text.length).toBe(100_000);
    } finally {
      await server.stop();
    }
  });

  test("empty json body returns 400", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { status: number; message: string };
      expect(body.status).toBe(400);
      expect(body.message).toContain("Invalid JSON");
    } finally {
      await server.stop();
    }
  });

  test("valid json body parses", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hi" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "hi" });
    } finally {
      await server.stop();
    }
  });

  test("invalid json body returns 400 with a structured error", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json}",
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { status: number; error: string; message: string };
      expect(body.status).toBe(400);
      expect(body.error).toBe("HttpError");
      expect(body.message).toContain("Invalid JSON");
    } finally {
      await server.stop();
    }
  });

  test("sets multiple cookies", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/set-cookies`);
      expect(res.status).toBe(200);
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("a=1");
      expect(setCookie).toContain("b=2");

      const getSetCookie = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
      if (typeof getSetCookie === "function") {
        const cookies = getSetCookie.call(res.headers);
        expect(cookies.some((value) => value.includes("a=1"))).toBe(true);
        expect(cookies.some((value) => value.includes("b=2"))).toBe(true);
      }
    } finally {
      await server.stop();
    }
  });

  test("returns 405 for method not allowed", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/echo/query`, {
        method: "POST",
      });
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toContain("GET");
    } finally {
      await server.stop();
    }
  });
});
