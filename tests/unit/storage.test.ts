/**
 * Tests for storage path helpers.
 * Tests the storage module's path building logic.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { rm, stat } from "node:fs/promises";
import path from "node:path";

const testRoot = "/tmp/core-storage-test-" + Date.now();

describe("storage helpers", () => {
  // Import storage lazily and use its actual behavior
  let storagePath: (...segments: string[]) => string;
  let cachePath: (...segments: string[]) => string;
  let logsPath: (...segments: string[]) => string;
  let viewsCachePath: (...segments: string[]) => string;
  let ensureStorageDir: (...segments: string[]) => Promise<string>;
  let initStorage: (root: string) => void;

  beforeAll(async () => {
    // Ensure config is initialized (may already be from other tests)
    const configModule = await import("@yoeast/core/config");
    if (!configModule.isConfigInitialized()) {
      await configModule.initConfig(testRoot);
    }
    
    // Import storage module
    const storage = await import("@yoeast/core/storage");
    storagePath = storage.storagePath;
    cachePath = storage.cachePath;
    logsPath = storage.logsPath;
    viewsCachePath = storage.viewsCachePath;
    ensureStorageDir = storage.ensureStorageDir;
    initStorage = storage.initStorage;
    
    // Set our test root
    initStorage(testRoot);
  });

  afterAll(async () => {
    try {
      await rm(testRoot, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("storagePath", () => {
    test("returns path containing storage directory", () => {
      const result = storagePath();
      expect(result).toContain("storage");
      expect(result.startsWith(testRoot)).toBe(true);
    });

    test("appends segments to storage path", () => {
      const result = storagePath("uploads", "images");
      expect(result).toContain("uploads");
      expect(result).toContain("images");
      expect(result.endsWith(path.join("uploads", "images"))).toBe(true);
    });

    test("handles single segment", () => {
      const result = storagePath("data");
      expect(result).toContain("data");
      expect(result.endsWith("data")).toBe(true);
    });
  });

  describe("cachePath", () => {
    test("returns path containing cache directory", () => {
      const result = cachePath();
      expect(result).toContain("cache");
      expect(result.startsWith(testRoot)).toBe(true);
    });

    test("appends segments to cache path", () => {
      const result = cachePath("views", "compiled");
      expect(result).toContain("views");
      expect(result).toContain("compiled");
    });
  });

  describe("logsPath", () => {
    test("returns path containing logs directory", () => {
      const result = logsPath();
      expect(result).toContain("logs");
      expect(result.startsWith(testRoot)).toBe(true);
    });

    test("appends segments to logs path", () => {
      const result = logsPath("2024", "01");
      expect(result).toContain("2024");
      expect(result).toContain("01");
    });
  });

  describe("viewsCachePath", () => {
    test("returns path containing views directory", () => {
      const result = viewsCachePath();
      expect(result).toContain("views");
      expect(result.startsWith(testRoot)).toBe(true);
    });

    test("appends segments to views cache path", () => {
      const result = viewsCachePath("precompiled");
      expect(result).toContain("precompiled");
    });
  });

  describe("ensureStorageDir", () => {
    test("creates directory if it doesn't exist", async () => {
      const dir = await ensureStorageDir("test-dir-" + Date.now());
      expect(dir.startsWith(testRoot)).toBe(true);

      const stats = await stat(dir);
      expect(stats.isDirectory()).toBe(true);
    });

    test("creates nested directories", async () => {
      const dir = await ensureStorageDir("nested-" + Date.now(), "b", "c");
      expect(dir).toContain("b");
      expect(dir).toContain("c");

      const stats = await stat(dir);
      expect(stats.isDirectory()).toBe(true);
    });

    test("succeeds if directory already exists", async () => {
      const name = "existing-" + Date.now();
      const dir1 = await ensureStorageDir(name);
      const dir2 = await ensureStorageDir(name);
      expect(dir1).toBe(dir2);
    });
  });
});
