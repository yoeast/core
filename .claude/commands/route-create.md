---
description: Scaffold a new route controller
argument-hint: <path> <method>
---

Create a new route file. The path should be relative to `app/routes/`.

For example, to create `GET /api/posts`:
1. Create file `app/routes/api/posts.get.ts`
2. Use this template:

```typescript
import { Controller } from "@core";

export default class PostsController extends Controller {
  async handle() {
    // TODO: Implement
    return this.json({ message: "Not implemented" });
  }
}
```

Route naming conventions:
- `index.get.ts` → `GET /`
- `users.get.ts` → `GET /users`
- `users.post.ts` → `POST /users`
- `users/[id].get.ts` → `GET /users/:id`
- `users/[id].put.ts` → `PUT /users/:id`
- `users/[id].delete.ts` → `DELETE /users/:id`
