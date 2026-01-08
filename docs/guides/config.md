# Configuration

> Environment variables and config files.

## TL;DR

```ts
import { env, config } from "@core";

// Environment variables
const port = env("PORT", 3000);
const debug = env("APP_DEBUG", false);

// Config values (dot notation)
const appName = config("app.name");
const dbUri = config("database.uri");
```

## Quick Reference

### Functions
| Function | Returns | Description |
|----------|---------|-------------|
| `env(key)` | `string \| undefined` | Get env variable |
| `env(key, default)` | `T` | Get with default |
| `config(key)` | `unknown` | Get config value |
| `config(key, default)` | `T` | Get with default |

### Config Files
| Location | Purpose |
|----------|---------|
| `core/config/defaults.ts` | Framework defaults |
| `app/config/*.ts` | App overrides |

### Common Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `"Core"` | Application name |
| `APP_ENV` | `"production"` | Environment |
| `APP_DEBUG` | `false` | Debug mode |
| `PORT` | `3000` | Server port |
| `HOST` | `"0.0.0.0"` | Server host |
| `MONGODB_URI` | `mongodb://localhost:27017/core` | Database connection |
| `LOG_LEVEL` | `"info"` | Logging level |
| `CACHE_DRIVER` | `"lru"` | Cache driver |

## Guide

### Environment Variables

Bun automatically loads `.env` files. Access variables with `env()`:

```ts
import { env } from "@core";

// Get string value
const apiKey = env("API_KEY");

// With default (type inferred)
const port = env("PORT", 3000);           // number
const debug = env("APP_DEBUG", false);    // boolean
const name = env("APP_NAME", "My App");   // string

// Required (throws if missing)
const secret = env("JWT_SECRET") ?? (() => {
  throw new Error("JWT_SECRET is required");
})();
```

### .env Files

```bash
# .env
APP_NAME="My Application"
APP_ENV=development
APP_DEBUG=true
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/myapp

# Cache
CACHE_DRIVER=lru
CACHE_PREFIX=myapp:

# Redis (if using redis cache)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=debug
```

### Default Configuration

The framework provides these defaults in `core/config/defaults.ts`:

```ts
{
  app: {
    name: env("APP_NAME", "Core"),
    env: env("APP_ENV", "production"),
    debug: env("APP_DEBUG", false),
    url: env("APP_URL", "http://localhost:3000"),
    key: env("APP_KEY", ""),
  },

  server: {
    port: env("PORT", 3000),
    host: env("HOST", "0.0.0.0"),
  },

  database: {
    uri: env("MONGODB_URI", "mongodb://localhost:27017/core"),
  },

  views: {
    path: "app/views",
    cache: env("VIEW_CACHE", true),
    cachePath: "storage/views",
  },

  static: {
    path: "public",
    maxAge: env("STATIC_MAX_AGE", 86400), // 1 day
  },

  storage: {
    path: "storage",
    cache: "storage/cache",
    logs: "storage/logs",
    views: "storage/views",
  },

  logging: {
    path: "storage/logs",
    level: env("LOG_LEVEL", "info"),
  },

  cache: {
    default: env("CACHE_DRIVER", "lru"),
    enabled: env("CACHE_ENABLED", true),
    prefix: env("CACHE_PREFIX", "yoeast:"),
    ttl: env("CACHE_TTL", 3600),
    stores: {
      lru: {
        max: env("CACHE_LRU_MAX", 10000),
        ttl: env("CACHE_LRU_TTL", 3600),
      },
      redis: {
        host: env("REDIS_HOST", "localhost"),
        port: env("REDIS_PORT", 6379),
        password: env("REDIS_PASSWORD", ""),
        db: env("REDIS_DB", 0),
      },
    },
  },

  cors: {
    origin: env("CORS_ORIGIN", "*"),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: [],
    credentials: env("CORS_CREDENTIALS", false),
    maxAge: env("CORS_MAX_AGE", 86400),
  },

  hints: {
    preload: [],
    preconnect: [],
    prefetch: [],
    dnsPrefetch: [],
  },
}
```

### Override Config

Your config files in `app/config/` merge with defaults:

```ts
// app/config/app.ts
export default {
  name: "My Custom App",  // Overrides default
  customKey: "value",     // Added to config
};

// Result: config("app") returns:
// {
//   name: "My Custom App",   // Your value
//   env: "production",       // From default
//   debug: false,            // From default
//   customKey: "value",      // Your addition
// }
```

### Database Config

```ts
// app/config/database.ts
export default {
  uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/myapp",
};
```

### Cache Config

```ts
// app/config/cache.ts
export default {
  default: "redis",
  prefix: "myapp:",
  stores: {
    redis: {
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "6379"),
    },
  },
};
```

### CORS Config

```ts
// app/config/cors.ts
export default {
  origin: ["https://myapp.com", "https://admin.myapp.com"],
  credentials: true,
  maxAge: 86400,
};
```

### Using Config in Code

```ts
import { config } from "@core";

// In a service
class EmailService extends Service {
  async boot() {
    this.host = config("email.host");
    this.port = config("email.port", 587);
  }
}

// In a controller
export default class SettingsController extends Controller {
  async handle() {
    return this.json({
      appName: config("app.name"),
      version: config("app.version", "1.0.0"),
    });
  }
}
```

## See Also

- [Services](../core-concepts/services.md) - Using config in services
- [Controllers](../core-concepts/controllers.md) - Using config in controllers
