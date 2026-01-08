# Configuration

Core uses a layered configuration system with sensible defaults.

## Environment Variables

Core automatically loads `.env` files (thanks to Bun). Create a `.env` file in your project root:

```env
# Application
APP_NAME=My App
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:3000

# Server
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/myapp

# Cache
CACHE_DRIVER=lru
CACHE_ENABLED=true

# API
API_TOKEN_HEADER=X-API-Token
```

## Accessing Configuration

```typescript
import { env, config } from "@yoeast/core";

// Environment variables with defaults
const port = env("PORT", 3000);
const debug = env("APP_DEBUG", false);

// Config values (dot notation)
const appName = config("app.name");
const cacheDriver = config("cache.default");
```

## Custom Configuration

Create files in `app/config/` to override defaults or add custom settings:

```typescript
// app/config/app.ts
export default {
  name: "My Application",
  timezone: "UTC",
  locale: "en",
};
```

Access with:

```typescript
const timezone = config("app.timezone");
```

## Default Configuration

Core provides sensible defaults in `core/config/defaults.ts`:

```typescript
{
  app: {
    name: "Core",
    env: "production",
    debug: false,
    url: "http://localhost:3000",
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  database: {
    uri: "mongodb://localhost:27017/core",
  },
  cache: {
    default: "lru",
    enabled: true,
    prefix: "yoeast:",
    ttl: 3600,
    stores: {
      lru: { max: 10000, ttl: 3600 },
      redis: { host: "localhost", port: 6379 },
    },
  },
  api: {
    tokenHeader: "X-API-Token",
  },
}
```

## Configuration Priority

1. Environment variables (highest priority)
2. `app/config/*.ts` files
3. `core/config/defaults.ts` (lowest priority)

## Type-Safe Config

Use generics for type safety:

```typescript
interface DatabaseConfig {
  uri: string;
  options?: Record<string, unknown>;
}

const dbConfig = config<DatabaseConfig>("database");
```

## See Also

- [Installation](./installation.md)
- [Services](../core-concepts/services.md)
- [Caching](../core-concepts/controllers/caching.md)
