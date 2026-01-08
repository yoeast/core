# Cache

> Multi-driver caching with tags and response caching.

## TL;DR

```ts
import { cache } from "@core";

// Basic get/set
await cache.set("key", { data: "value" }, 300);
const data = await cache.get("key");

// Remember pattern
const users = await cache.remember("users", 600, async () => {
  return await User.find();
});
```

## Quick Reference

### Cache Methods
| Method | Description |
|--------|-------------|
| `get(key)` | Get cached value |
| `set(key, value, ttl?)` | Store value |
| `delete(key)` | Remove value |
| `has(key)` | Check if key exists |
| `clear()` | Clear all cache |
| `remember(key, ttl, fn)` | Get or compute |
| `tags(tags)` | Tag-scoped operations |

### Drivers
| Driver | Description |
|--------|-------------|
| `lru` | In-memory LRU cache (default) |
| `redis` | Redis-backed cache |

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_DRIVER` | `lru` | Cache driver |
| `CACHE_PREFIX` | `"yoeast:"` | Key prefix |
| `CACHE_TTL` | `3600` | Default TTL (seconds) |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | `""` | Redis password |
| `REDIS_DB` | `0` | Redis database number |

## Guide

### Basic Operations

```ts
import { cache } from "@core";

// Store a value (TTL in seconds)
await cache.set("user:123", { name: "John", email: "john@example.com" }, 300);

// Get a value
const user = await cache.get<User>("user:123");
if (user) {
  console.log(user.name);
}

// Check existence
if (await cache.has("user:123")) {
  // Key exists
}

// Delete
await cache.delete("user:123");

// Clear all
await cache.clear();
```

### Remember Pattern

Get from cache or compute and store:

```ts
// If "users:all" exists, return it
// Otherwise, run the function, cache result, and return it
const users = await cache.remember("users:all", 600, async () => {
  return await User.find().lean();
});
```

This is the most common caching pattern.

### Cache Tags

Group related entries for bulk invalidation:

```ts
// Store with tags
await cache.setWithTags("user:123", userData, ["users", "profile:123"], 300);
await cache.setWithTags("user:456", otherUser, ["users"], 300);
await cache.setWithTags("posts:user:123", posts, ["posts", "profile:123"], 300);

// Get tagged cache instance
const userCache = cache.tags(["users"]);

// Operations on tagged entries
await userCache.flush();  // Delete all entries tagged with "users"

// Flush specific tag combination
await cache.tags(["profile:123"]).flush();  // Delete user:123 and posts:user:123
```

### In Controllers

```ts
export default class UsersController extends Controller {
  async handle() {
    // Access cache via this.cache
    const users = await this.cache.remember("users:list", 300, async () => {
      return await User.find().lean();
    });
    
    return this.json({ users });
  }
}
```

### Response Caching

Cache entire responses with ETags:

```ts
export default class DataController extends Controller {
  protected responseCacheTtl = 300; // 5 minutes

  async handle() {
    // Response is automatically cached
    return this.json({ data: "value" });
  }
}
```

See [Response Caching](../core-concepts/controllers/caching.md) for details.

### Cache Status

Check if values came from cache:

```ts
const { value, hit } = await cache.getWithStatus<User>("user:123");

if (hit) {
  console.log("From cache:", value);
} else {
  console.log("Cache miss");
}
```

### Configuration

```ts
// app/config/cache.ts
export default {
  default: "redis",
  prefix: "myapp:",
  ttl: 3600,
  stores: {
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
    },
  },
};
```

### LRU Cache Options

```ts
// app/config/cache.ts
export default {
  default: "lru",
  stores: {
    lru: {
      max: 1000,      // Max entries
      ttl: 3600,      // Default TTL (seconds)
    },
  },
};
```

### Redis Cache

```ts
// app/config/cache.ts
export default {
  default: "redis",
  stores: {
    redis: {
      host: "localhost",
      port: 6379,
      password: "secret",
      db: 0,
    },
  },
};
```

Or via environment variables:

```bash
CACHE_DRIVER=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
REDIS_DB=0
```

### Clearing Cache

Via code:

```ts
// Clear all
await cache.clear();

// Clear by tag
await cache.tags(["users"]).flush();

// Delete specific key
await cache.delete("user:123");
```

Via CLI:

```bash
bun cli cache:clear           # Clear all (with confirmation)
bun cli cache:clear --force   # Clear all (no confirmation)
bun cli cache:clear --tags=users,posts  # Clear by tags
```

## See Also

- [Response Caching](../core-concepts/controllers/caching.md) - HTTP response caching
- [Configuration](./config.md) - Environment variables
