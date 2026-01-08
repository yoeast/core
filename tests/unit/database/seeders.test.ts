/**
 * Tests for the seeder system.
 */
import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test";
import path from "node:path";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";
import {
  getSeederFiles,
  runSeeder,
  runAllSeeders,
  listSeeders,
} from "../../../core/database";

const TEST_DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/core_test";
const TEST_COLLECTION = "test_collection";

let client: MongoClient;
let db: Db;
const fixturesDir = path.join(__dirname, "../../fixtures/seeders");

beforeAll(async () => {
  client = new MongoClient(TEST_DB_URI);
  await client.connect();
  db = client.db();
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  // Clean up test collection before each test
  await db.collection(TEST_COLLECTION).deleteMany({});
});

describe("seeder files", () => {
  test("getSeederFiles returns files with .seeder.ts suffix", async () => {
    const files = await getSeederFiles(fixturesDir);
    
    expect(files.length).toBe(2);
    // Sorted alphabetically
    expect(files[0]!.name).toBe("another");
    expect(files[1]!.name).toBe("test");
  });

  test("getSeederFiles returns empty array for non-existent directory", async () => {
    const files = await getSeederFiles("/non/existent/path");
    expect(files).toEqual([]);
  });

  test("listSeeders returns seeder names", async () => {
    const names = await listSeeders(fixturesDir);
    expect(names).toEqual(["another", "test"]);
  });
});

describe("running seeders", () => {
  test("runSeeder executes specific seeder", async () => {
    await runSeeder(db, fixturesDir, "test");
    
    const docs = await db.collection(TEST_COLLECTION).find().toArray();
    expect(docs.length).toBe(2);
    expect(docs[0]!.name).toBe("Test Item 1");
    expect(docs[0]!.value).toBe(100);
    expect(docs[1]!.name).toBe("Test Item 2");
    expect(docs[1]!.value).toBe(200);
  });

  test("runSeeder throws for non-existent seeder", async () => {
    await expect(runSeeder(db, fixturesDir, "nonexistent")).rejects.toThrow(
      "Seeder not found: nonexistent"
    );
  });

  test("runAllSeeders executes all seeders", async () => {
    const executed = await runAllSeeders(db, fixturesDir);
    
    expect(executed).toEqual(["another", "test"]);
    
    const docs = await db.collection(TEST_COLLECTION).find().toArray();
    // another seeder upserts 2 docs
    // test seeder uses insertIfEmpty - collection not empty after another, so skips
    expect(docs.length).toBe(2);
  });

  test("runAllSeeders returns empty for no seeders", async () => {
    const executed = await runAllSeeders(db, "/non/existent/path");
    expect(executed).toEqual([]);
  });
});

describe("seeder helpers", () => {
  test("insertIfEmpty only inserts when collection is empty", async () => {
    // First run - should insert
    await runSeeder(db, fixturesDir, "test");
    let docs = await db.collection(TEST_COLLECTION).find().toArray();
    expect(docs.length).toBe(2);

    // Second run - should not insert (collection not empty)
    await runSeeder(db, fixturesDir, "test");
    docs = await db.collection(TEST_COLLECTION).find().toArray();
    expect(docs.length).toBe(2); // Still 2, not 4
  });

  test("upsertByKey updates existing documents", async () => {
    // Insert initial document
    await db.collection(TEST_COLLECTION).insertOne({
      name: "Upsert Item 1",
      value: 999,
    });

    // Run seeder with upsert
    await runSeeder(db, fixturesDir, "another");

    const docs = await db.collection(TEST_COLLECTION).find().sort({ name: 1 }).toArray();
    expect(docs.length).toBe(2);
    
    // First item should be updated
    expect(docs[0]!.name).toBe("Upsert Item 1");
    expect(docs[0]!.value).toBe(300); // Updated from 999 to 300
    
    // Second item should be inserted
    expect(docs[1]!.name).toBe("Upsert Item 2");
    expect(docs[1]!.value).toBe(400);
  });
});
