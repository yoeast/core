# Controllers

> Handle HTTP requests and return responses.

## TL;DR

```ts
// app/routes/users.get.ts
import { Controller } from "@yoeast/core";

export default class UsersController extends Controller {
  async handle() {
    const page = this.getQueryParam("page") ?? "1";
    return this.json({ users: [], page: parseInt(page) });
  }
}
```

## Quick Reference

### Request Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `getRequest()` | `Request` | Raw Request object |
| `getUrl()` | `URL` | Parsed URL |
| `getParams()` | `Record<string, string>` | Route parameters |
| `getParam(name)` | `string \| undefined` | Single route param |
| `getQuery()` | `URLSearchParams` | Query string |
| `getQueryParam(name)` | `string \| null` | Single query param |
| `getQueryObject()` | `Record<string, string>` | Query as object |
| `getHeader(name)` | `string \| null` | Request header |
| `getHeaders()` | `Headers` | All request headers |
| `getCookie(name)` | `string \| undefined` | Cookie value |
| `getCookies()` | `Record<string, string>` | All cookies |
| `getBodyJson()` | `Promise<T>` | Parse JSON body |
| `getBodyText()` | `Promise<string>` | Raw body text |
| `getBodyForm()` | `Promise<FormData>` | Parse form data |

### Response Methods
| Method | Returns | Description |
|--------|---------|-------------|
| `json(data, options?)` | `Promise<Response>` | JSON response |
| `text(body, options?)` | `Promise<Response>` | Plain text response |
| `render(view, data?, options?)` | `Promise<Response>` | HTML from template |
| `redirect(url, status?)` | `Response` | Redirect response |
| `stream(body, contentType?)` | `Response` | Streaming response |
| `status(code)` | `this` | Set status code |
| `setHeader(name, value)` | `void` | Set response header |
| `setCookie(name, value, options?)` | `void` | Set cookie |

### Properties
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `cors` | `boolean \| CorsOptions` | `false` | Enable CORS |
| `responseCacheTtl` | `number` | `undefined` | Response cache TTL (seconds) |
| `maxBodyBytes` | `number` | `1048576` | Max request body size |
| `schema` | `object` | `undefined` | Validation schemas |

## Guide

Controllers are classes that handle HTTP requests. Each route file exports a default controller class that extends `Controller`.

### Basic Controller

```ts
// app/routes/hello.get.ts
import { Controller } from "@yoeast/core";

export default class HelloController extends Controller {
  async handle() {
    return this.json({ message: "Hello, World!" });
  }
}
```

### Request Data

Access data from the incoming request:

```ts
async handle() {
  // Route parameters from URL (e.g., /users/[id])
  const id = this.getParam("id");
  
  // Query string (e.g., ?page=2&limit=10)
  const page = this.getQueryParam("page");
  const query = this.getQueryObject(); // { page: "2", limit: "10" }
  
  // Request body
  const body = await this.getBodyJson<{ name: string }>();
  
  // Headers
  const auth = this.getHeader("Authorization");
  
  // Cookies
  const session = this.getCookie("session_id");
}
```

### Responses

Return different response types:

```ts
async handle() {
  // JSON
  return this.json({ data: "value" });
  
  // Plain text
  return this.text("Hello");
  
  // HTML template
  return this.render("home", { title: "Welcome" });
  
  // Redirect
  return this.redirect("/login");
  
  // Custom status
  return this.status(201).json({ created: true });
}
```

### Setting Headers and Cookies

```ts
async handle() {
  // Response headers
  this.setHeader("X-Custom", "value");
  this.setHeaders({ "X-A": "1", "X-B": "2" });
  
  // Cookies
  this.setCookie("session", "abc123", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 86400, // 1 day
    path: "/",
  });
  
  return this.json({ ok: true });
}
```

### Lifecycle Hooks

Run code before and after the main handler:

```ts
export default class MyController extends Controller {
  async before(req: Request) {
    // Runs before handle()
    console.log("Request:", req.url);
  }
  
  async handle() {
    return this.json({ data: "value" });
  }
  
  async after(req: Request, res: Response) {
    // Runs after handle()
    console.log("Response status:", res.status);
  }
}
```

## Detailed Guides

- [Request Data](./controllers/request-data.md) - Accessing params, query, body, headers, cookies
- [Responses](./controllers/responses.md) - JSON, text, HTML, redirects, streaming
- [Validation](./controllers/validation.md) - Schema validation with Zod
- [Response Caching](./controllers/caching.md) - ETags and cache headers
- [CORS](./controllers/cors.md) - Cross-origin resource sharing
- [Resource Hints](./controllers/hints.md) - Preload, preconnect, prefetch

## See Also

- [Routes](./routing.md) - File-based routing
- [API Controllers](../api-reference/api-controller.md) - Schema-driven APIs
- [Middleware](./middleware.md) - Request/response middleware
