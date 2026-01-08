# Lifecycle Hooks

> Run code before and after request handling.

## TL;DR

```ts
import { Controller } from "@yoeast/core";

export default class MyController extends Controller {
  async before(req: Request) {
    console.log("Before:", req.method, req.url);
  }

  async handle() {
    return this.json({ data: "value" });
  }

  async after(req: Request, res: Response) {
    console.log("After:", res.status);
  }
}
```

## Quick Reference

| Method | Called | Arguments | Can Modify |
|--------|--------|-----------|------------|
| `before(req)` | Before `handle()` | Request | Controller state |
| `handle()` | Main handler | - | Returns Response |
| `after(req, res)` | After `handle()` | Request, Response | Nothing |

## Guide

### Before Hook

Runs before `handle()`. Use for:
- Logging
- Setting up controller state
- Early validation
- Loading shared data

```ts
export default class DashboardController extends Controller {
  private user!: User;

  async before(req: Request) {
    // Load user for use in handle()
    const token = req.headers.get("Authorization");
    this.user = await User.findByToken(token);
    
    if (!this.user) {
      throw new HttpError(401, "Unauthorized");
    }
  }

  async handle() {
    return this.json({ 
      dashboard: await getDashboard(this.user.id) 
    });
  }
}
```

### After Hook

Runs after `handle()`. Use for:
- Logging response info
- Analytics
- Cleanup

```ts
export default class ApiController extends Controller {
  private startTime!: number;

  async before(req: Request) {
    this.startTime = Date.now();
  }

  async handle() {
    return this.json({ data: "value" });
  }

  async after(req: Request, res: Response) {
    const duration = Date.now() - this.startTime;
    console.log(`${req.method} ${req.url} → ${res.status} (${duration}ms)`);
  }
}
```

### Request Timing

```ts
export default class TimedController extends Controller {
  private startTime!: number;

  async before() {
    this.startTime = performance.now();
  }

  async handle() {
    const data = await expensiveOperation();
    return this.json(data);
  }

  async after(req: Request, res: Response) {
    const duration = (performance.now() - this.startTime).toFixed(2);
    console.log(`Request took ${duration}ms`);
  }
}
```

### Error Handling

If `before()` throws, `handle()` and `after()` are not called:

```ts
async before(req: Request) {
  const token = this.getHeader("X-API-Key");
  if (!token) {
    throw new HttpError(401, "API key required");
  }
}
```

If `handle()` throws, `after()` is not called.

### Base Controller Pattern

Create a base controller for shared logic:

```ts
// app/controllers/base.ts
import { Controller } from "@yoeast/core";
import type { User } from "@app/models/User";

export abstract class AuthenticatedController extends Controller {
  protected user!: User;

  async before(req: Request) {
    const token = this.getHeader("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new HttpError(401, "Authentication required");
    }
    
    this.user = await User.findByToken(token);
    if (!this.user) {
      throw new HttpError(401, "Invalid token");
    }
  }
}

// app/routes/profile.get.ts
import { AuthenticatedController } from "@app/controllers/base";

export default class ProfileController extends AuthenticatedController {
  async handle() {
    return this.json({ user: this.user });
  }
}
```

## See Also

- [Controllers](../controllers.md) - Controller overview
- [Middleware](../middleware.md) - Request/response middleware
