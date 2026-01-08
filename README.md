# Core

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Conventions spec (draft)

### App structure (user land)
- `app/routes/**` HTTP route handlers (file-based routing).
- `app/middleware/**` global middleware, auto-loaded in lexical order.
- `app/plugins/**` app plugins, auto-loaded in lexical order.
- `app/cron/**` cron job handlers, auto-loaded.
- `app/queue/**` queue job handlers, auto-loaded.
- `app/cli/**` CLI command handlers, auto-loaded.
- `app/services/**` shared services/utilities.

### Route files (file-based routing)
We lean on Nitro/Nuxt/SvelteKit-style filesystem routing.

- File suffix defines HTTP method: `.get.ts`, `.post.ts`, `.put.ts`, `.patch.ts`, `.delete.ts`, `.options.ts`, `.head.ts`.
- Path is derived from file path under `app/routes/`.
  - `index` maps to `/`.
  - Nested folders create nested paths.
  - `[id]` maps to `:id` (single dynamic segment).
  - `[...slug]` maps to a catch-all segment (one or more).
  - `[[...slug]]` maps to an optional catch-all segment (zero or more).
  - `[id:number]` maps to a typed/matched segment (see matchers below).
- One file = one method = one class.

### Route matchers (draft)
Optional segment matchers (SvelteKit-style) to constrain params:

- Syntax: `[param:matcher]` (e.g. `[id:number]`).
- Request is a 404 if the matcher fails for that segment.
- Matchers are defined as functions in `app/params/`.

Example:
```
app/params/number.ts
app/routes/api/users/[id:number]/index.get.ts
```

Example:
```
app/routes/index.get.ts          -> GET /
app/routes/users/[id].get.ts     -> GET /users/:id
app/routes/users/[id].post.ts    -> POST /users/:id
```

### Route controller base class
- Each route file default-exports a class extending the base `Controller`.
- Base class provides `before` and `after` hooks and a `run()` template method.
- Subclasses implement `handle(req)` only.

Example:
```ts
// app/routes/index.get.ts
import { Controller } from "our-core";

export default class IndexGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({ ok: true });
  }
}
```

### Controller niceties (draft)
Controllers expose helper methods inspired by server frameworks and PHP-style DX:

- `getHeaders()` / `getHeader(name)`
- `setHeader(name, value)` / `setHeaders(record)`
- `getCookies()` / `getCookie(name)` / `setCookie(name, value, options?)`
- `getBodyJson<T>()` / `getBodyText()` / `getBodyForm()`
- `getParams()` / `getParam(name)`
- `getQuery()` / `getQueryParam(name)`
- `status(code)` (sets response status for helpers)
- `text(body, status?)` / `json(data, status?)` / `redirect(url, status?)`

Notes:
- `handle()` can read from helpers without needing the raw `Request`.
- Core `run(req)` sets the internal request object for helpers.
- Helpers are optional sugar around the raw `Request` and standard `Response`.

### Middleware (sketch)
- Each file default-exports a class extending `Middleware`.
- `handle(req, next)` must call `await next()` to continue.

### Plugins (sketch)
- Each file default-exports a class extending `Plugin`.
- `init(app)` is invoked at startup.

### Jobs (sketch)
- Cron: default-export class extending `CronJob`, implements `run()`.
- Queue: default-export class extending `QueueJob`, implements `process(payload)`.

### CLI (sketch)
- Each file default-exports class extending `CliCommand`, implements `run(args)`.
