/**
 * Tests for OpenAPI specification generator.
 */
import { describe, test, expect, beforeEach, beforeAll } from "bun:test";
import { z } from "zod";
import {
  generateOpenApiSpec,
  clearOpenApiCache,
  buildRequestBodySchema,
} from "@yoeast/core/api/openapi";
import { ApiController } from "@yoeast/core/api-controller";
import { Controller } from "@yoeast/core/controller";
import type { RouteDefinition } from "@yoeast/core/types";
import { initConfig, isConfigInitialized } from "@yoeast/core/config";

// Initialize config if not already done
beforeAll(async () => {
  if (!isConfigInitialized()) {
    await initConfig(process.cwd());
  }
});

// Test controllers
class SimpleController extends Controller {
  async handle() {
    return this.json({ ok: true });
  }
}

class SimpleApiController extends ApiController {
  static input = z.object({
    name: z.string(),
    age: z.number().optional(),
  });

  async handle() {
    return this.ok({ status: "success" });
  }
}

class ApiControllerWithResponses extends ApiController {
  static input = z.object({
    id: z.string(),
  });

  static responses = {
    200: z.object({
      id: z.string(),
      name: z.string(),
    }),
    404: z.object({
      error: z.string(),
    }),
  };

  async handle() {
    return this.ok({ id: "1", name: "Test" });
  }
}

