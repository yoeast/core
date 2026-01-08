import { describe, test, expect, beforeEach } from "bun:test";
import { LruCacheStore } from "@core/cache/drivers/lru";

describe("LRU cache store", () => {
  let cache: LruCacheStore;

  beforeEach(() => {
    cache = new LruCacheStore({ max: 100, ttl: 3600 });
  });

  describe("basic operations", () => {
    test("sets and gets a value", async () => {
      await cache.set("key", "value");
      const result = await cache.get("key");
      expect(result).toBe("value");
    });

    test("returns null for non-existent key", async () => {
      const result = await cache.get("nonexistent");
      expect(result).toBeNull();
    });

    test("checks if key exists", async () => {
      await cache.set("key", "value");
      expect(await cache.has("key")).toBe(true);
      expect(await cache.has("nonexistent")).toBe(false);
    });

    test("deletes a key", async () => {
      await cache.set("key", "value");
      const deleted = await cache.delete("key");
      expect(deleted).toBe(true);
      expect(await cache.get("key")).toBeNull();
    });

    test("delete returns false for non-existent key", async () => {
      const deleted = await cache.delete("nonexistent");
      expect(deleted).toBe(false);
    });

    test("clears all keys", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.clear();
      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBeNull();
    });

    test("stores complex objects", async () => {
      const obj = { name: "John", age: 30, nested: { foo: "bar" } };
      await cache.set("user", obj);
      const result = await cache.get<typeof obj>("user");
      expect(result).toEqual(obj);
    });

    test("stores arrays", async () => {
      const arr = [1, 2, 3, "four", { five: 5 }];
      await cache.set("array", arr);
      const result = await cache.get("array");
      expect(result).toEqual(arr);
    });
  });

  describe("bulk operations", () => {
    test("gets multiple keys", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.set("c", 3);

      const result = await cache.getMany<number>(["a", "b", "missing"]);
      expect(result.get("a")).toBe(1);
      expect(result.get("b")).toBe(2);
      expect(result.has("missing")).toBe(false);
    });

    test("sets multiple keys", async () => {
      const entries = new Map<string, number>([
        ["x", 10],
        ["y", 20],
        ["z", 30],
      ]);
      await cache.setMany(entries);

      expect(await cache.get("x")).toBe(10);
      expect(await cache.get("y")).toBe(20);
      expect(await cache.get("z")).toBe(30);
    });

    test("deletes multiple keys", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.set("c", 3);

      const count = await cache.deleteMany(["a", "c", "nonexistent"]);
      expect(count).toBe(2);
      expect(await cache.get("a")).toBeNull();
      expect(await cache.get("b")).toBe(2);
      expect(await cache.get("c")).toBeNull();
    });
  });

  describe("key patterns", () => {
    test("lists all keys", async () => {
      await cache.set("user:1", "a");
      await cache.set("user:2", "b");
      await cache.set("post:1", "c");

      const keys = await cache.keys();
      expect(keys).toContain("user:1");
      expect(keys).toContain("user:2");
      expect(keys).toContain("post:1");
    });

    test("filters keys by pattern", async () => {
      await cache.set("user:1", "a");
      await cache.set("user:2", "b");
      await cache.set("post:1", "c");

      const keys = await cache.keys("user:*");
      expect(keys.sort()).toEqual(["user:1", "user:2"]);
    });

    test("filters with wildcard pattern", async () => {
      await cache.set("users:list", "a");
      await cache.set("users:123", "b");
      await cache.set("posts:list", "c");

      const keys = await cache.keys("*:list");
      expect(keys).toContain("users:list");
      expect(keys).toContain("posts:list");
      expect(keys).not.toContain("users:123");
    });
  });

  describe("tags", () => {
    test("sets value with tags", async () => {
      await cache.setWithTags("user:1", { name: "John" }, ["users", "profile:1"]);
      const result = await cache.get("user:1");
      expect(result).toEqual({ name: "John" });
    });

    test("deletes by single tag", async () => {
      await cache.setWithTags("user:1", "a", ["users"]);
      await cache.setWithTags("user:2", "b", ["users"]);
      await cache.setWithTags("post:1", "c", ["posts"]);

      const count = await cache.deleteByTags(["users"]);
      expect(count).toBe(2);
      expect(await cache.get("user:1")).toBeNull();
      expect(await cache.get("user:2")).toBeNull();
      expect(await cache.get("post:1")).toBe("c");
    });

    test("deletes by multiple tags", async () => {
      await cache.setWithTags("user:1", "a", ["users", "active"]);
      await cache.setWithTags("user:2", "b", ["users"]);
      await cache.setWithTags("post:1", "c", ["posts", "active"]);

      const count = await cache.deleteByTags(["active"]);
      expect(count).toBe(2);
      expect(await cache.get("user:1")).toBeNull();
      expect(await cache.get("user:2")).toBe("b");
      expect(await cache.get("post:1")).toBeNull();
    });

    test("handles overlapping tags", async () => {
      await cache.setWithTags("item:1", "a", ["tag1", "tag2"]);
      
      // Deleting by one tag should work
      const count = await cache.deleteByTags(["tag1", "tag2"]);
      expect(count).toBe(1); // Only 1 item, not 2
      expect(await cache.get("item:1")).toBeNull();
    });
  });

  describe("stats", () => {
    test("returns cache statistics", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.max).toBe(100);
    });
  });

  describe("eviction", () => {
    test("evicts oldest entries when max reached", async () => {
      const smallCache = new LruCacheStore({ max: 3, ttl: 3600 });
      
      await smallCache.set("a", 1);
      await smallCache.set("b", 2);
      await smallCache.set("c", 3);
      await smallCache.set("d", 4); // Should evict 'a'

      expect(await smallCache.get("a")).toBeNull();
      expect(await smallCache.get("b")).toBe(2);
      expect(await smallCache.get("c")).toBe(3);
      expect(await smallCache.get("d")).toBe(4);
    });

    test("refreshes LRU order on get", async () => {
      const smallCache = new LruCacheStore({ max: 3, ttl: 3600 });
      
      await smallCache.set("a", 1);
      await smallCache.set("b", 2);
      await smallCache.set("c", 3);
      
      // Access 'a' to make it recently used
      await smallCache.get("a");
      
      // Adding 'd' should now evict 'b' (oldest)
      await smallCache.set("d", 4);

      expect(await smallCache.get("a")).toBe(1); // Still exists
      expect(await smallCache.get("b")).toBeNull(); // Evicted
    });
  });

  describe("TTL", () => {
    test("expires entries after TTL", async () => {
      const shortTtlCache = new LruCacheStore({ max: 100, ttl: 1 });
      
      await shortTtlCache.set("key", "value", 0.05); // 50ms TTL
      expect(await shortTtlCache.get("key")).toBe("value");
      
      await Bun.sleep(100);
      expect(await shortTtlCache.get("key")).toBeNull();
    });

    test("custom TTL per key", async () => {
      await cache.set("short", "value", 0.05); // 50ms
      await cache.set("long", "value", 10); // 10 seconds
      
      await Bun.sleep(100);
      
      expect(await cache.get("short")).toBeNull();
      expect(await cache.get("long")).toBe("value");
    });
  });
});
