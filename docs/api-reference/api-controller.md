# API Controllers

The `ApiController` class extends the base `Controller` with features designed for building APIs:
- Input validation with Zod schemas (`static input`)
- Response schema validation (`static responses`)
- Automatic input merging from params, query, and body
- API token authentication (optional)
- Structured error responses
- OpenAPI spec generation

## Basic Usage

Create an API endpoint by extending `ApiController`:

```ts
// app/routes/api/hello.get.ts
import { z } from "zod";
import { ApiController } from "@core";

export default class HelloController extends ApiController {
  static override responses = {
    200: z.object({
      message: z.string(),
    }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, { message: "Hello, World!" });
  }
}
```

## Schema-Driven API Design

ApiController uses two static properties to define your API contract:

### `static input` - Request Schema

Defines and validates incoming request data (params + query + body merged):

```ts
static override input = z.object({
  id: z.string(),                           // from route params
  limit: z.coerce.number().default(20),     // from query (coerced)
  name: z.string().optional(),              // from body
});
```

### `static responses` - Response Schemas

Defines response shapes by HTTP status code:

```ts
static override responses = {
  200: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
    }),
  }),
  404: z.object({
    error: z.string(),
    message: z.string(),
  }),
};
```

## Input Handling

The `ApiController` automatically merges input from three sources:

1. **Route parameters** - from the URL path (`/users/[id]` → `{ id: "123" }`)
2. **Query parameters** - from the URL query string (`?limit=10` → `{ limit: "10" }`)
3. **Request body** - from JSON body (`{ "name": "John" }`)

Access the validated input via `this.input`:

```ts
// GET /api/users/123?include=posts
// Route: app/routes/api/users/[id].get.ts

export default class GetUserController extends ApiController {
  static override input = z.object({
    id: z.string(),
    include: z.string().optional(),
  });

  static override responses = {
    200: z.object({ user: z.object({ id: z.string() }) }),
  };

  protected override async handle(): Promise<Response> {
    const { id, include } = this.input;
    console.log(id);      // "123"
    console.log(include); // "posts"
    return this.response(200, { user: { id } });
  }
}
```

## Response Helpers

### `this.response(status, data)`

The primary way to return responses. Validates data against the response schema:

```ts
return this.response(200, { user: { id: "123", email: "user@example.com" } });
return this.response(404, { error: "NotFound", message: "User not found" });
```

If response validation fails:
- **Development**: Returns 500 with validation details
- **Production**: Returns 500 with generic message (details logged server-side)

## Input Validation with Zod

### Validation Error Response

When input validation fails, a 400 response is automatically returned:

```json
{
  "error": "ValidationError",
  "message": "Request input validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address",
      "code": "invalid_string"
    },
    {
      "path": ["password"],
      "message": "Password must be at least 8 characters",
      "code": "too_small"
    }
  ]
}
```

### Coercing Types

Zod can coerce string values (from query params) to numbers:

```ts
static override input = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  skip: z.coerce.number().min(0).default(0),
});
```

Now `?limit=10&skip=5` becomes `{ limit: 10, skip: 5 }` (numbers, not strings).

## API Authentication

Enable token-based authentication by setting `apiProtected = true`:

```ts
export default class ProtectedController extends ApiController {
  protected override apiProtected = true;

  static override responses = {
    200: z.object({ clientId: z.string() }),
  };

  protected override async handle(): Promise<Response> {
    // Only reachable with valid API token
    const clientId = this.getClientId();
    return this.response(200, { clientId });
  }
}
```

### Required Scopes

Require specific scopes for an endpoint:

```ts
import type { ApiScope } from "@core";

export default class AdminController extends ApiController {
  protected override apiProtected = true;
  protected override apiScopes: ApiScope[] = ["admin"];

  static override responses = {
    200: z.object({ admin: z.boolean() }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, { admin: true });
  }
}
```

### Resource-Based Access

Use resource patterns for fine-grained access control:

```ts
export default class UsersController extends ApiController {
  protected override apiProtected = true;
  protected override apiResource = "users:read";

  static override responses = {
    200: z.object({ users: z.array(z.any()) }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, { users: [] });
  }
}
```

### Authentication Helpers

Inside a protected endpoint, you have access to:

