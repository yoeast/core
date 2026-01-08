# Response Caching

> Automatic HTTP caching with ETags.

## TL;DR

```ts
import { Controller } from "@yoeast/core";

export default class DataController extends Controller {
  protected responseCacheTtl = 300; // Cache for 5 minutes

  async handle() {
    const data = await fetchExpensiveData();
    return this.json(data);
  }
}
```

## Quick Reference

| Property/Option | Type | Default | Description |
|-----------------|------|---------|-------------|
| `responseCacheTtl` | `number` | `undefined` | Default TTL in seconds |
| `ttl` | `number` | controller default | Per-response TTL |
| `key` | `string` | URL path + query | Custom cache key |
| `noCache` | `boolean` | `false` | Disable caching |

### Response Headers
| Header | Values | Description |
|--------|--------|-------------|
| `X-Cache` | `HIT`, `MISS`, `SKIP` | Cache status |
| `ETag` | `"hash"` | Content hash |
| `Cache-Control` | `max-age=N` | Browser cache duration |

## Guide

### Enable Caching

Set a default TTL for all responses in a controller:

```ts
export default class ProductsController extends Controller {
  protected responseCacheTtl = 600; // 10 minutes

  async handle() {
    const products = await Product.find();
    return this.json({ products });
  }
}
```

### Per-Response TTL

Override the TTL for specific responses:

```ts
async handle() {
  const popular = await getPopularItems();
  return this.json(popular, { ttl: 60 }); // 1 minute
  
  const static = await getStaticContent();
  return this.json(static, { ttl: 3600 }); // 1 hour
}
```

### Disable Caching

Skip caching for specific responses:

```ts
async handle() {
  const user = await getCurrentUser();
  return this.json(user, { noCache: true });
}
```

Or don't set `responseCacheTtl` (default is no caching).

### Custom Cache Keys

By default, cache key is the URL path + query string:

```ts
// GET /products?page=1 → cache key: "response:/products?page=1"
// GET /products?page=2 → cache key: "response:/products?page=2"
```

Use custom keys for more control:

```ts
async handle() {
  const userId = this.getCookie("user_id");
  const data = await getUserData(userId);
  
  return this.json(data, { key: `user:${userId}:data` });
}
```

### How It Works

1. **First Request:**
   - Handler runs, generates response
   - ETag computed from response body (SHA-256)
   - Response cached with ETag
   - Headers: `X-Cache: MISS`, `ETag: "..."`, `Cache-Control: max-age=N`

2. **Subsequent Requests (cache valid):**
   - Cache hit found
   - If `If-None-Match` header matches ETag → 304 Not Modified
   - Otherwise, return cached response
   - Headers: `X-Cache: HIT`

3. **Cache Expired:**
   - Handler runs again
   - New response cached
   - Headers: `X-Cache: MISS`

### Conditional Requests

Browsers automatically send `If-None-Match` with the ETag for cached responses:

```http
GET /api/products HTTP/1.1
If-None-Match: "abc123..."
```

If content hasn't changed:

```http
HTTP/1.1 304 Not Modified
ETag: "abc123..."
X-Cache: HIT
```

This saves bandwidth since no body is sent.

### Works With All Response Types

```ts
async handle() {
  // JSON
  return this.json({ data }, { ttl: 300 });
  
  // Text
  return this.text("Hello", { ttl: 300 });
  
  // HTML templates
  return this.render("page", data, { ttl: 300 });
}
```

### Using the Cache Service

Access the cache directly for custom caching:

```ts
export default class UsersController extends Controller {
  async handle() {
    // Remember pattern: get from cache or compute
    const users = await this.cache.remember("users:all", 600, async () => {
      return await User.find().lean();
    });
    
    return this.json({ users });
  }
}
```

### Cache Tags

Tag cached entries for bulk invalidation:

```ts
async handle() {
  const users = await this.cache.remember("users:all", 600, async () => {
    return await User.find().lean();
  });
  
  // Tag this cache entry
  await this.cache.setWithTags("users:all", users, ["users"], 600);
  
  return this.json({ users });
}

// In another controller, invalidate all user caches
async handle() {
  await this.cache.tags(["users"]).flush();
  return this.json({ cleared: true });
}
```

## See Also

- [Cache System](../../guides/cache.md) - Full cache documentation
- [Responses](./responses.md) - Response methods
- [Controllers](../controllers.md) - Controller overview
