/**
 * OpenAPI specification generator.
 * 
 * Generates OpenAPI 3.0 spec from ApiController routes.
 */

import type { RouteDefinition } from "../types";
import type { SchemaLike } from "../types";
import { ApiController } from "../api-controller";
import { config } from "../config";

/** OpenAPI 3.0 specification */
export interface OpenApiSpec {
  openapi: "3.0.3";
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, JsonSchema>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
}

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseObject>;
  security?: Array<Record<string, string[]>>;
}

interface Parameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema: JsonSchema;
}

interface RequestBody {
  required?: boolean;
  content: {
    "application/json"?: { schema: JsonSchema };
  };
}

interface ResponseObject {
  description: string;
  content?: {
    "application/json"?: { schema: JsonSchema };
  };
}

interface SecurityScheme {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  name?: string;
  in?: "header" | "query" | "cookie";
  scheme?: string;
  bearerFormat?: string;
}

interface JsonSchema {
  type?: string;
  format?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  default?: unknown;
  description?: string;
  nullable?: boolean;
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
}

/** Cached spec */
let cachedSpec: OpenApiSpec | null = null;
let cachedRoutes: RouteDefinition[] | null = null;

/**
 * Generate OpenAPI spec from routes.
 */
export function generateOpenApiSpec(routes: RouteDefinition[]): OpenApiSpec {
  // Return cached if routes haven't changed
  if (cachedSpec && cachedRoutes === routes) {
    return cachedSpec;
  }

  const appName = config("app.name", "API");
  const appVersion = config("app.version", "1.0.0");

  const spec: OpenApiSpec = {
    openapi: "3.0.3",
    info: {
      title: String(appName),
      version: String(appVersion),
      description: "Auto-generated API documentation",
    },
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        ApiToken: {
          type: "apiKey",
          name: "X-API-Token",
          in: "header",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  };

  // Group routes by path
  const pathGroups = new Map<string, RouteDefinition[]>();
  for (const route of routes) {
    // Only process API routes (configurable)
    if (!route.path.startsWith("/api")) continue;

    const existing = pathGroups.get(route.path) ?? [];
    existing.push(route);
    pathGroups.set(route.path, existing);
  }

  // Build paths
  for (const [routePath, routeGroup] of pathGroups) {
    const openApiPath = convertPathToOpenApi(routePath);
    const pathItem: PathItem = {};

    for (const route of routeGroup) {
      const operation = buildOperation(route);
      const method = route.method.toLowerCase() as keyof PathItem;
      pathItem[method] = operation;
    }

    spec.paths[openApiPath] = pathItem;
  }

  // Cache the spec
  cachedSpec = spec;
  cachedRoutes = routes;

  return spec;
}

/**
 * Clear the cached spec (useful for development).
 */
export function clearOpenApiCache(): void {
  cachedSpec = null;
  cachedRoutes = null;
}

/**
 * Convert framework route path to OpenAPI path format.
 * /users/[id] -> /users/{id}
 * /users/[id:number] -> /users/{id}
 */
function convertPathToOpenApi(path: string): string {
  return path
    .replace(/\[\.\.\.(\w+)\]/g, "{$1}") // [...slug] -> {slug}
    .replace(/\[\[\.\.\.(\w+)\]\]/g, "{$1}") // [[...slug]] -> {slug}
    .replace(/\[(\w+)(?::\w+)?\]/g, "{$1}"); // [id] or [id:number] -> {id}
}

/**
 * Build an OpenAPI operation from a route.
 */
function buildOperation(route: RouteDefinition): Operation {
  const Controller = route.Controller;
  const isApiController = Controller.prototype instanceof ApiController || Controller === ApiController;
  
  // Get static properties from controller (prefer `input` over `validate`)
  const ControllerClass = Controller as typeof ApiController;
  const inputSchema = ControllerClass.input ?? ControllerClass.validate;
  const responseSchemas = ControllerClass.responses;
  
  // Check if protected
  let isProtected = false;
  let requiredScopes: string[] = [];
  
  if (isApiController) {
    // Create temporary instance to check properties
    try {
      const instance = Object.create(Controller.prototype);
      isProtected = instance.apiProtected ?? false;
      requiredScopes = instance.apiScopes ?? [];
    } catch {
      // Ignore errors
    }
  }

  // Extract path parameters from route
  const pathParams = extractPathParams(route.path);
  
  // Build parameters
  const parameters: Parameter[] = [];
  
  // Add path parameters
  for (const param of pathParams) {
    parameters.push({
      name: param.name,
      in: "path",
      required: true,
      schema: { type: param.type === "number" ? "integer" : "string" },
    });
  }

  // Extract query/body schema from input
  let requestBody: RequestBody | undefined;
  
  if (inputSchema) {
    const isBodyMethod = ["POST", "PUT", "PATCH"].includes(route.method);
    
    if (isBodyMethod) {
      // For body methods, put all non-path params in request body
      const bodySchema = buildRequestBodySchema(inputSchema, pathParams);
      if (bodySchema) {
        requestBody = {
          required: true,
          content: {
            "application/json": { schema: bodySchema },
          },
        };
      }
    } else {
      // For GET/DELETE, extract as query parameters
      const { queryParams } = extractSchemaInfo(inputSchema, pathParams);
      for (const qp of queryParams) {
        parameters.push({
          name: qp.name,
          in: "query",
          required: qp.required,
          schema: qp.schema,
        });
      }
    }
  }

  // Build responses from static responses
  const responses: Record<string, ResponseObject> = {};
  
  if (responseSchemas) {
    for (const [statusCode, schema] of Object.entries(responseSchemas)) {
      const jsonSchema = zodSchemaToJsonSchema(schema);
      responses[statusCode] = {
        description: getStatusDescription(Number(statusCode)),
        content: {
          "application/json": { schema: jsonSchema },
        },
      };
    }
  } else {
    // Default response if no schema defined
    responses["200"] = {
      description: "Successful response",
      content: {
        "application/json": { schema: { type: "object" } },
      },
    };
  }
  
  // Always add 400 validation error response
  responses["400"] = {
    description: "Validation error",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            details: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "array", items: { type: "string" } },
                  message: { type: "string" },
                  code: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };

  // Build operation
  const operation: Operation = {
    operationId: generateOperationId(route),
    tags: extractTags(route.path),
    parameters: parameters.length > 0 ? parameters : undefined,
    requestBody,
    responses,
  };

  // Add security if protected
  if (isProtected) {
    operation.security = [{ ApiToken: requiredScopes }, { BearerAuth: requiredScopes }];
    operation.responses["401"] = { description: "Unauthorized" };
    operation.responses["403"] = { description: "Forbidden" };
  }

  return operation;
}

