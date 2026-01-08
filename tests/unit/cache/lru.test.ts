import { describe, expect, test } from "bun:test";
import { LruCacheStore } from "../../../core/cache";

interface TestEntry {
  value: string;
}

function makeEntry(value: string): TestEntry {
  return { value };
}

describe("lru cache store", () => {
  test("evicts least recently used", async () => {
    const store = new LruCacheStore({ max: 2 });
    await store.set("a", makeEntry("a"));
    await store.set("b", makeEntry("b"));

    // touch a so b is LRU
    const entryA = await store.get<TestEntry>("a");
    expect(entryA?.value).toBe("a");

    await store.set("c", makeEntry("c"));

    expect(await store.get("b")).toBe(null);
    expect((await store.get<TestEntry>("a"))?.value).toBe("a");
    expect((await store.get<TestEntry>("c"))?.value).toBe("c");
  });

  test("respects ttl", async () => {
    const store = new LruCacheStore();
    await store.set("a", makeEntry("a"), 0.01); // 10ms TTL
    expect((await store.get<TestEntry>("a"))?.value).toBe("a");

    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(await store.get("a")).toBe(null);
  });
});
