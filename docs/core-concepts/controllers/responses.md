# Responses

> Returning JSON, text, HTML, redirects, and streaming responses.

## TL;DR

```ts
async handle() {
  return this.json({ data: "value" });        // JSON
  return this.text("Hello");                   // Plain text
  return this.render("home", { title: "Hi" }); // HTML template
  return this.redirect("/login");              // Redirect
}
```

## Quick Reference

| Method | Content-Type | Description |
|--------|--------------|-------------|
| `json(data, options?)` | `application/json` | JSON response |
| `text(body, options?)` | `text/plain` | Plain text |
| `render(view, data?, options?)` | `text/html` | Handlebars template |
| `redirect(url, status?)` | - | HTTP redirect |
| `stream(body, contentType?)` | varies | Streaming response |

### Options

```ts
interface ResponseOptions {
  ttl?: number;      // Cache TTL in seconds
  key?: string;      // Custom cache key
  noCache?: boolean; // Disable caching
}
```

## Guide

### JSON Response

Return JSON data:

```ts
async handle() {
  return this.json({ message: "Hello", count: 42 });
}
```

With status code:

```ts
async handle() {
  return this.json({ error: "Not found" }, 404);
  
  // Or using status()
  return this.status(404).json({ error: "Not found" });
}
```

With caching:

```ts
async handle() {
  return this.json({ data: expensive }, { ttl: 300 }); // Cache 5 min
}
```

### Text Response

Return plain text:

```ts
async handle() {
  return this.text("Hello, World!");
}
```

With status:

```ts
async handle() {
  return this.text("Created", 201);
}
```

### HTML Templates

Render Handlebars templates:

```ts
async handle() {
  return this.render("home", { 
    title: "Welcome",
    user: { name: "John" },
  });
}
```

Templates are in `app/views/pages/`:

```html
<!-- app/views/pages/home.html -->
<h1>{{title}}</h1>
<p>Hello, {{user.name}}!</p>
```

With custom layout:

```ts
// Use different layout
return this.render("dashboard", data, { layout: "layouts/admin" });

// No layout (just the page template)
return this.render("fragment", data, { layout: false });
```

### Redirects

```ts
async handle() {
  // 302 Found (temporary)
  return this.redirect("/login");
  
  // 301 Moved Permanently
  return this.redirect("/new-url", 301);
  
  // 303 See Other (after POST)
  return this.redirect("/success", 303);
}
```

### Streaming Responses

Return a streaming response:

```ts
async handle() {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(new TextEncoder().encode(`Line ${i}\n`));
        await new Promise(r => setTimeout(r, 100));
      }
      controller.close();
    }
  });
  
  return this.stream(stream, "text/plain");
}
```

### Setting Status Code

Set the response status code:

```ts
async handle() {
  // Method chaining
  return this.status(201).json({ created: true });
  
  // Or via options
  return this.json({ created: true }, 201);
}
```

Common status codes:
- `200` OK (default)
- `201` Created
- `204` No Content
- `301` Moved Permanently
- `302` Found (temporary redirect)
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

### Custom Headers

Set response headers before returning:

```ts
async handle() {
  this.setHeader("X-Custom", "value");
  this.setHeader("X-Request-Id", crypto.randomUUID());
  
  return this.json({ data: "value" });
}
```

Set multiple headers:

```ts
async handle() {
  this.setHeaders({
    "X-Custom": "value",
    "X-Request-Id": crypto.randomUUID(),
  });
  
  return this.json({ data: "value" });
}
```

### Setting Cookies

```ts
async handle() {
  this.setCookie("session", "abc123", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 86400, // 1 day in seconds
    path: "/",
  });
  
  return this.json({ loggedIn: true });
}
```

Cookie options:
- `httpOnly` - Not accessible via JavaScript
- `secure` - Only sent over HTTPS
- `sameSite` - `"Strict"`, `"Lax"`, or `"None"`
- `maxAge` - Lifetime in seconds
- `path` - URL path scope

### Response Caching

Enable automatic caching with ETags:

```ts
export default class DataController extends Controller {
  // Default TTL for all responses
  protected responseCacheTtl = 300; // 5 minutes
  
  async handle() {
    // Uses default TTL
    return this.json({ data: "value" });
    
    // Override TTL
    return this.json({ data: "value" }, { ttl: 60 });
    
    // Custom cache key
    return this.json(data, { key: "custom:key" });
    
    // Disable caching
    return this.json(data, { noCache: true });
  }
}
```

Cache headers sent:
- `ETag` - Content hash for conditional requests
- `Cache-Control: max-age=N`
- `X-Cache: HIT | MISS | SKIP`

## See Also

- [Views](../views.md) - Template system
- [Response Caching](./caching.md) - Caching details
- [Controllers](../controllers.md) - Controller overview