```ts
// Get the client ID from the token
const clientId = this.getClientId();

// Get the full API context
const context = this.getApiContext();
// { authenticated: true, clientId: "...", scopes: ["read", "write"], token: {...} }

// Check if token has a specific scope
if (this.hasScope("admin")) { ... }

// Require a scope (throws 403 if missing)
this.requireScope("admin");

// Get token metadata
const userId = this.getTokenMetadata<string>("userId");

// Check authentication status
if (this.isAuthenticated()) { ... }
```

### Authentication Error Responses

When authentication fails:

```json
{
  "error": "AuthenticationError",
  "message": "Missing API token",
  "code": "MISSING_TOKEN"
}
```

Error codes:
- `MISSING_TOKEN` - No token provided (401)
- `INVALID_TOKEN` - Token is invalid (401)
- `EXPIRED_TOKEN` - Token has expired (401)
- `INSUFFICIENT_SCOPE` - Token lacks required scope (403)
- `FORBIDDEN_RESOURCE` - Token cannot access resource (403)
- `RATE_LIMITED` - Rate limit exceeded (429)

## OpenAPI Spec Generation

The framework automatically generates an OpenAPI 3.0.3 spec from your API routes.

### Accessing the Spec

The spec is available at `/api/openapi.json`:

```bash
curl http://localhost:3000/api/openapi.json
```

### What's Extracted

- **Path** from file-based routing
- **Method** from filename (`.get.ts`, `.post.ts`, etc.)
- **Parameters** from `static input` schema
- **Request body** from `static input` schema (POST/PUT/PATCH)
- **Responses** from `static responses` schema

### Example Generated Spec

For this controller:

```ts
// app/routes/api/users/[id].get.ts
export default class GetUserController extends ApiController {
  static override input = z.object({
    id: z.string().describe("User ID"),
  });

  static override responses = {
    200: z.object({
      user: z.object({
        id: z.string(),
        email: z.string().email(),
      }),
    }),
    404: z.object({
      error: z.string(),
      message: z.string(),
    }),
  };
}
```

Generates:

```json
{
  "paths": {
    "/api/users/{id}": {
      "get": {
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "User ID",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string" },
                        "email": { "type": "string", "format": "email" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Complete Example

Here's a full CRUD API for users:

```ts
// app/routes/api/users/index.get.ts - List users
import { z } from "zod";
import { ApiController } from "@core";
import { User } from "@app/models/User";

export default class ListUsersController extends ApiController {
  static override input = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    skip: z.coerce.number().min(0).default(0),
  });

  static override responses = {
    200: z.object({
      users: z.array(z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().optional(),
      })),
      total: z.number(),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { limit, skip } = this.input;
    
    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    return this.response(200, {
      users: users.map(u => ({ id: u.id, email: u.email, name: u.name })),
      total,
    });
  }
}
```

```ts
// app/routes/api/users/[id].get.ts - Get user by ID
import { z } from "zod";
import { ApiController } from "@core";
import { User } from "@app/models/User";

export default class GetUserController extends ApiController {
  static override input = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
  });

  static override responses = {
    200: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().optional(),
      }),
    }),
    404: z.object({
      error: z.string(),
      message: z.string(),
    }),
  };

  protected override async handle(): Promise<Response> {
    const user = await User.findById(this.input.id);

    if (!user) {
      return this.response(404, { error: "NotFound", message: "User not found" });
    }

    return this.response(200, {
      user: { id: user.id, email: user.email, name: user.name },
    });
  }
}
```

```ts
// app/routes/api/users/index.post.ts - Create user
import { z } from "zod";
import { ApiController } from "@core";
import { User } from "@app/models/User";

export default class CreateUserController extends ApiController {
  static override input = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
  });

  static override responses = {
    201: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
      }),
    }),
    400: z.object({
      error: z.string(),
      message: z.string(),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { email, password, name } = this.input;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return this.response(400, { error: "BadRequest", message: "Email already exists" });
    }

    const user = await User.create({ email, password, name });
    return this.status(201).response(201, { user: { id: user.id, email: user.email } });
  }
}
```

## TypeScript Types

The framework exports these types for working with API controllers:

```ts
import type {
  ApiScope,
  ApiTokenConfig,
  ApiTokenVerifyResult,
  ApiProtectionOptions,
  ApiRequestContext,
  ValidationErrorDetail,
} from "@core";
```
