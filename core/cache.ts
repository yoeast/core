/**
 * Simple cache system with LRU eviction and TTL support.
 */

export interface CacheEntry {
  etag: string;
  body: string;
  contentType: string;
  status: number;
  createdAt: number;
  ttlMs?: number;
}

export interface CacheStore {
  get(key: string): Promise<CacheEntry | null> | CacheEntry | null;
  set(key: string, entry: CacheEntry, ttlMs?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

interface LruEntry {
  key: string;
  value: CacheEntry;
  expiresAt?: number;
}

export class LruCacheStore implements CacheStore {
  private maxSize: number;
  private map = new Map<string, LruEntry>();

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry | null {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: CacheEntry, ttlMs?: number): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : value.ttlMs ? value.createdAt + value.ttlMs : undefined;

    if (this.map.has(key)) {
      this.map.delete(key);
    }

    this.map.set(key, { key, value, expiresAt });
    this.trim();
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  private trim(): void {
    while (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value as string | undefined;
      if (!oldest) return;
      this.map.delete(oldest);
    }
  }
}

// Global default store
let defaultStore: CacheStore | null = null;

export function setDefaultCacheStore(store: CacheStore): void {
  defaultStore = store;
}

export function getDefaultCacheStore(): CacheStore {
  if (!defaultStore) {
    defaultStore = new LruCacheStore();
  }
  return defaultStore;
}
