/**
 * Storage path helpers.
 */

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { config } from "./config";

let rootDir: string = process.cwd();

/**
 * Initialize storage with the root directory.
 */
export function initStorage(root: string): void {
  rootDir = root;
}

/**
 * Get the base storage path.
 */
export function storagePath(...segments: string[]): string {
  const base = config<string>("storage.path", "storage");
  return path.join(rootDir, base, ...segments);
}

/**
 * Get the cache storage path.
 */
export function cachePath(...segments: string[]): string {
  const base = config<string>("storage.cache", "storage/cache");
  return path.join(rootDir, base, ...segments);
}

/**
 * Get the logs storage path.
 */
export function logsPath(...segments: string[]): string {
  const base = config<string>("storage.logs", "storage/logs");
  return path.join(rootDir, base, ...segments);
}

/**
 * Get the views cache path.
 */
export function viewsCachePath(...segments: string[]): string {
  const base = config<string>("storage.views", "storage/views");
  return path.join(rootDir, base, ...segments);
}

/**
 * Ensure a storage directory exists.
 */
export async function ensureStorageDir(...segments: string[]): Promise<string> {
  const dir = storagePath(...segments);
  await mkdir(dir, { recursive: true });
  return dir;
}
