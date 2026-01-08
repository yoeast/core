# Routing

> File-based routing where URL structure mirrors file structure.

## TL;DR

```
app/routes/
├── index.get.ts          → GET /
├── users.get.ts          → GET /users
├── users.post.ts         → POST /users
└── users/
    ├── [id].get.ts       → GET /users/:id
    └── [id].put.ts       → PUT /users/:id
```

```ts
// app/routes/users/[id].get.ts
import { Controller } from "@yoeast/core";

export default class GetUserController extends Controller {
  async handle() {
    const id = this.getParam("id");
    return this.json({ id });
  }
}
```

## Quick Reference

### File Naming
| Pattern | URL | Description |
|---------|-----|-------------|
| `index.get.ts` | `/` | Index route |
| `users.get.ts` | `/users` | Static path |
| `users.post.ts` | `/users` | Different method |
| `[id].get.ts` | `/:id` | Dynamic parameter |
| `[...path].get.ts` | `/*` | Catch-all |
| `[[...path]].get.ts` | `/(optional)` | Optional catch-all |

### HTTP Methods
| Extension | Method |
|-----------|--------|
| `.get.ts` | GET |
| `.post.ts` | POST |
| `.put.ts` | PUT |
| `.patch.ts` | PATCH |
| `.delete.ts` | DELETE |
| `.ws.ts` | WebSocket |
| `.sse.ts` | Server-Sent Events |

## Guide

### Basic Routes

Create a file in `app/routes/` with the method extension:

```ts
// app/routes/hello.get.ts → GET /hello
import { Controller } from "@yoeast/core";

export default class HelloController extends Controller {
  async handle() {
    return this.json({ message: "Hello!" });
  }
}
```

### Nested Routes

Directory structure creates URL paths:

```
app/routes/
└── api/
    └── v1/
        └── users/
            ├── index.get.ts    → GET /api/v1/users
            ├── index.post.ts   → POST /api/v1/users
            ├── [id].get.ts     → GET /api/v1/users/:id
            ├── [id].put.ts     → PUT /api/v1/users/:id
            └── [id]/
                └── posts.get.ts → GET /api/v1/users/:id/posts
```

### Dynamic Parameters

Use square brackets for URL parameters:

```ts
// app/routes/users/[id].get.ts
export default class GetUserController extends Controller {
  async handle() {
    const id = this.getParam("id"); // From URL
    const user = await User.findById(id);
    return this.json({ user });
  }
}
```

Parameters can be any string value. Validation should be done in the controller:

```ts
async handle() {
  const id = this.getParam("id");
  
  // Validate format
  if (!/^[a-f\d]{24}$/i.test(id ?? "")) {
    return this.json({ error: "Invalid ID" }, 400);
  }
  
  const user = await User.findById(id);
  return this.json({ user });
}
```

### Catch-All Routes

Capture multiple path segments:

```ts
// app/routes/files/[...path].get.ts
// Matches: /files/a, /files/a/b, /files/a/b/c

export default class FilesController extends Controller {
  async handle() {
    const path = this.getParam("path"); 
    // For /files/docs/api/users → path = "docs/api/users"
    return this.json({ path });
  }
}
```

### Optional Catch-All Routes

Optional catch-all segments can match zero or more segments:

```ts
// app/routes/docs/[[...slug]].get.ts
// Matches: /docs, /docs/a, /docs/a/b
```

### Index Routes

`index.get.ts` maps to the directory path:

```
app/routes/
├── index.get.ts          → GET /
└── users/
    └── index.get.ts      → GET /users
```

### Multiple Methods

Same path, different methods in separate files:

```
app/routes/users/
├── index.get.ts    → GET /users (list)
├── index.post.ts   → POST /users (create)
├── [id].get.ts     → GET /users/:id (read)
├── [id].put.ts     → PUT /users/:id (update)
└── [id].delete.ts  → DELETE /users/:id (delete)
```

### Custom Parameter Validation

Create validators in `app/params/`:

```ts
// app/params/mongoId.ts
export default function mongoId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
```

Use in route names:

```
app/routes/users/[id:mongoId].get.ts
```

The route only matches if the validator returns true.

## Detailed Guides

- [Dynamic Parameters](./routes/parameters.md) - URL parameters
- [WebSocket Routes](./routes/websocket.md) - Real-time WebSocket connections
- [SSE Routes](./routes/sse.md) - Server-Sent Events streaming

## See Also

- [Controllers](./controllers.md) - Handling requests
- [Middleware](./middleware.md) - Request/response middleware
