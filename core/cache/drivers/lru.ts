/**
 * LRU Cache Driver - Default in-memory cache with LRU eviction.
 */

import { LRUCache } from "lru-cache";
import type { CacheStore, CacheEntry, LruCacheOptions } from "../types";

export class LruCacheStore implements CacheStore {
  private cache: LRUCache<string, CacheEntry>;
  private tagIndex: Map<string, Set<string>> = new Map();
  private defaultTtl: number;

  constructor(options: LruCacheOptions = {}) {
    const { max = 10000, ttl = 3600 } = options;
    this.defaultTtl = ttl;

    this.cache = new LRUCache<string, CacheEntry>({
      max,
      ttl: ttl * 1000, // LRU cache uses milliseconds
      ttlAutopurge: true,
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired (shouldn't happen with LRU's ttl, but just in case)
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
    };

    this.cache.set(key, entry, { ttl: ttl * 1000 });
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    
    // Remove from tag index
    for (const [, keys] of this.tagIndex) {
      keys.delete(key);
    }
    
    return existed;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  async getMany<T = unknown>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    return result;
  }

  async setMany<T = unknown>(entries: Map<string, T>, ttlSeconds?: number): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value, ttlSeconds);
    }
  }

  async deleteMany(keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // Convert glob pattern to regex
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    
    return allKeys.filter((key) => regex.test(key));
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
    const ttl = ttlSeconds ?? this.defaultTtl;
    const entry: CacheEntry<T> = {
      value,
      tags,
      expiresAt: Date.now() + ttl * 1000,
    };

    this.cache.set(key, entry, { ttl: ttl * 1000 });

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  /**
   * Delete all entries with any of the given tags.
   */
  async deleteByTags(tags: string[]): Promise<number> {
    const keysToDelete = new Set<string>();

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        for (const key of keys) {
          keysToDelete.add(key);
        }
        this.tagIndex.delete(tag);
      }
    }

    let count = 0;
    for (const key of keysToDelete) {
      if (this.cache.delete(key)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics.
   */
  getStats(): { size: number; max: number } {
    return {
      size: this.cache.size,
      max: this.cache.max,
    };
  }
}
