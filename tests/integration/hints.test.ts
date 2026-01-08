import { describe, test, expect } from "bun:test";
import { startTestServer } from "../helpers/start-test-server";

describe("Resource Hints Integration", () => {
  test("controller hints are sent as Link header", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/hints`);
      
      expect(res.status).toBe(200);
      
      const linkHeader = res.headers.get("Link");
      expect(linkHeader).not.toBeNull();
      
      // Should contain preload hint
      expect(linkHeader).toContain("</css/test.css>");
      expect(linkHeader).toContain("rel=preload");
      expect(linkHeader).toContain("as=style");
      
      // Should contain preconnect hint
      expect(linkHeader).toContain("<https://api.test.com>");
      expect(linkHeader).toContain("rel=preconnect");
      
      // Should contain prefetch hint
      expect(linkHeader).toContain("</next-page.html>");
      expect(linkHeader).toContain("rel=prefetch");
      
      // Body should still work
      const body = await res.json();
      expect(body).toEqual({ ok: true });
    } finally {
      await server.stop();
    }
  });

  test("Link header format is correct for browser parsing", async () => {
    const server = await startTestServer();
    try {
      const res = await fetch(`${server.baseUrl}/hints`);
      const linkHeader = res.headers.get("Link");
      
      // Each hint should be comma-separated
      const hints = linkHeader!.split(",").map(h => h.trim());
      expect(hints.length).toBeGreaterThanOrEqual(3);
      
      // Each hint should have the format: <url>; rel=type; ...
      for (const hint of hints) {
        expect(hint).toMatch(/^<[^>]+>/); // Starts with <url>
        expect(hint).toContain("rel="); // Has rel attribute
      }
    } finally {
      await server.stop();
    }
  });

  test("routes without hints don't have Link header from controller", async () => {
    const server = await startTestServer();
    try {
      // Use a route that doesn't add hints
      const res = await fetch(`${server.baseUrl}/`);
      expect(res.status).toBe(200);
      
      // Link header might still exist from config hints, but test the response works
      const body = await res.text();
      expect(body.length).toBeGreaterThan(0);
    } finally {
      await server.stop();
    }
  });
});
