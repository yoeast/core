/**
 * Cache system - Multi-driver caching with tags support.
 */

import type { CacheStore, CacheOptions, LruCacheOptions, RedisCacheOptions } from "./types";
import { LruCacheStore } from "./drivers/lru";
import { RedisCacheStore } from "./drivers/redis";
import { config } from "../config";

// Export types
export * from "./types";
export { LruCacheStore } from "./drivers/lru";
export { RedisCacheStore } from "./drivers/redis";

/** Cache statistics */
export interface CacheStats {
  hits: number;
  misses: number;
  writes: number;
  deletes: number;
  driver: string;
  enabled: boolean;
}

/**
 * Cache manager - provides a unified interface for caching.
 */
class CacheManager {
  private store!: CacheStore & { 
    setWithTags?<T>(key: string, value: T, tags: string[], ttl?: number): Promise<void>;
    deleteByTags?(tags: string[]): Promise<number>;
    getStats?(): { size: number; max: number } | Promise<{ keys: number; memory: string }>;
  };
  private prefix: string = "yoeast:";
  private driver: string = "lru";
  private enabled: boolean = true;
  private initialized = false;
  
  // Stats tracking
  private stats = {
    hits: 0,
    misses: 0,
    writes: 0,
    deletes: 0,
  };

  constructor() {
    // Will be initialized lazily
    this.store = null!;
    this.prefix = "";
  }

  /**
   * Initialize the cache with configured driver.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.driver = config<string>("cache.default", "lru");
    this.enabled = config<boolean>("cache.enabled", true);
    this.prefix = config<string>("cache.prefix", "yoeast:");

    switch (this.driver) {
      case "redis": {
        const redisConfig = config<RedisCacheOptions>("cache.stores.redis", {});
        this.store = new RedisCacheStore({
          ...redisConfig,
          prefix: this.prefix,
        });
        break;
      }
      case "lru":
      default: {
        const lruConfig = config<LruCacheOptions>("cache.stores.lru", {});
        this.store = new LruCacheStore(lruConfig);
        break;
      }
    }

    this.initialized = true;
  }

  /**
   * Ensure cache is initialized before use.
   */
  private async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Check if cache is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats & { size?: number; max?: number } {
    const baseStats: CacheStats = {
      ...this.stats,
      driver: this.driver,
      enabled: this.enabled,
    };
    
    // Add store-specific stats if available
    if (this.store?.getStats) {
      const storeStats = this.store.getStats();
      return { ...baseStats, ...storeStats };
    }
    
    return baseStats;
  }

  /**
   * Get a value from the cache.
   * Returns { value, hit } for tracking cache status.
   */
  async getWithStatus<T = unknown>(key: string): Promise<{ value: T | null; hit: boolean }> {
    await this.ensureInit();
    
    if (!this.enabled) {
      return { value: null, hit: false };
    }
    
    const value = await this.store.get<T>(key);
    if (value !== null) {
      this.stats.hits++;
      return { value, hit: true };
    }
    
    this.stats.misses++;
    return { value: null, hit: false };
  }

  /**
   * Get a value from the cache.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const { value } = await this.getWithStatus<T>(key);
    return value;
  }

  /**
   * Set a value in the cache.
   */
  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.ensureInit();
    
    if (!this.enabled) return;
    
