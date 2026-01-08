/**
 * Tests for cache manager (remember pattern, tags, stats).
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { LruCacheStore } from "@core/cache/drivers/lru";

// We test the CacheManager's core logic by creating a minimal version
// that uses the LRU driver directly, avoiding config dependencies

class TestCacheManager {
  private store: LruCacheStore;
  private enabled = true;
  private stats = { hits: 0, misses: 0, writes: 0, deletes: 0 };

  constructor() {
    this.store = new LruCacheStore({ max: 100, ttl: 60000 });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getStats() {
    return { ...this.stats, driver: "lru", enabled: this.enabled };
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;
    const value = await this.store.get<T>(key);
    if (value !== null) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    return value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enabled) return;
    await this.store.set(key, value, ttl);
    this.stats.writes++;
  }

  async has(key: string): Promise<boolean> {
    if (!this.enabled) return false;
    return this.store.has(key);
  }

  async delete(key: string): Promise<boolean> {
    if (!this.enabled) return false;
    const result = await this.store.delete(key);
    if (result) this.stats.deletes++;
    return result;
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    if (!this.enabled) return new Map();
    return this.store.getMany<T>(keys);
  }

  async setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void> {
    if (!this.enabled) return;
    await this.store.setMany(entries, ttl);
    this.stats.writes += entries.size;
  }

  async deleteMany(keys: string[]): Promise<number> {
    if (!this.enabled) return 0;
    const count = await this.store.deleteMany(keys);
    this.stats.deletes += count;
    return count;
  }

  async keys(pattern?: string): Promise<string[]> {
    if (!this.enabled) return [];
    return this.store.keys(pattern);
  }

  async remember<T>(key: string, ttl: number, callback: () => T | Promise<T>): Promise<T> {
    const { value } = await this.rememberWithStatus(key, ttl, callback);
    return value;
  }

  async rememberWithStatus<T>(
    key: string,
    ttl: number,
    callback: () => T | Promise<T>
  ): Promise<{ value: T; hit: boolean }> {
    if (this.enabled) {
      const cached = await this.store.get<T>(key);
      if (cached !== null) {
        this.stats.hits++;
        return { value: cached, hit: true };
      }
      this.stats.misses++;
    }

    const value = await callback();

    if (this.enabled) {
      await this.store.set(key, value, ttl);
      this.stats.writes++;
    }

    return { value, hit: false };
  }

  async rememberForever<T>(key: string, callback: () => T | Promise<T>): Promise<T> {
    return this.remember(key, 0, callback);
  }

  async setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): Promise<void> {
    if (!this.enabled) return;
    await this.store.setWithTags(key, value, tags, ttl);
    this.stats.writes++;
  }

  async flushTags(tags: string[]): Promise<number> {
    if (!this.enabled) return 0;
    const count = await this.store.deleteByTags(tags);
    this.stats.deletes += count;
    return count;
  }

  tags(tags: string[]): TaggedTestCache {
    return new TaggedTestCache(this, tags);
  }
}

class TaggedTestCache {
  constructor(
    private manager: TestCacheManager,
    private cacheTags: string[]
  ) {}

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.manager.setWithTags(key, value, this.cacheTags, ttl);
  }

  async remember<T>(key: string, ttl: number, callback: () => T | Promise<T>): Promise<T> {
    const cached = await this.manager.get<T>(key);
    if (cached !== null) return cached;
    const value = await callback();
    await this.manager.setWithTags(key, value, this.cacheTags, ttl);
    return value;
  }

  async flush(): Promise<number> {
    return this.manager.flushTags(this.cacheTags);
  }
}

describe("cache manager", () => {
  let cache: TestCacheManager;

  beforeEach(() => {
    cache = new TestCacheManager();
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe("basic operations", () => {
    test("get returns null for missing key", async () => {
      const value = await cache.get("missing");
      expect(value).toBeNull();
    });

    test("set and get value", async () => {
      await cache.set("key", "value");
      const result = await cache.get("key");
      expect(result).toBe("value");
    });

    test("has returns true for existing key", async () => {
      await cache.set("key", "value");
      expect(await cache.has("key")).toBe(true);
    });

    test("has returns false for missing key", async () => {
      expect(await cache.has("missing")).toBe(false);
    });

    test("delete removes key", async () => {
      await cache.set("key", "value");
      const deleted = await cache.delete("key");
      expect(deleted).toBe(true);
      expect(await cache.has("key")).toBe(false);
    });

    test("clear removes all keys", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.clear();
      expect(await cache.has("a")).toBe(false);
      expect(await cache.has("b")).toBe(false);
    });
  });

  describe("bulk operations", () => {
    test("getMany returns map of values", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      const result = await cache.getMany<number>(["a", "b", "c"]);
      expect(result.get("a")).toBe(1);
      expect(result.get("b")).toBe(2);
      expect(result.has("c")).toBe(false);
    });

    test("setMany sets multiple values", async () => {
      const entries = new Map<string, number>([
        ["x", 10],
        ["y", 20],
      ]);
      await cache.setMany(entries);
      expect(await cache.get("x")).toBe(10);
      expect(await cache.get("y")).toBe(20);
    });

    test("deleteMany removes multiple keys", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.set("c", 3);
      const count = await cache.deleteMany(["a", "b"]);
      expect(count).toBe(2);
      expect(await cache.has("a")).toBe(false);
      expect(await cache.has("c")).toBe(true);
    });

    test("keys returns all keys", async () => {
      await cache.set("user:1", "a");
      await cache.set("user:2", "b");
      await cache.set("post:1", "c");
      const keys = await cache.keys();
      expect(keys.sort()).toEqual(["post:1", "user:1", "user:2"]);
    });

    test("keys filters by pattern", async () => {
      await cache.set("user:1", "a");
      await cache.set("user:2", "b");
      await cache.set("post:1", "c");
      const keys = await cache.keys("user:*");
      expect(keys.sort()).toEqual(["user:1", "user:2"]);
    });
  });

  describe("remember pattern", () => {
    test("remember caches callback result", async () => {
      let callCount = 0;
      const callback = () => {
        callCount++;
        return "computed";
      };

      const result1 = await cache.remember("key", 60, callback);
      expect(result1).toBe("computed");
      expect(callCount).toBe(1);

      const result2 = await cache.remember("key", 60, callback);
      expect(result2).toBe("computed");
      expect(callCount).toBe(1); // Callback not called again
    });

    test("remember works with async callback", async () => {
      const callback = async () => {
        await new Promise((r) => setTimeout(r, 10));
        return "async-result";
      };

      const result = await cache.remember("async-key", 60, callback);
      expect(result).toBe("async-result");
    });

    test("rememberWithStatus returns hit status", async () => {
      const callback = () => "value";

      const first = await cache.rememberWithStatus("key", 60, callback);
      expect(first.value).toBe("value");
      expect(first.hit).toBe(false);

      const second = await cache.rememberWithStatus("key", 60, callback);
      expect(second.value).toBe("value");
      expect(second.hit).toBe(true);
    });

    test("rememberForever caches without TTL", async () => {
      let callCount = 0;
      const result1 = await cache.rememberForever("forever", () => {
        callCount++;
        return "eternal";
      });
      expect(result1).toBe("eternal");

      const result2 = await cache.rememberForever("forever", () => {
        callCount++;
        return "never-called";
      });
      expect(result2).toBe("eternal");
      expect(callCount).toBe(1);
    });
  });

  describe("tags", () => {
    test("setWithTags stores value with tags", async () => {
      await cache.setWithTags("user:1", { name: "John" }, ["users"]);
      const value = await cache.get("user:1");
      expect(value).toEqual({ name: "John" });
    });

    test("flushTags removes all tagged entries", async () => {
      await cache.setWithTags("user:1", "a", ["users"]);
      await cache.setWithTags("user:2", "b", ["users"]);
      await cache.set("other", "c");

      const count = await cache.flushTags(["users"]);
      expect(count).toBe(2);
      expect(await cache.has("user:1")).toBe(false);
      expect(await cache.has("user:2")).toBe(false);
      expect(await cache.has("other")).toBe(true);
    });

    test("tags() returns tagged cache interface", async () => {
      const tagged = cache.tags(["products"]);

      await tagged.set("product:1", { name: "Widget" });
      expect(await cache.get("product:1")).toEqual({ name: "Widget" });

      await tagged.set("product:2", { name: "Gadget" });

      const count = await tagged.flush();
      expect(count).toBe(2);
      expect(await cache.has("product:1")).toBe(false);
    });

    test("tagged cache remember pattern", async () => {
      const tagged = cache.tags(["users"]);
      let callCount = 0;

      const result1 = await tagged.remember("user:profile", 60, () => {
        callCount++;
        return { name: "Test" };
      });
      expect(result1).toEqual({ name: "Test" });
      expect(callCount).toBe(1);

      const result2 = await tagged.remember("user:profile", 60, () => {
        callCount++;
        return { name: "Changed" };
      });
      expect(result2).toEqual({ name: "Test" });
      expect(callCount).toBe(1);
    });
  });

  describe("stats", () => {
    test("tracks hits and misses", async () => {
      await cache.get("missing1");
      await cache.get("missing2");
      await cache.set("key", "value");
      await cache.get("key");
      await cache.get("key");

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
    });

    test("tracks writes", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.setMany(new Map([["c", 3], ["d", 4]]));

      const stats = cache.getStats();
      expect(stats.writes).toBe(4);
    });

    test("tracks deletes", async () => {
      await cache.set("a", 1);
      await cache.set("b", 2);
      await cache.set("c", 3);
      await cache.delete("a");
      await cache.deleteMany(["b", "c"]);

      const stats = cache.getStats();
      expect(stats.deletes).toBe(3);
    });

    test("reports driver and enabled status", async () => {
      const stats = cache.getStats();
      expect(stats.driver).toBe("lru");
      expect(stats.enabled).toBe(true);
    });
  });

  describe("disabled cache", () => {
    test("get returns null when disabled", async () => {
      await cache.set("key", "value");
      cache.setEnabled(false);
      expect(await cache.get("key")).toBeNull();
    });

    test("set does nothing when disabled", async () => {
      cache.setEnabled(false);
      await cache.set("key", "value");
      cache.setEnabled(true);
      expect(await cache.get("key")).toBeNull();
    });

    test("has returns false when disabled", async () => {
      await cache.set("key", "value");
      cache.setEnabled(false);
      expect(await cache.has("key")).toBe(false);
    });

    test("remember bypasses cache when disabled", async () => {
      let callCount = 0;
      cache.setEnabled(false);

      await cache.remember("key", 60, () => {
        callCount++;
        return "value";
      });
      await cache.remember("key", 60, () => {
        callCount++;
        return "value";
      });

      expect(callCount).toBe(2); // Called each time, no caching
    });

    test("keys returns empty when disabled", async () => {
      await cache.set("key", "value");
      cache.setEnabled(false);
      expect(await cache.keys()).toEqual([]);
    });

    test("flushTags returns 0 when disabled", async () => {
      await cache.setWithTags("key", "value", ["tag"]);
      cache.setEnabled(false);
      expect(await cache.flushTags(["tag"])).toBe(0);
    });
  });
});
