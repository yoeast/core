import { describe, expect, test } from "bun:test";
import { LruCacheStore } from "../../../core/cache";

function makeEntry(value: string) {
  return { etag: value, body: value, contentType: "text/plain", status: 200, createdAt: Date.now() };
}

describe("lru cache store", () => {
  test("evicts least recently used", () => {
    const store = new LruCacheStore(2);
    store.set("a", makeEntry("a"));
    store.set("b", makeEntry("b"));

    // touch a so b is LRU
    expect(store.get("a")?.etag).toBe("a");

    store.set("c", makeEntry("c"));

    expect(store.get("b")).toBe(null);
    expect(store.get("a")?.etag).toBe("a");
    expect(store.get("c")?.etag).toBe("c");
  });

  test("respects ttl", async () => {
    const store = new LruCacheStore();
    store.set("a", makeEntry("a"), 10);
    expect(store.get("a")?.etag).toBe("a");

    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(store.get("a")).toBe(null);
  });
});
