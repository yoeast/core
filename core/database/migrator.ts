/**
 * Migration runner - executes and tracks migrations.
 */

import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import type { Db } from "mongodb";
import { Migration, type MigrationRecord, type MigrationFile } from "./migration";

const MIGRATIONS_COLLECTION = "_migrations";

/**
 * Get all migration files from a directory.
 */
export async function getMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  const files: MigrationFile[] = [];

  try {
    const entries = await readdir(migrationsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".js")) continue;
      
      // Extract name without extension
      const name = entry.name.replace(/\.(ts|js)$/, "");
      files.push({
        name,
        path: path.join(migrationsDir, entry.name),
      });
    }

    // Sort by filename (timestamps should make this chronological)
    files.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    // Directory doesn't exist - no migrations
  }

  return files;
}

/**
 * Get executed migrations from the database.
 */
export async function getExecutedMigrations(db: Db): Promise<MigrationRecord[]> {
  const collection = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  return collection.find().sort({ executedAt: 1 }).toArray();
}

/**
 * Get pending migrations (not yet executed).
 */
export async function getPendingMigrations(
  db: Db,
  migrationsDir: string
): Promise<MigrationFile[]> {
  const allFiles = await getMigrationFiles(migrationsDir);
  const executed = await getExecutedMigrations(db);
  const executedNames = new Set(executed.map((m) => m.name));

  return allFiles.filter((f) => !executedNames.has(f.name));
}

/**
 * Get the current batch number.
 */
async function getCurrentBatch(db: Db): Promise<number> {
  const collection = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  const latest = await collection.findOne({}, { sort: { batch: -1 } });
  return latest?.batch ?? 0;
}

/**
 * Run pending migrations.
 * Returns the names of migrations that were run.
 */
export async function runMigrations(
  db: Db,
  migrationsDir: string
): Promise<string[]> {
  const pending = await getPendingMigrations(db, migrationsDir);
  
  if (pending.length === 0) {
    return [];
  }

  const batch = (await getCurrentBatch(db)) + 1;
  const collection = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  const executed: string[] = [];

  for (const file of pending) {
    // Load migration class
    const mod = await import(pathToFileURL(file.path).href);
    const MigrationClass = mod.default;

    if (!MigrationClass || !(MigrationClass.prototype instanceof Migration)) {
      throw new Error(`Migration ${file.name} must export a default class extending Migration`);
    }

    // Run migration
    const migration = new MigrationClass() as Migration;
    await migration.up(db);

    // Record execution
    await collection.insertOne({
      name: file.name,
      batch,
      executedAt: new Date(),
    });

    executed.push(file.name);
  }

  return executed;
}

/**
 * Rollback the last batch of migrations.
 * Returns the names of migrations that were rolled back.
 */
export async function rollbackMigrations(
  db: Db,
  migrationsDir: string
): Promise<string[]> {
  const currentBatch = await getCurrentBatch(db);
  
  if (currentBatch === 0) {
    return [];
  }

  const collection = db.collection<MigrationRecord>(MIGRATIONS_COLLECTION);
  const toRollback = await collection
    .find({ batch: currentBatch })
    .sort({ executedAt: -1 })
    .toArray();

  if (toRollback.length === 0) {
    return [];
  }

  const allFiles = await getMigrationFiles(migrationsDir);
  const fileMap = new Map(allFiles.map((f) => [f.name, f]));
  const rolledBack: string[] = [];

  for (const record of toRollback) {
    const file = fileMap.get(record.name);
    
    if (!file) {
      throw new Error(`Migration file not found for: ${record.name}`);
    }

    // Load migration class
    const mod = await import(pathToFileURL(file.path).href);
    const MigrationClass = mod.default;

    if (!MigrationClass || !(MigrationClass.prototype instanceof Migration)) {
      throw new Error(`Migration ${file.name} must export a default class extending Migration`);
    }

    // Run rollback
    const migration = new MigrationClass() as Migration;
    await migration.down(db);

    // Remove record
    await collection.deleteOne({ name: record.name });

    rolledBack.push(record.name);
  }

  return rolledBack;
}

/**
 * Get migration status.
 */
export async function getMigrationStatus(
  db: Db,
  migrationsDir: string
): Promise<{
  executed: Array<{ name: string; batch: number; executedAt: Date }>;
  pending: string[];
}> {
  const executed = await getExecutedMigrations(db);
  const pending = await getPendingMigrations(db, migrationsDir);

  return {
    executed: executed.map((m) => ({
      name: m.name,
      batch: m.batch,
      executedAt: m.executedAt,
    })),
    pending: pending.map((f) => f.name),
  };
}
