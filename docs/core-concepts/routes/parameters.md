# Route Parameters

> Dynamic URL segments.

## TL;DR

```ts
// app/routes/users/[id]/posts/[postId].get.ts
import { Controller } from "@yoeast/core";

export default class GetPostController extends Controller {
  async handle() {
    const id = this.getParam("id");         // "123"
    const postId = this.getParam("postId"); // "456"
    return this.json({ userId: id, postId });
  }
}
```

## Quick Reference

### Parameter Syntax
| Syntax | Matches | Example URLs |
|--------|---------|--------------|
| `[id]` | Any string | `/users/abc`, `/users/123` |
| `[...path]` | Multiple segments | `/files/a/b/c` |
| `[[...path]]` | Optional segments | `/docs`, `/docs/a` |
| `[id:validator]` | Custom validation | `/users/507f1f77...` |

### Access Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `getParam(name)` | `string \| undefined` | Single parameter |
| `getParams()` | `Record<string, string>` | All parameters |
| `getParamsCoerced()` | `Record<string, string\|number\|boolean\|null>` | Auto-converted types |

## Guide

### Basic Parameters

Any value inside `[brackets]` becomes a parameter:

```ts
// app/routes/users/[id].get.ts
// Matches: /users/123, /users/abc, /users/anything

export default class GetUserController extends Controller {
  async handle() {
    const id = this.getParam("id");
    return this.json({ id });
  }
}
```

### Multiple Parameters

```ts
// app/routes/users/[userId]/posts/[postId].get.ts
// Matches: /users/123/posts/456

export default class GetPostController extends Controller {
  async handle() {
    const userId = this.getParam("userId");
    const postId = this.getParam("postId");
    
    // Or get all at once
    const params = this.getParams();
    // { userId: "123", postId: "456" }
    
    return this.json({ userId, postId });
  }
}
```

### Catch-All Parameters

Capture multiple path segments:

```ts
// app/routes/files/[...path].get.ts

// /files/docs          → path = "docs"
// /files/docs/api      → path = "docs/api"
// /files/docs/api/v1   → path = "docs/api/v1"

export default class FilesController extends Controller {
  async handle() {
    const path = this.getParam("path");
    const segments = path?.split("/") ?? [];
    
    return this.json({ path, segments });
  }
}
```

### Optional Catch-All Parameters

Optional catch-all segments can match zero or more segments:

```ts
// app/routes/docs/[[...slug]].get.ts

// /docs          → slug = undefined
// /docs/a        → slug = "a"
// /docs/a/b      → slug = "a/b"
```

### Custom Validators

Create custom parameter validators in `app/params/`:

```ts
// app/params/mongoId.ts
export default function mongoId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
```

Use in route filename:

```
app/routes/users/[id:mongoId].get.ts
```

The route only matches if the validator returns `true`:

```
✓ /users/507f1f77bcf86cd799439011  → matches
✗ /users/invalid                    → 404
```

### Common Validators

```ts
// app/params/number.ts
export default function number(value: string): boolean {
  return /^\d+$/.test(value);
}

// app/params/uuid.ts  
export default function uuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// app/params/slug.ts
export default function slug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value);
}
```

### Type Coercion

Get parameters with automatic type conversion:

```ts
async handle() {
  const params = this.getParamsCoerced();
  // { id: 123 } instead of { id: "123" }
  
  // Coercion rules:
  // "123" → 123 (number)
  // "true" → true (boolean)
  // "false" → false (boolean)
  // "null" → null
  // "abc" → "abc" (string)
}
```

### Parameter Validation with Zod

Validate parameters with schemas:

```ts
import { z } from "zod";

export default class GetUserController extends Controller {
  schema = {
    params: z.object({
      id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID"),
    }),
  };

  async handle() {
    const { id } = this.getValidatedParams<{ id: string }>()!;
    return this.json({ id });
  }
}
```

### Validation in Controller

For simpler validation, check in the handler:

```ts
async handle() {
  const id = this.getParam("id");
  
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return this.json({ error: "Invalid ID format" }, 400);
  }
  
  const user = await User.findById(id);
  if (!user) {
    return this.json({ error: "User not found" }, 404);
  }
  
  return this.json({ user });
}
```

## See Also

- [Routing](../routing.md) - Routing overview
- [Validation](../controllers/validation.md) - Schema validation
