# Middleware

> Intercept and modify requests and responses.

## TL;DR

```ts
// app/middleware/logger.ts
import { Middleware } from "@core";

export default class LoggerMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    const start = Date.now();
    const res = await next();
    console.log(`${req.method} ${req.url} → ${res.status} (${Date.now() - start}ms)`);
    return res;
  }
}
```

## Quick Reference

### Middleware Class
```ts
class Middleware {
  handle(req: Request, next: () => Promise<Response>): Promise<Response>
}
```

### Execution Order
1. Middleware runs in registration order
2. `next()` calls the next middleware or controller
3. Response flows back through middleware in reverse

## Guide

### Creating Middleware

Create a class extending `Middleware`:

```ts
// app/middleware/auth.ts
import { Middleware } from "@core";

export default class AuthMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    const token = req.headers.get("Authorization");
    
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Token is valid, continue to next middleware/controller
    return next();
  }
}
```

### Before and After Logic

```ts
export default class TimingMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    // BEFORE: Runs before controller
    const start = performance.now();
    
    // Call next middleware/controller
    const response = await next();
    
    // AFTER: Runs after controller
    const duration = performance.now() - start;
    
    // Modify response headers
    const headers = new Headers(response.headers);
    headers.set("X-Response-Time", `${duration.toFixed(2)}ms`);
    
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
}
```

### Short-Circuit Responses

Return early without calling `next()`:

```ts
export default class MaintenanceMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    if (process.env.MAINTENANCE_MODE === "true") {
      return new Response(JSON.stringify({
        error: "Service Unavailable",
        message: "We are currently under maintenance",
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return next();
  }
}
```

### Request Modification

Note: Request objects are immutable, but you can pass data via headers:

```ts
export default class UserMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (token) {
      const user = await verifyToken(token);
      
      // Create new request with user info in header
      const newReq = new Request(req, {
        headers: new Headers(req.headers),
      });
      newReq.headers.set("X-User-Id", user.id);
      newReq.headers.set("X-User-Role", user.role);
      
      return next(); // Note: Core uses original request
    }
    
    return next();
  }
}
```

### Response Modification

Transform response body or headers:

```ts
export default class JsonWrapperMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    const response = await next();
    
    // Only wrap JSON responses
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      return response;
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: response.ok,
      data,
      timestamp: new Date().toISOString(),
    }), {
      status: response.status,
      headers: response.headers,
    });
  }
}
```

### Error Handling

Catch errors from downstream:

```ts
export default class ErrorMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    try {
      return await next();
    } catch (error) {
      console.error("Unhandled error:", error);
      
      return new Response(JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
```

### CORS Example

```ts
export default class CorsMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    
    const response = await next();
    
    // Add CORS headers to response
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
}
```

### Rate Limiting Example

```ts
const requests = new Map<string, number[]>();

export default class RateLimitMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    const ip = req.headers.get("X-Forwarded-For") ?? "unknown";
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;
    
    // Get request timestamps for this IP
    const timestamps = requests.get(ip) ?? [];
    
    // Filter to recent requests
    const recent = timestamps.filter(t => now - t < windowMs);
    
    if (recent.length >= maxRequests) {
      return new Response(JSON.stringify({
        error: "Too Many Requests",
        retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000),
      }), {
        status: 429,
        headers: { 
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((recent[0] + windowMs - now) / 1000)),
        },
      });
    }
    
    // Record this request
    recent.push(now);
    requests.set(ip, recent);
    
    return next();
  }
}
```

## See Also

- [Controllers](./controllers.md) - Request handling
- [CORS](./controllers/cors.md) - Built-in CORS support