describe("OpenAPI generator", () => {
  beforeEach(() => {
    clearOpenApiCache();
  });

  describe("generateOpenApiSpec", () => {
    test("generates basic spec structure", () => {
      const routes: RouteDefinition[] = [];
      const spec = generateOpenApiSpec(routes);

      expect(spec.openapi).toBe("3.0.3");
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeDefined();
      expect(spec.info.version).toBeDefined();
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
    });

    test("includes security schemes", () => {
      const routes: RouteDefinition[] = [];
      const spec = generateOpenApiSpec(routes);

      expect(spec.components?.securitySchemes).toBeDefined();
      expect(spec.components?.securitySchemes?.ApiToken).toEqual({
        type: "apiKey",
        name: "X-API-Token",
        in: "header",
      });
      expect(spec.components?.securitySchemes?.BearerAuth).toEqual({
        type: "http",
        scheme: "bearer",
      });
    });

    test("only processes /api routes", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users",
          Controller: SimpleApiController,
          file: "test.ts",
        },
        {
          method: "GET",
          path: "/health",
          Controller: SimpleController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);

      expect(spec.paths["/api/users"]).toBeDefined();
      expect(spec.paths["/health"]).toBeUndefined();
    });

    test("converts path parameters to OpenAPI format", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users/[id]",
          Controller: SimpleApiController,
          file: "test.ts",
        },
        {
          method: "GET",
          path: "/api/posts/[id:number]",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);

      expect(spec.paths["/api/users/{id}"]).toBeDefined();
      expect(spec.paths["/api/posts/{id}"]).toBeDefined();
    });

    test("generates operation for each HTTP method", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/items",
          Controller: SimpleApiController,
          file: "test.ts",
        },
        {
          method: "POST",
          path: "/api/items",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);

      expect(spec.paths["/api/items"]?.get).toBeDefined();
      expect(spec.paths["/api/items"]?.post).toBeDefined();
    });

    test("generates operation ID", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const operation = spec.paths["/api/users"]?.get;

      expect(operation?.operationId).toBe("getApiUsers");
    });

    test("extracts tags from path", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const operation = spec.paths["/api/users"]?.get;

      expect(operation?.tags).toContain("Users");
    });

    test("includes path parameters", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users/[id]",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const operation = spec.paths["/api/users/{id}"]?.get;

      expect(operation?.parameters).toBeDefined();
      expect(operation?.parameters?.some((p) => p.name === "id" && p.in === "path")).toBe(true);
    });

    test("includes response schemas", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/items",
          Controller: ApiControllerWithResponses,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const operation = spec.paths["/api/items"]?.get;

      expect(operation?.responses["200"]).toBeDefined();
      expect(operation?.responses["404"]).toBeDefined();
    });

    test("always includes 400 validation error response", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/items",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const operation = spec.paths["/api/items"]?.get;

      expect(operation?.responses["400"]).toBeDefined();
      expect(operation?.responses["400"].description).toBe("Validation error");
    });

    test("caches spec and returns same reference", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/test",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec1 = generateOpenApiSpec(routes);
      const spec2 = generateOpenApiSpec(routes);

      expect(spec1).toBe(spec2);
    });

    test("regenerates spec when routes change", () => {
      const routes1: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/test",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const routes2: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/other",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec1 = generateOpenApiSpec(routes1);
      const spec2 = generateOpenApiSpec(routes2);

      expect(spec1).not.toBe(spec2);
    });
  });

  describe("clearOpenApiCache", () => {
    test("clears cached spec", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/test",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec1 = generateOpenApiSpec(routes);
      clearOpenApiCache();
      const spec2 = generateOpenApiSpec(routes);

      // After clearing, should regenerate
      expect(spec1).not.toBe(spec2);
    });
  });

  describe("buildRequestBodySchema", () => {
    test("builds schema from zod object", () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const result = buildRequestBodySchema(schema, []);

      expect(result).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
        required: ["name", "email"],
      });
    });

    test("excludes path parameters from body schema", () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const result = buildRequestBodySchema(schema, [{ name: "id" }]);

      expect(result).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      });
    });

    test("handles optional fields", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
      });

      const result = buildRequestBodySchema(schema, []);

      expect(result?.required).toEqual(["name"]);
      expect(result?.properties?.age).toBeDefined();
    });

    test("returns null for empty schema", () => {
      const schema = z.object({
        id: z.string(),
      });

      // If only field is a path param, body should be null
      const result = buildRequestBodySchema(schema, [{ name: "id" }]);

      expect(result).toBeNull();
    });

    test("returns null for non-object schema", () => {
      const schema = z.string();

      const result = buildRequestBodySchema(schema as any, []);

      expect(result).toBeNull();
    });

    test("handles nested objects", () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string(),
        }),
      });

      const result = buildRequestBodySchema(schema, []);

      expect(result?.properties?.user).toEqual({
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
        required: ["name", "email"],
      });
    });

    test("handles arrays", () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      const result = buildRequestBodySchema(schema, []);

      expect(result?.properties?.tags).toEqual({
        type: "array",
        items: { type: "string" },
      });
    });

    test("handles default values", () => {
      const schema = z.object({
        name: z.string(),
        active: z.boolean().default(true),
      });

      const result = buildRequestBodySchema(schema, []);

      // Default fields should not be required
      expect(result?.required).toEqual(["name"]);
    });
  });

  describe("path parameter extraction", () => {
    test("extracts simple parameter", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users/[id]",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const params = spec.paths["/api/users/{id}"]?.get?.parameters;

      const idParam = params?.find((p) => p.name === "id");
      expect(idParam).toBeDefined();
      expect(idParam?.in).toBe("path");
      expect(idParam?.required).toBe(true);
      expect(idParam?.schema.type).toBe("string");
    });

    test("extracts typed parameter", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users/[id:number]",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const params = spec.paths["/api/users/{id}"]?.get?.parameters;

      const idParam = params?.find((p) => p.name === "id");
      expect(idParam?.schema.type).toBe("integer");
    });

    test("extracts multiple parameters", () => {
      const routes: RouteDefinition[] = [
        {
          method: "GET",
          path: "/api/users/[userId]/posts/[postId]",
          Controller: SimpleApiController,
          file: "test.ts",
        },
      ];

      const spec = generateOpenApiSpec(routes);
      const params = spec.paths["/api/users/{userId}/posts/{postId}"]?.get?.parameters;

      expect(params?.some((p) => p.name === "userId")).toBe(true);
      expect(params?.some((p) => p.name === "postId")).toBe(true);
    });
  });
});