/**
 * Extract path parameters from route path.
 */
function extractPathParams(path: string): Array<{ name: string; type: string }> {
  const params: Array<{ name: string; type: string }> = [];
  const regex = /\[(\w+)(?::(\w+))?\]/g;
  let match;
  
  while ((match = regex.exec(path)) !== null) {
    const name = match[1]!;
    const type = match[2] ?? "string";
    params.push({ name, type });
  }
  
  return params;
}

/**
 * Get description for HTTP status code.
 */
function getStatusDescription(status: number): string {
  const descriptions: Record<number, string> = {
    200: "Successful response",
    201: "Created",
    204: "No content",
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
    422: "Unprocessable entity",
    500: "Internal server error",
  };
  return descriptions[status] ?? `Response ${status}`;
}

/**
 * Convert a complete zod schema to JSON Schema.
 */
function zodSchemaToJsonSchema(schema: SchemaLike<unknown>): JsonSchema {
  // Check if it's a zod object schema
  const zodDef = (schema as { def?: ZodObjectDef }).def;
  
  if (zodDef?.type === "object" && zodDef.shape) {
    const shape = zodDef.shape as Record<string, ZodFieldDef>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    
    for (const [fieldName, fieldDef] of Object.entries(shape)) {
      properties[fieldName] = zodToJsonSchema(fieldDef);
      if (!isOptionalField(fieldDef)) {
        required.push(fieldName);
      }
    }
    
    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
  
  // For non-object schemas, try to convert directly
  return zodToJsonSchema(schema as ZodFieldDef);
}

/**
 * Generate operation ID from route.
 */
function generateOperationId(route: RouteDefinition): string {
  const method = route.method.toLowerCase();
  const pathParts = route.path
    .split("/")
    .filter(Boolean)
    .map((part) => {
      // Remove parameter markers
      if (part.startsWith("[")) {
        const name = part.replace(/\[|\]|:\w+/g, "");
        return `By${capitalize(name)}`;
      }
      return capitalize(part);
    });
  
  return method + pathParts.join("");
}

/**
 * Extract tags from route path.
 */
function extractTags(path: string): string[] {
  const parts = path.split("/").filter(Boolean);
  // Use first segment after /api as tag
  if (parts[0] === "api" && parts[1]) {
    return [capitalize(parts[1])];
  }
  return parts.length > 0 ? [capitalize(parts[0]!)] : ["Default"];
}

/**
 * Capitalize first letter.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extract schema information from zod validate schema.
 */
function extractSchemaInfo(
  schema: SchemaLike<unknown>,
  pathParams: Array<{ name: string; type: string }>
): {
  queryParams: Array<{ name: string; required: boolean; schema: JsonSchema }>;
  bodySchema: JsonSchema | null;
} {
  const queryParams: Array<{ name: string; required: boolean; schema: JsonSchema }> = [];
  let bodySchema: JsonSchema | null = null;
  
  // Get path param names to exclude from query/body
  const pathParamNames = new Set(pathParams.map((p) => p.name));
  
  // Try to extract from zod schema
  const zodDef = (schema as { def?: ZodObjectDef }).def;
  
  if (zodDef?.type === "object" && zodDef.shape) {
    const shape = zodDef.shape as Record<string, ZodFieldDef>;
    const bodyProperties: Record<string, JsonSchema> = {};
    const bodyRequired: string[] = [];
    
    for (const [fieldName, fieldDef] of Object.entries(shape)) {
      // Skip path params
      if (pathParamNames.has(fieldName)) continue;
      
      const jsonSchema = zodToJsonSchema(fieldDef);
      const isRequired = !isOptionalField(fieldDef);
      
      // Heuristic: if it's a simple type (string, number, boolean), treat as query param
      // If it's complex (object, array) or the method is POST/PUT/PATCH, treat as body
      const isSimpleType = ["string", "number", "integer", "boolean"].includes(jsonSchema.type ?? "");
      
      if (isSimpleType) {
        queryParams.push({
          name: fieldName,
          required: isRequired,
          schema: jsonSchema,
        });
      } else {
        bodyProperties[fieldName] = jsonSchema;
        if (isRequired) bodyRequired.push(fieldName);
      }
    }
    
    // If we have body properties, build body schema
    if (Object.keys(bodyProperties).length > 0) {
      bodySchema = {
        type: "object",
        properties: bodyProperties,
        required: bodyRequired.length > 0 ? bodyRequired : undefined,
      };
    }
    
    // For POST/PUT/PATCH, move all non-path params to body
    // This is handled by the caller checking the method
  }
  
  return { queryParams, bodySchema };
}

/** Zod object definition structure (simplified) */
interface ZodObjectDef {
  type: string;
  shape?: Record<string, unknown>;
}

/** Zod field definition structure (simplified) */
interface ZodFieldDef {
  def?: {
    type?: string;
    innerType?: ZodFieldDef;
    checks?: Array<{ minimum?: number; maximum?: number }>;
  };
  type?: string;
  format?: string;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number;
  maxValue?: number;
  isInt?: boolean;
}

/**
 * Check if a zod field is optional (including those with defaults).
 */
function isOptionalField(field: ZodFieldDef): boolean {
  const type = field.def?.type ?? field.type;
  return type === "optional" || type === "default";
}

/**
 * Convert zod field definition to JSON Schema.
 */
function zodToJsonSchema(field: ZodFieldDef): JsonSchema {
  const def = field.def ?? field;
  const defWithInner = def as { type?: string; innerType?: ZodFieldDef; defaultValue?: unknown };
  const type = defWithInner.type ?? field.type;
  
  // Handle default wrapper - unwrap and add default value
  if (type === "default" && defWithInner.innerType) {
    const inner = zodToJsonSchema(defWithInner.innerType);
    if (defWithInner.defaultValue !== undefined) {
      inner.default = defWithInner.defaultValue;
    }
    return inner;
  }
  
  // Handle optional wrapper
  if (type === "optional" && defWithInner.innerType) {
    const inner = zodToJsonSchema(defWithInner.innerType);
    inner.nullable = true;
    return inner;
  }
  
  // Handle nullable wrapper
  if (type === "nullable" && defWithInner.innerType) {
    const inner = zodToJsonSchema(defWithInner.innerType);
    inner.nullable = true;
    return inner;
  }
  
  // Map zod types to JSON Schema
  switch (type) {
    case "string": {
      const schema: JsonSchema = { type: "string" };
      if (field.format === "email") schema.format = "email";
      if (field.format === "uuid") schema.format = "uuid";
      if (field.format === "url") schema.format = "uri";
      if (field.format === "datetime") schema.format = "date-time";
      if (field.minLength) schema.minLength = field.minLength;
      if (field.maxLength) schema.maxLength = field.maxLength;
      return schema;
    }
    
    case "number": {
      const fieldWithNum = field as ZodFieldDef & { minValue?: number; maxValue?: number | null; isInt?: boolean };
      // Also check innerType for coerced numbers
      const innerType = defWithInner.innerType as ZodFieldDef & { minValue?: number; maxValue?: number | null; isInt?: boolean } | undefined;
      const schema: JsonSchema = { 
        type: (fieldWithNum.isInt || innerType?.isInt) ? "integer" : "number" 
      };
      const minVal = fieldWithNum.minValue ?? innerType?.minValue;
      const maxVal = fieldWithNum.maxValue ?? innerType?.maxValue;
      if (minVal !== undefined && Number.isFinite(minVal)) schema.minimum = minVal;
      if (maxVal !== undefined && maxVal !== null && Number.isFinite(maxVal)) schema.maximum = maxVal;
      return schema;
    }
    
    case "boolean":
      return { type: "boolean" };
    
    case "array": {
      const itemType = (def as { element?: ZodFieldDef }).element;
      return {
        type: "array",
        items: itemType ? zodToJsonSchema(itemType) : {},
      };
    }
    
    case "object": {
      const shape = (def as { shape?: Record<string, ZodFieldDef> }).shape;
      if (!shape) return { type: "object" };
      
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value);
        if (!isOptionalField(value)) required.push(key);
      }
      
      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
    
    case "enum": {
      const values = (def as { entries?: unknown[] }).entries;
      return { enum: values ?? [] };
    }
    
    default:
      return { type: "string" };
  }
}

/**
 * For POST/PUT/PATCH, build a complete body schema from validate.
 */
export function buildRequestBodySchema(
  schema: SchemaLike<unknown>,
  pathParams: Array<{ name: string }>
): JsonSchema | null {
  const pathParamNames = new Set(pathParams.map((p) => p.name));
  const zodDef = (schema as { def?: ZodObjectDef }).def;
  
  if (zodDef?.type !== "object" || !zodDef.shape) {
    return null;
  }
  
  const shape = zodDef.shape as Record<string, ZodFieldDef>;
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  
  for (const [fieldName, fieldDef] of Object.entries(shape)) {
    // Skip path params - they come from URL, not body
    if (pathParamNames.has(fieldName)) continue;
    
    properties[fieldName] = zodToJsonSchema(fieldDef);
    if (!isOptionalField(fieldDef)) {
      required.push(fieldName);
    }
  }
  
  if (Object.keys(properties).length === 0) {
    return null;
  }
  
  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}
