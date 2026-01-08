/**
 * Tests for Redis cache driver.
 * Requires Redis to be running on localhost:6379
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { RedisCacheStore } from "@core/cache/drivers/redis";

// Use unique prefix for each test run to avoid conflicts
const testPrefix = `test:${Date.now()}:`;

describe("Redis cache store", () => {
  let cache: RedisCacheStore;

  beforeAll(() => {
    cache = new RedisCacheStore({
      host: "localhost",
      port: 6379,
      prefix: testPrefix,
      ttl: 60,
    });
  });

  afterAll(async () => {
    await cache.clear();
    await cache.close();
  });

  beforeEach(async () => {
    await cache.clear();
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
      await cache.set("exists", "yes");
      expect(await cache.has("exists")).toBe(true);
      expect(await cache.has("missing")).toBe(false);
    });

    test("deletes a key", async () => {
      await cache.set("toDelete", "value");
      expect(await cache.has("toDelete")).toBe(true);
      
      const deleted = await cache.delete("toDelete");
      expect(deleted).toBe(true);
      expect(await cache.has("toDelete")).toBe(false);
    });

    test("delete returns false for non-existent key", async () => {
      const deleted = await cache.delete("nonexistent");
      expect(deleted).toBe(false);
    });

    test("clears all keys with prefix", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.set("c", 3);
      
      await cache.clear();
      
      expect(await cache.has("a")).toBe(false);
      expect(await cache.has("b")).toBe(false);
      expect(await cache.has("c")).toBe(false);
    });

    test("stores complex objects", async () => {
      const obj = { name: "test", nested: { value: 123 }, arr: [1, 2, 3] };
      await cache.set("object", obj);
      const result = await cache.get("object");
      expect(result).toEqual(obj);
    });

    test("stores arrays", async () => {
      const arr = [1, "two", { three: 3 }];
      await cache.set("array", arr);
      const result = await cache.get("array");
      expect(result).toEqual(arr);
    });

    test("handles null and undefined values", async () => {
      await cache.set("nullVal", null);
      const result = await cache.get("nullVal");
      expect(result).toBeNull();
    });
  });

  describe("bulk operations", () => {
    test("gets multiple keys", async () => {
      await cache.set("multi:a", 1);
      await cache.set("multi:b", 2);
      await cache.set("multi:c", 3);

      const result = await cache.getMany<number>(["multi:a", "multi:b", "multi:c", "multi:missing"]);
      
      expect(result.get("multi:a")).toBe(1);
      expect(result.get("multi:b")).toBe(2);
      expect(result.get("multi:c")).toBe(3);
      expect(result.has("multi:missing")).toBe(false);
    });

    test("getMany returns empty map for empty keys array", async () => {
      const result = await cache.getMany([]);
      expect(result.size).toBe(0);
    });

    test("sets multiple keys", async () => {
      const entries = new Map<string, number>([
        ["batch:x", 10],
        ["batch:y", 20],
        ["batch:z", 30],
      ]);

      await cache.setMany(entries);

      expect(await cache.get("batch:x")).toBe(10);
      expect(await cache.get("batch:y")).toBe(20);
      expect(await cache.get("batch:z")).toBe(30);
    });

    test("deletes multiple keys", async () => {
      await cache.set("del:a", 1);
      await cache.set("del:b", 2);
      await cache.set("del:c", 3);

      const count = await cache.deleteMany(["del:a", "del:b"]);
      
      expect(count).toBe(2);
      expect(await cache.has("del:a")).toBe(false);
      expect(await cache.has("del:b")).toBe(false);
      expect(await cache.has("del:c")).toBe(true);
    });

    test("deleteMany returns 0 for empty array", async () => {
      const count = await cache.deleteMany([]);
      expect(count).toBe(0);
    });
  });

  describe("key patterns", () => {
    test("lists all keys", async () => {
      await cache.set("list:one", 1);
      await cache.set("list:two", 2);
      await cache.set("other:three", 3);

      const allKeys = await cache.keys();
      expect(allKeys.sort()).toEqual(["list:one", "list:two", "other:three"].sort());
    });

    test("filters keys by pattern", async () => {
      await cache.set("user:1", "a");
      await cache.set("user:2", "b");
      await cache.set("post:1", "c");

      const userKeys = await cache.keys("user:*");
      expect(userKeys.sort()).toEqual(["user:1", "user:2"]);
    });
  });

  describe("tags", () => {
    test("sets value with tags", async () => {
      await cache.setWithTags("tagged:item", { name: "test" }, ["tag1", "tag2"]);
      
      const value = await cache.get("tagged:item");
      expect(value).toEqual({ name: "test" });
    });

    test("deletes by single tag", async () => {
      await cache.setWithTags("t1:a", "a", ["products"]);
      await cache.setWithTags("t1:b", "b", ["products"]);
      await cache.set("t1:c", "c"); // No tags

      const count = await cache.deleteByTags(["products"]);
      
      expect(count).toBe(2);
      expect(await cache.has("t1:a")).toBe(false);
      expect(await cache.has("t1:b")).toBe(false);
      expect(await cache.has("t1:c")).toBe(true);
    });

    test("deletes by multiple tags", async () => {
      await cache.setWithTags("t2:a", "a", ["users"]);
      await cache.setWithTags("t2:b", "b", ["posts"]);
      await cache.setWithTags("t2:c", "c", ["users", "posts"]);

      const count = await cache.deleteByTags(["users", "posts"]);
      
      expect(count).toBe(3);
      expect(await cache.has("t2:a")).toBe(false);
      expect(await cache.has("t2:b")).toBe(false);
      expect(await cache.has("t2:c")).toBe(false);
    });

    test("deleteByTags returns 0 for non-existent tags", async () => {
      const count = await cache.deleteByTags(["nonexistent"]);
      expect(count).toBe(0);
    });
  });

  describe("TTL", () => {
    test("expires entries after TTL", async () => {
      // Create a cache with very short TTL
      const shortTtlCache = new RedisCacheStore({
        host: "localhost",
        port: 6379,
        prefix: `${testPrefix}ttl:`,
        ttl: 1, // 1 second default TTL
      });

      await shortTtlCache.set("expiring", "value");
      expect(await shortTtlCache.get("expiring")).toBe("value");

      // Wait for expiration
      await new Promise((r) => setTimeout(r, 1100));
      
      expect(await shortTtlCache.get("expiring")).toBeNull();
      
      await shortTtlCache.close();
    });

    test("custom TTL per key", async () => {
      const shortTtlCache = new RedisCacheStore({
        host: "localhost",
        port: 6379,
        prefix: `${testPrefix}ttl2:`,
        ttl: 60, // Default 60 seconds
      });

      // Set with 1 second TTL
      await shortTtlCache.set("short", "value", 1);
      expect(await shortTtlCache.get("short")).toBe("value");

      await new Promise((r) => setTimeout(r, 1100));
      
      expect(await shortTtlCache.get("short")).toBeNull();
      
      await shortTtlCache.close();
    });
  });

  describe("stats", () => {
    test("returns cache statistics", async () => {
      await cache.set("stat:1", "a");
      await cache.set("stat:2", "b");

      const stats = await cache.getStats();
      
      expect(stats).toHaveProperty("keys");
      expect(stats).toHaveProperty("memory");
      expect(typeof stats.keys).toBe("number");
      expect(typeof stats.memory).toBe("string");
    });
  });

  describe("connection options", () => {
    test("connects via URL", async () => {
      const urlCache = new RedisCacheStore({
        url: "redis://localhost:6379",
        prefix: `${testPrefix}url:`,
      });

      await urlCache.set("urlTest", "works");
      expect(await urlCache.get("urlTest")).toBe("works");

      await urlCache.clear();
      await urlCache.close();
    });

    test("uses default options when not specified", async () => {
      const defaultCache = new RedisCacheStore({
        prefix: `${testPrefix}defaults:`,
      });

      await defaultCache.set("defaultTest", "value");
      expect(await defaultCache.get("defaultTest")).toBe("value");

      await defaultCache.clear();
      await defaultCache.close();
    });
  });
});
