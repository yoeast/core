/**
 * Cache system types and interfaces.
 */

/**
 * Cache store interface - all drivers must implement this.
 */
export interface CacheStore {
  /**
   * Get a value from the cache.
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Set a value in the cache.
   * @param ttlSeconds - Time to live in seconds (optional, uses default if not provided)
   */
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Check if a key exists in the cache.
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a key from the cache.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all entries from the cache.
   */
  clear(): Promise<void>;

  /**
   * Get multiple values at once.
   */
  getMany<T = unknown>(keys: string[]): Promise<Map<string, T>>;

  /**
   * Set multiple values at once.
   */
  setMany<T = unknown>(entries: Map<string, T>, ttlSeconds?: number): Promise<void>;

  /**
   * Delete multiple keys at once.
   */
  deleteMany(keys: string[]): Promise<number>;

  /**
   * Get all keys matching a pattern (for tag support).
   * Pattern uses * as wildcard.
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Close/disconnect the store (for cleanup).
   */
  close?(): Promise<void>;
}

/**
 * Cache entry with metadata.
 */
export interface CacheEntry<T = unknown> {
  value: T;
  tags?: string[];
  expiresAt?: number;
}

/**
 * Options for cache operations.
 */
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

/**
 * Controller cache configuration.
 */
export interface ControllerCacheConfig {
  /**
   * Time to live in seconds.
   */
  ttl: number;

  /**
   * HTTP methods to cache. Default: ["GET"]
   */
  methods?: string[];

  /**
   * Tags for bulk invalidation.
   */
  tags?: string[];

  /**
   * Custom cache key generator.
   */
  key?: (req: Request) => string;
}

/**
 * LRU cache driver options.
 */
export interface LruCacheOptions {
  /**
   * Maximum number of items in cache.
   */
  max?: number;

  /**
   * Default TTL in seconds.
   */
  ttl?: number;
}

/**
 * Redis cache driver options.
 */
export interface RedisCacheOptions {
  /**
   * Redis connection URL.
   */
  url?: string;

  /**
   * Redis host.
   */
  host?: string;

  /**
   * Redis port.
   */
  port?: number;

  /**
   * Redis password.
   */
  password?: string;

  /**
   * Redis database number.
   */
  db?: number;

  /**
   * Key prefix for all cache keys.
   */
  prefix?: string;

  /**
   * Default TTL in seconds.
   */
  ttl?: number;
}
