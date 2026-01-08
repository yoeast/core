# CORS

> Enable Cross-Origin Resource Sharing on a per-controller basis.

## TL;DR

```ts
// app/routes/api/data.get.ts
import { Controller } from "@yoeast/core";

export default class DataController extends Controller {
  protected cors = true; // Enable CORS with defaults

  async handle() {
    return this.json({ data: "accessible from any origin" });
  }
}
```

## Quick Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cors` | `boolean \| CorsOptions` | `false` | Enable CORS on this controller |
| `origin` | `string \| string[] \| ((origin: string) => boolean)` | `"*"` | Allowed origins |
| `methods` | `string[]` | `["GET","HEAD","PUT","PATCH","POST","DELETE"]` | Allowed methods |
| `allowedHeaders` | `string[]` | `["Content-Type","Authorization","X-Requested-With"]` | Allowed request headers |
| `exposedHeaders` | `string[]` | `[]` | Headers exposed to browser |
| `credentials` | `boolean` | `false` | Allow credentials (cookies) |
| `maxAge` | `number` | `86400` | Preflight cache duration (seconds) |

## Guide

### Basic CORS

Set `cors = true` to use defaults (allow all origins):

```ts
export default class MyController extends Controller {
  protected cors = true;
  
  async handle() {
    return this.json({ ok: true });
  }
}
```

### Restrict to Specific Origins

```ts
export default class MyController extends Controller {
  protected cors = {
    origin: ["https://app.example.com", "https://admin.example.com"],
  };
  
  async handle() {
    return this.json({ ok: true });
  }
}
```

### Allow Credentials

When your frontend needs to send cookies:

```ts
export default class MyController extends Controller {
  protected cors = {
    origin: "https://app.example.com", // Must be specific origin, not "*"
    credentials: true,
  };
  
  async handle() {
    return this.json({ ok: true });
  }
}
```

### Expose Custom Headers

Let browsers access custom response headers:

```ts
export default class MyController extends Controller {
  protected cors = {
    origin: "*",
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  };
  
  async handle() {
    this.setHeader("X-Total-Count", "100");
    return this.json({ items: [] });
  }
}
```

### Global Defaults

Set default CORS options in `app/config/cors.ts`:

```ts
// app/config/cors.ts
export default {
  origin: ["https://app.example.com"],
  credentials: true,
  maxAge: 3600,
};
```

Controllers with `cors = true` will use these defaults.

## API Reference

### CorsOptions

```ts
interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
```

### Controller Property

```ts
class Controller {
  protected cors: boolean | CorsOptions = false;
}
```

- `false` - No CORS headers (default)
- `true` - Use config defaults
- `CorsOptions` - Override specific options

### Preflight Handling

The framework automatically handles `OPTIONS` preflight requests for routes with CORS enabled. No additional configuration needed.

### Dynamic Origin Validation

Use a function to validate origins dynamically:

```ts
export default class MyController extends Controller {
  protected cors = {
    origin: (origin: string) => origin.endsWith(".example.com"),
  };
  
  async handle() {
    return this.json({ ok: true });
  }
}
```

### Functions (Advanced)

```ts
import { applyCorsHeaders, createPreflightResponse, resolveCorsOptions } from "@yoeast/core";

// Apply CORS headers to an existing response
const response = applyCorsHeaders(request, existingResponse, corsConfig);

// Create a preflight response
const preflight = createPreflightResponse(request, corsConfig);

// Resolve options from config + overrides
const options = resolveCorsOptions(controllerCors);
```

## See Also

- [Controllers](../core-concepts/controllers.md)
- [Configuration](../getting-started/configuration.md)
