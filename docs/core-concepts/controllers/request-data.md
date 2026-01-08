# Request Data

> Accessing request parameters, query strings, body, headers, and cookies.

## TL;DR

```ts
async handle() {
  const id = this.getParam("id");              // Route param
  const page = this.getQueryParam("page");    // Query string
  const body = await this.getBodyJson();      // JSON body
  const token = this.getHeader("Authorization");
  const session = this.getCookie("session");
}
```

## Quick Reference

| Method | Returns | Description |
|--------|---------|-------------|
| `getParams()` | `Record<string, string \| undefined>` | All route parameters |
| `getParam(name)` | `string \| undefined` | Single route parameter |
| `getParamsCoerced()` | `Record<string, string\|number\|boolean\|null>` | Auto-converted params |
| `getQuery()` | `URLSearchParams` | Query string as URLSearchParams |
| `getQueryObject()` | `Record<string, string>` | Query as plain object |
| `getQueryParam(name)` | `string \| null` | Single query parameter |
| `getQueryCoerced()` | `Record<string, string\|number\|boolean\|null>` | Auto-converted query |
| `getBodyJson<T>(schema?)` | `Promise<T>` | Parse JSON body |
| `getBodyText()` | `Promise<string>` | Raw body as text |
| `getBodyForm()` | `Promise<FormData>` | Parse as FormData |
| `getHeader(name)` | `string \| null` | Request header value |
| `getHeaders()` | `Headers` | All request headers |
| `getCookie(name)` | `string \| undefined` | Single cookie value |
| `getCookies()` | `Record<string, string>` | All cookies |
| `getRequest()` | `Request` | Raw Fetch API Request |
| `getUrl()` | `URL` | Parsed URL object |

## Guide

### Route Parameters

Route parameters come from dynamic segments in the URL path.

```ts
// app/routes/users/[id]/posts/[postId].get.ts
// URL: /users/123/posts/456

async handle() {
  const params = this.getParams();
  // { id: "123", postId: "456" }
  
  const id = this.getParam("id");
  // "123"
}
```

#### Type Coercion

Convert string params to appropriate types automatically:

```ts
// URL: /items?count=5&active=true

const raw = this.getQueryObject();
// { count: "5", active: "true" }

const coerced = this.getQueryCoerced();
// { count: 5, active: true }
```

Coercion rules:
- `"true"` / `"false"` → boolean
- `"null"` → null
- Numeric strings → number
- Everything else → string

### Query String

Access URL query parameters:

```ts
// URL: /search?q=hello&page=2&sort=name

async handle() {
  // URLSearchParams (supports multiple values)
  const query = this.getQuery();
  query.get("q");      // "hello"
  query.getAll("tag"); // ["a", "b"] for ?tag=a&tag=b
  
  // As plain object (last value wins if duplicated)
  const obj = this.getQueryObject();
  // { q: "hello", page: "2", sort: "name" }
  
  // Single value
  const page = this.getQueryParam("page"); // "2"
  const missing = this.getQueryParam("foo"); // null
}
```

### Request Body

Parse the request body in different formats:

#### JSON Body

```ts
// POST with Content-Type: application/json

async handle() {
  const data = await this.getBodyJson<{ name: string; email: string }>();
  // { name: "John", email: "john@example.com" }
}
```

With inline validation:

```ts
import { z } from "zod";

async handle() {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });
  
  const data = await this.getBodyJson(schema);
  // Throws schema error if validation fails
}
```

#### Text Body

```ts
async handle() {
  const text = await this.getBodyText();
}
```

#### Form Data

```ts
// POST with Content-Type: multipart/form-data

async handle() {
  const form = await this.getBodyForm();
  const name = form.get("name");
  const file = form.get("avatar") as File;
}
```

### Headers

```ts
async handle() {
  // Single header
  const auth = this.getHeader("Authorization");
  const contentType = this.getHeader("Content-Type");
  
  // All headers
  const headers = this.getHeaders();
  headers.forEach((value, name) => {
    console.log(`${name}: ${value}`);
  });
}
```

### Cookies

```ts
async handle() {
  // Single cookie
  const session = this.getCookie("session_id");
  
  // All cookies
  const cookies = this.getCookies();
  // { session_id: "abc123", theme: "dark" }
}
```

### Raw Request

Access the underlying Fetch API Request object:

```ts
async handle() {
  const req = this.getRequest();
  
  req.method;        // "GET", "POST", etc.
  req.url;           // Full URL string
  req.headers;       // Headers object
  await req.json();  // Body (only readable once!)
}
```

### Parsed URL

```ts
async handle() {
  const url = this.getUrl();
  
  url.pathname;      // "/users/123"
  url.search;        // "?page=2"
  url.searchParams;  // URLSearchParams
  url.origin;        // "http://localhost:3000"
  url.hostname;      // "localhost"
}
```

### Body Size Limit

By default, request bodies are limited to 1MB. Override per-controller:

```ts
export default class UploadController extends Controller {
  protected maxBodyBytes = 10 * 1024 * 1024; // 10MB
  
  async handle() {
    const data = await this.getBodyJson();
    // ...
  }
}
```

Exceeding the limit throws `HttpError(413, "Payload Too Large")`.

## See Also

- [Validation](./validation.md) - Schema validation
- [Controllers](../controllers.md) - Controller overview
