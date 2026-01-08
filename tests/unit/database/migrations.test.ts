/**
 * Tests for the migration system.
 */
import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test";
import path from "node:path";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";
import {
  getMigrationFiles,
  getExecutedMigrations,
  getPendingMigrations,
  runMigrations,
  rollbackMigrations,
  getMigrationStatus,
} from "../../../core/database";

const TEST_DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/core_test";
const MIGRATIONS_COLLECTION = "_migrations";
const TEST_COLLECTION = "test_collection";

let client: MongoClient;
let db: Db;
const fixturesDir = path.join(__dirname, "../../fixtures/migrations");

beforeAll(async () => {
  client = new MongoClient(TEST_DB_URI);
  await client.connect();
  db = client.db();
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  // Clean up test collections before each test
  await db.collection(MIGRATIONS_COLLECTION).deleteMany({});
  await db.collection(TEST_COLLECTION).deleteMany({});
  
  // Drop test indexes if they exist
  try {
    await db.collection(TEST_COLLECTION).dropIndex("testField_1");
  } catch {
    // Index doesn't exist, ignore
  }
});

describe("migration files", () => {
  test("getMigrationFiles returns sorted files", async () => {
    const files = await getMigrationFiles(fixturesDir);
    
    expect(files.length).toBe(2);
    expect(files[0]!.name).toBe("2026_01_01_000001_create_test_index");
    expect(files[1]!.name).toBe("2026_01_01_000002_add_test_field");
  });

  test("getMigrationFiles returns empty array for non-existent directory", async () => {
    const files = await getMigrationFiles("/non/existent/path");
    expect(files).toEqual([]);
  });
});

describe("migration execution", () => {
  test("runMigrations executes pending migrations", async () => {
    const executed = await runMigrations(db, fixturesDir);
    
    expect(executed.length).toBe(2);
    expect(executed[0]).toBe("2026_01_01_000001_create_test_index");
    expect(executed[1]).toBe("2026_01_01_000002_add_test_field");
    
    // Verify index was created
    const indexes = await db.collection(TEST_COLLECTION).indexes();
    const testIndex = indexes.find(i => i.name === "testField_1");
    expect(testIndex).toBeDefined();
  });

  test("runMigrations records execution in database", async () => {
    await runMigrations(db, fixturesDir);
    
    const records = await getExecutedMigrations(db);
    expect(records.length).toBe(2);
    expect(records[0]!.name).toBe("2026_01_01_000001_create_test_index");
    expect(records[0]!.batch).toBe(1);
    expect(records[1]!.name).toBe("2026_01_01_000002_add_test_field");
    expect(records[1]!.batch).toBe(1);
  });

  test("runMigrations skips already executed migrations", async () => {
    // First run
    await runMigrations(db, fixturesDir);
    
    // Second run should return empty
    const executed = await runMigrations(db, fixturesDir);
    expect(executed).toEqual([]);
  });

  test("getPendingMigrations returns only unexecuted migrations", async () => {
    // Run first migration manually by inserting record
    await db.collection(MIGRATIONS_COLLECTION).insertOne({
      name: "2026_01_01_000001_create_test_index",
      batch: 1,
      executedAt: new Date(),
    });

    const pending = await getPendingMigrations(db, fixturesDir);
    expect(pending.length).toBe(1);
    expect(pending[0]!.name).toBe("2026_01_01_000002_add_test_field");
  });
});

describe("migration rollback", () => {
  test("rollbackMigrations reverses last batch", async () => {
    // Run migrations first
    await runMigrations(db, fixturesDir);
    
    // Rollback
    const rolledBack = await rollbackMigrations(db, fixturesDir);
    
    expect(rolledBack.length).toBe(2);
    // Rollback is in reverse order
    expect(rolledBack[0]).toBe("2026_01_01_000002_add_test_field");
    expect(rolledBack[1]).toBe("2026_01_01_000001_create_test_index");
    
    // Verify migrations were removed from tracking
    const records = await getExecutedMigrations(db);
    expect(records.length).toBe(0);
  });

  test("rollbackMigrations only rolls back last batch", async () => {
    // Insert first migration as batch 1
    await db.collection(MIGRATIONS_COLLECTION).insertOne({
      name: "2026_01_01_000001_create_test_index",
      batch: 1,
      executedAt: new Date(),
    });
    
    // Insert second migration as batch 2
    await db.collection(MIGRATIONS_COLLECTION).insertOne({
      name: "2026_01_01_000002_add_test_field",
      batch: 2,
      executedAt: new Date(),
    });

    // Rollback should only affect batch 2
    const rolledBack = await rollbackMigrations(db, fixturesDir);
    expect(rolledBack.length).toBe(1);
    expect(rolledBack[0]).toBe("2026_01_01_000002_add_test_field");
    
    // Batch 1 should still exist
    const records = await getExecutedMigrations(db);
    expect(records.length).toBe(1);
    expect(records[0]!.name).toBe("2026_01_01_000001_create_test_index");
  });

  test("rollbackMigrations returns empty when nothing to rollback", async () => {
    const rolledBack = await rollbackMigrations(db, fixturesDir);
    expect(rolledBack).toEqual([]);
  });
});

describe("migration status", () => {
  test("getMigrationStatus returns correct status", async () => {
    // Run first migration only
    await db.collection(MIGRATIONS_COLLECTION).insertOne({
      name: "2026_01_01_000001_create_test_index",
      batch: 1,
      executedAt: new Date("2026-01-01"),
    });

    const status = await getMigrationStatus(db, fixturesDir);
    
    expect(status.executed.length).toBe(1);
    expect(status.executed[0]!.name).toBe("2026_01_01_000001_create_test_index");
    expect(status.executed[0]!.batch).toBe(1);
    
    expect(status.pending.length).toBe(1);
    expect(status.pending[0]).toBe("2026_01_01_000002_add_test_field");
  });

  test("getMigrationStatus with all migrations executed", async () => {
    await runMigrations(db, fixturesDir);
    
    const status = await getMigrationStatus(db, fixturesDir);
    expect(status.executed.length).toBe(2);
    expect(status.pending.length).toBe(0);
  });

  test("getMigrationStatus with no migrations executed", async () => {
    const status = await getMigrationStatus(db, fixturesDir);
    expect(status.executed.length).toBe(0);
    expect(status.pending.length).toBe(2);
  });
});
