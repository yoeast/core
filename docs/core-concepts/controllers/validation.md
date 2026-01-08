# Validation

> Validate request data with Zod schemas.

## TL;DR

```ts
import { Controller } from "@core";
import { z } from "zod";

export default class CreateUserController extends Controller {
  schema = {
    body: z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
  };

  async handle() {
    const body = this.getValidatedBody<{ name: string; email: string }>();
    return this.json({ user: body });
  }
}
```

## Quick Reference

### Schema Properties
| Property | Validates | Input Source |
|----------|-----------|--------------|
| `schema.params` | Route parameters | URL path segments |
| `schema.query` | Query string | URL query params |
| `schema.body` | Request body | JSON body |

### Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `getValidatedParams<T>()` | `T \| undefined` | Validated route params |
| `getValidatedQuery<T>()` | `T \| undefined` | Validated query string |
| `getValidatedBody<T>()` | `T \| undefined` | Validated request body |
| `validate(schema, data)` | `T` | Manual validation |

## Guide

### Basic Validation

Define schemas in the `schema` property:

```ts
import { Controller } from "@core";
import { z } from "zod";

export default class UpdateUserController extends Controller {
  schema = {
    params: z.object({
      id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID"),
    }),
    body: z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      age: z.number().int().positive().optional(),
    }),
  };

  async handle() {
    const { id } = this.getValidatedParams<{ id: string }>()!;
    const body = this.getValidatedBody<{ name: string; email: string }>();
    
    return this.json({ id, ...body });
  }
}
```

### Query String Validation

```ts
export default class ListUsersController extends Controller {
  schema = {
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sort: z.enum(["name", "created", "updated"]).default("created"),
    }),
  };

  async handle() {
    const { page, limit, sort } = this.getValidatedQuery<{
      page: number;
      limit: number;
      sort: string;
    }>()!;
    
    return this.json({ page, limit, sort });
  }
}
```

Note: Use `z.coerce.number()` for query params since they arrive as strings.

### Type Coercion

Enable automatic type coercion for params and query:

```ts
export default class MyController extends Controller {
  protected schemaCoerce = true; // Enable coercion
  
  schema = {
    query: z.object({
      active: z.boolean(),
      count: z.number(),
    }),
  };

  async handle() {
    // ?active=true&count=5 → { active: true, count: 5 }
    const query = this.getValidatedQuery<{ active: boolean; count: number }>();
    return this.json(query);
  }
}
```

Coercion rules:
- `"true"` / `"false"` → boolean
- `"null"` → null
- Numeric strings → number

### Manual Validation

Validate data manually with `validate()`:

```ts
async handle() {
  const data = await this.getBodyJson();
  
  const schema = z.object({
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().positive(),
    })),
  });
  
  const validated = this.validate(schema, data);
  return this.json({ items: validated.items });
}
```

### Inline Body Validation

Validate body inline when reading:

```ts
async handle() {
  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
  });
  
  const body = await this.getBodyJson(schema);
  // Throws schema error if invalid
  
  return this.json({ user: body });
}
```

### Validation Errors

In the base `Controller`, invalid data throws a Zod error. You can catch it or throw an `HttpError` yourself. With `ApiController`, invalid input is returned as a structured 400 response like:

```json
{
  "error": "ValidationError",
  "message": "Request input validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

### Complex Schemas

```ts
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string().length(2),
  zip: z.string().optional(),
});

export default class CreateOrderController extends Controller {
  schema = {
    body: z.object({
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })).min(1),
      shipping: AddressSchema,
      billing: AddressSchema.optional(),
      notes: z.string().max(500).optional(),
    }),
  };

  async handle() {
    const order = this.getValidatedBody();
    return this.json({ order });
  }
}
```

### Custom Error Messages

```ts
schema = {
  body: z.object({
    email: z.string().email({ message: "Please enter a valid email" }),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
  }),
};
```

## See Also

- [Request Data](./request-data.md) - Accessing request data
- [API Controllers](../../api-reference/api-controller.md) - Schema-driven APIs with OpenAPI
- [Controllers](../controllers.md) - Controller overview