    await this.store.set(key, value, ttlSeconds);
    this.stats.writes++;
  }

  /**
   * Check if a key exists.
   */
  async has(key: string): Promise<boolean> {
    await this.ensureInit();
    if (!this.enabled) return false;
    return this.store.has(key);
  }

  /**
   * Delete a key.
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureInit();
    if (!this.enabled) return false;
    
    const result = await this.store.delete(key);
    if (result) this.stats.deletes++;
    return result;
  }

  /**
   * Clear all cache entries.
   */
  async clear(): Promise<void> {
    await this.ensureInit();
    await this.store.clear();
  }

  /**
   * Get multiple values at once.
   */
  async getMany<T = unknown>(keys: string[]): Promise<Map<string, T>> {
    await this.ensureInit();
    if (!this.enabled) return new Map();
    return this.store.getMany<T>(keys);
  }

  /**
   * Set multiple values at once.
   */
  async setMany<T = unknown>(entries: Map<string, T>, ttlSeconds?: number): Promise<void> {
    await this.ensureInit();
    if (!this.enabled) return;
    
    await this.store.setMany(entries, ttlSeconds);
    this.stats.writes += entries.size;
  }

  /**
   * Delete multiple keys at once.
   */
  async deleteMany(keys: string[]): Promise<number> {
    await this.ensureInit();
    if (!this.enabled) return 0;
    
    const count = await this.store.deleteMany(keys);
    this.stats.deletes += count;
    return count;
  }

  /**
   * Get all keys matching a pattern.
   */
  async keys(pattern?: string): Promise<string[]> {
    await this.ensureInit();
    if (!this.enabled) return [];
    return this.store.keys(pattern);
  }

  /**
   * Get or compute a value (remember pattern).
   * If the key exists, return it. Otherwise, compute and cache it.
   * Returns { value, hit } for tracking cache status.
   */
  async rememberWithStatus<T>(
    key: string,
    ttlSeconds: number,
    callback: () => T | Promise<T>
  ): Promise<{ value: T; hit: boolean }> {
    await this.ensureInit();

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
      await this.store.set(key, value, ttlSeconds);
      this.stats.writes++;
    }
    
    return { value, hit: false };
  }

  /**
   * Get or compute a value (remember pattern).
   * If the key exists, return it. Otherwise, compute and cache it.
   */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    callback: () => T | Promise<T>
  ): Promise<T> {
    const { value } = await this.rememberWithStatus(key, ttlSeconds, callback);
    return value;
  }

  /**
   * Get or compute a value forever (no expiration).
   */
  async rememberForever<T>(key: string, callback: () => T | Promise<T>): Promise<T> {
    return this.remember(key, 0, callback);
  }

  /**
   * Set a value with tags for bulk invalidation.
   */
  async setWithTags<T = unknown>(
    key: string,
    value: T,
    tags: string[],
    ttlSeconds?: number
  ): Promise<void> {
    await this.ensureInit();
    if (!this.enabled) return;
    
    if (this.store.setWithTags) {
      await this.store.setWithTags(key, value, tags, ttlSeconds);
    } else {
      // Fallback: just set without tags
      await this.store.set(key, value, ttlSeconds);
    }
    this.stats.writes++;
  }

  /**
   * Create a tagged cache instance for bulk operations.
   */
  tags(tags: string[]): TaggedCache {
    return new TaggedCache(this, tags);
  }

  /**
   * Flush (delete) all entries with given tags.
   */
  async flushTags(tags: string[]): Promise<number> {
    await this.ensureInit();
    if (!this.enabled) return 0;
    
    if (this.store.deleteByTags) {
      const count = await this.store.deleteByTags(tags);
      this.stats.deletes += count;
      return count;
    }
    
    // Fallback: not supported without tag-aware store
    return 0;
  }

  /**
   * Close the cache connection (for cleanup).
   */
  async close(): Promise<void> {
    if (this.store?.close) {
      await this.store.close();
    }
    this.initialized = false;
  }

  /**
   * Get the underlying store (for advanced usage).
   */
  getStore(): CacheStore {
    return this.store;
  }
  
  /**
   * Get cache info for display purposes.
   */
  getInfo(): { driver: string; enabled: boolean; prefix: string } {
    return {
      driver: this.driver,
      enabled: this.enabled,
      prefix: this.prefix,
    };
  }
}

/**
 * Tagged cache - wraps cache operations with automatic tagging.
 */
class TaggedCache {
  constructor(
    private manager: CacheManager,
    private cacheTags: string[]
  ) {}

  /**
   * Set a value with tags.
   */
  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.manager.setWithTags(key, value, this.cacheTags, ttlSeconds);
  }

  /**
   * Get or compute with tags.
   */
  async remember<T>(
    key: string,
    ttlSeconds: number,
    callback: () => T | Promise<T>
  ): Promise<T> {
    const cached = await this.manager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await callback();
    await this.manager.setWithTags(key, value, this.cacheTags, ttlSeconds);
    return value;
  }

  /**
   * Flush all entries with these tags.
   */
  async flush(): Promise<number> {
    return this.manager.flushTags(this.cacheTags);
  }
}

// Singleton instance
export const cache = new CacheManager();

/**
 * Initialize the cache system.
 */
export async function initCache(): Promise<void> {
  await cache.init();
}

/**
 * Shutdown the cache system.
 */
export async function shutdownCache(): Promise<void> {
  await cache.close();
}
