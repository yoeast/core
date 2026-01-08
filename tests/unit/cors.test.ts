import { describe, test, expect } from "bun:test";
import { Controller, applyCorsHeaders, createPreflightResponse } from "@yoeast/core";
import type { CorsOptions, CorsConfig } from "@yoeast/core";

// Helper to create a controller with CORS config
function createTestController(corsConfig: CorsConfig) {
  class TestController extends Controller {
    protected override cors = corsConfig;
    override async handle() {
      return this.json({ data: "test" });
    }
  }
  return new TestController();
}

describe("CORS - Controller Integration", () => {
  describe("applyCorsHeaders", () => {
    test("adds wildcard origin with default config", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://example.com" },
      });
      const response = new Response(JSON.stringify({ data: "test" }), {
        headers: { "Content-Type": "application/json" },
      });

      const corsResponse = applyCorsHeaders(request, response, true);
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    test("echoes specific origin when credentials enabled", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://example.com" },
      });
      const response = new Response(JSON.stringify({ data: "test" }));

      const corsResponse = applyCorsHeaders(request, response, { credentials: true });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe("http://example.com");
      expect(corsResponse.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    test("preserves original response body and status", async () => {
      const request = new Request("http://localhost/api/test", { method: "GET" });
      const response = new Response(JSON.stringify({ data: "test" }), { status: 201 });

      const corsResponse = applyCorsHeaders(request, response, true);
      
      expect(corsResponse.status).toBe(201);
      const body = await corsResponse.json();
      expect(body).toEqual({ data: "test" });
    });

    test("preserves original response headers", async () => {
      const request = new Request("http://localhost/api/test", { method: "GET" });
      const response = new Response(null, {
        headers: { "Content-Type": "application/json", "X-Custom": "value" },
      });

      const corsResponse = applyCorsHeaders(request, response, true);
      
      expect(corsResponse.headers.get("Content-Type")).toBe("application/json");
      expect(corsResponse.headers.get("X-Custom")).toBe("value");
    });
  });

  describe("createPreflightResponse", () => {
    test("returns 204 for OPTIONS request", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "OPTIONS",
        headers: {
          Origin: "http://example.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      const response = createPreflightResponse(request, true);
      
      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });

    test("includes allowed methods in preflight response", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "OPTIONS",
        headers: {
          Origin: "http://example.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      const response = createPreflightResponse(request, { methods: ["GET", "POST", "DELETE"] });
      
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, DELETE");
    });

    test("echoes requested headers in preflight response", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "OPTIONS",
        headers: {
          Origin: "http://example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "X-Custom-Header, Content-Type",
        },
      });

      const response = createPreflightResponse(request, true);
      
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("X-Custom-Header, Content-Type");
    });

    test("includes max-age in preflight response", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "OPTIONS",
        headers: {
          Origin: "http://example.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      const response = createPreflightResponse(request, { maxAge: 3600 });
      
      expect(response.headers.get("Access-Control-Max-Age")).toBe("3600");
    });
  });

  describe("Origin Matching", () => {
    test("allows specific origin string", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://allowed.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, { origin: "http://allowed.com" });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe("http://allowed.com");
    });

    test("blocks non-matching origin string", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://blocked.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, { origin: "http://allowed.com" });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    test("allows origin from array", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://two.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, { origin: ["http://one.com", "http://two.com"] });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe("http://two.com");
    });

    test("blocks origin not in array", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://three.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, { origin: ["http://one.com", "http://two.com"] });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    test("allows origin via function", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://sub.allowed.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, {
        origin: (origin) => origin.endsWith(".allowed.com"),
      });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe("http://sub.allowed.com");
    });

    test("blocks origin via function", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://blocked.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, {
        origin: (origin) => origin.endsWith(".allowed.com"),
      });
      
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Exposed Headers", () => {
    test("includes exposed headers in response", async () => {
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://example.com" },
      });
      const response = new Response(null);

      const corsResponse = applyCorsHeaders(request, response, { exposedHeaders: ["X-Total-Count", "X-Page"] });
      
      expect(corsResponse.headers.get("Access-Control-Expose-Headers")).toBe("X-Total-Count, X-Page");
    });
  });

  describe("Controller CORS Property", () => {
    test("controller with cors=true adds CORS headers", async () => {
      const controller = createTestController(true);
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://example.com" },
      });

      const response = await controller.run(request, {}, new URLSearchParams());
      
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    test("controller with cors options adds custom headers", async () => {
      const controller = createTestController({
        origin: "http://custom.com",
        credentials: true,
      });
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://custom.com" },
      });

      const response = await controller.run(request, {}, new URLSearchParams());
      
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://custom.com");
      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    test("controller without cors does not add headers", async () => {
      class NoCorsController extends Controller {
        override async handle() {
          return this.json({ data: "test" });
        }
      }
      const controller = new NoCorsController();
      const request = new Request("http://localhost/api/test", {
        method: "GET",
        headers: { Origin: "http://example.com" },
      });

      const response = await controller.run(request, {}, new URLSearchParams());
      
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });
});
