/**
 * Seeder runner - executes seeders.
 */

import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { Db } from "mongodb";
import { Seeder, type SeederFile } from "./seeder";

/**
 * Get all seeder files from a directory.
 */
export async function getSeederFiles(seedersDir: string): Promise<SeederFile[]> {
  const files: SeederFile[] = [];

  try {
    const entries = await readdir(seedersDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".seeder.ts") && !entry.name.endsWith(".seeder.js")) continue;
      
      // Extract name without .seeder.ts extension
      const name = entry.name.replace(/\.seeder\.(ts|js)$/, "");
      files.push({
        name,
        path: path.join(seedersDir, entry.name),
      });
    }

    // Sort alphabetically
    files.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    // Directory doesn't exist - no seeders
  }

  return files;
}

/**
 * Run a specific seeder by name.
 */
export async function runSeeder(
  db: Db,
  seedersDir: string,
  name: string
): Promise<void> {
  const files = await getSeederFiles(seedersDir);
  const file = files.find((f) => f.name === name);

  if (!file) {
    throw new Error(`Seeder not found: ${name}`);
  }

  await executeSeeder(db, file);
}

/**
 * Run all seeders.
 * Returns the names of seeders that were run.
 */
export async function runAllSeeders(
  db: Db,
  seedersDir: string
): Promise<string[]> {
  const files = await getSeederFiles(seedersDir);
  const executed: string[] = [];

  for (const file of files) {
    await executeSeeder(db, file);
    executed.push(file.name);
  }

  return executed;
}

/**
 * Execute a single seeder file.
 */
async function executeSeeder(db: Db, file: SeederFile): Promise<void> {
  const mod = await import(pathToFileURL(file.path).href);
  const SeederClass = mod.default;

  if (!SeederClass || !(SeederClass.prototype instanceof Seeder)) {
    throw new Error(`Seeder ${file.name} must export a default class extending Seeder`);
  }

  const seeder = new SeederClass() as Seeder;
  await seeder.run(db);
}

/**
 * List available seeders.
 */
export async function listSeeders(seedersDir: string): Promise<string[]> {
  const files = await getSeederFiles(seedersDir);
  return files.map((f) => f.name);
}
