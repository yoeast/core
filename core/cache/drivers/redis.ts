/**
 * Redis Cache Driver - Distributed cache using Redis.
 */

import Redis from "ioredis";
import type { CacheStore, CacheEntry, RedisCacheOptions } from "../types";

export class RedisCacheStore implements CacheStore {
  private client: Redis;
  private prefix: string;
  private defaultTtl: number;
  private tagPrefix: string;

  constructor(options: RedisCacheOptions = {}) {
    const { url, host, port, password, db, prefix = "cache:", ttl = 3600 } = options;

    this.prefix = prefix;
    this.defaultTtl = ttl;
    this.tagPrefix = `${prefix}tags:`;

    // Connect via URL or individual options
    if (url) {
      this.client = new Redis(url);
    } else {
      this.client = new Redis({
        host: host ?? "localhost",
        port: port ?? 6379,
        password,
        db: db ?? 0,
      });
    }
  }

  private key(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const data = await this.client.get(this.key(key));
    if (!data) return null;

    try {
      const entry = JSON.parse(data) as CacheEntry<T>;
      return entry.value;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
    };

    await this.client.setex(this.key(key), ttl, JSON.stringify(entry));
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.client.exists(this.key(key));
    return exists === 1;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(this.key(key));
    return result > 0;
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async getMany<T = unknown>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    if (keys.length === 0) return result;

    const prefixedKeys = keys.map((k) => this.key(k));
    const values = await this.client.mget(...prefixedKeys);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const data = values[i];
      if (data) {
        try {
          const entry = JSON.parse(data) as CacheEntry<T>;
          result.set(key, entry.value);
        } catch {
          // Skip invalid entries
        }
      }
    }

    return result;
  }

  async setMany<T = unknown>(entries: Map<string, T>, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;
    const pipeline = this.client.pipeline();

    for (const [key, value] of entries) {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + ttl * 1000,
      };
      pipeline.setex(this.key(key), ttl, JSON.stringify(entry));
    }

    await pipeline.exec();
  }

  async deleteMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const prefixedKeys = keys.map((k) => this.key(k));
    return await this.client.del(...prefixedKeys);
  }

  async keys(pattern?: string): Promise<string[]> {
    const searchPattern = pattern
      ? `${this.prefix}${pattern}`
      : `${this.prefix}*`;
    
    const keys = await this.client.keys(searchPattern);
    
    // Remove prefix from keys
    return keys.map((k) => k.slice(this.prefix.length));
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

    const pipeline = this.client.pipeline();
    
    // Set the value
    pipeline.setex(this.key(key), ttl, JSON.stringify(entry));

    // Add key to each tag's set
    for (const tag of tags) {
      pipeline.sadd(`${this.tagPrefix}${tag}`, key);
    }

    await pipeline.exec();
  }

  /**
   * Delete all entries with any of the given tags.
   */
  async deleteByTags(tags: string[]): Promise<number> {
    const keysToDelete = new Set<string>();

    // Collect all keys from all tags
    for (const tag of tags) {
      const keys = await this.client.smembers(`${this.tagPrefix}${tag}`);
      for (const key of keys) {
        keysToDelete.add(key);
      }
    }

    if (keysToDelete.size === 0) return 0;

    const pipeline = this.client.pipeline();

    // Delete all the cache entries
    const prefixedKeys = Array.from(keysToDelete).map((k) => this.key(k));
    pipeline.del(...prefixedKeys);

    // Delete the tag sets
    for (const tag of tags) {
      pipeline.del(`${this.tagPrefix}${tag}`);
    }

    await pipeline.exec();
    return keysToDelete.size;
  }

  /**
   * Close the Redis connection.
   */
  async close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Get cache statistics.
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    const info = await this.client.info("memory");
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const keys = await this.client.dbsize();

    return {
      keys,
      memory: memoryMatch?.[1] ?? "unknown",
    };
  }
}
