/**
 * Seeder system for populating test/development data.
 */

import type { Db } from "mongodb";

/**
 * Base class for seeders.
 * 
 * @example
 * export default class UsersSeeder extends Seeder {
 *   async run(db: Db) {
 *     await db.collection("users").insertMany([
 *       { email: "admin@example.com", role: "admin" },
 *       { email: "user@example.com", role: "user" },
 *     ]);
 *   }
 * }
 */
export abstract class Seeder {
  /**
   * Run the seeder.
   */
  abstract run(db: Db): Promise<void>;

  /**
   * Helper: Insert documents if collection is empty.
   */
  protected async insertIfEmpty(
    db: Db,
    collection: string,
    documents: Record<string, unknown>[]
  ): Promise<number> {
    const count = await db.collection(collection).countDocuments();
    if (count > 0) {
      return 0;
    }
    const result = await db.collection(collection).insertMany(documents);
    return result.insertedCount;
  }

  /**
   * Helper: Upsert documents by a key field.
   */
  protected async upsertByKey(
    db: Db,
    collection: string,
    documents: Record<string, unknown>[],
    keyField: string
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const doc of documents) {
      const filter = { [keyField]: doc[keyField] };
      const result = await db.collection(collection).updateOne(
        filter,
        { $set: doc },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        inserted++;
      } else if (result.modifiedCount > 0) {
        updated++;
      }
    }

    return { inserted, updated };
  }

  /**
   * Helper: Clear a collection before seeding.
   */
  protected async truncate(db: Db, collection: string): Promise<number> {
    const result = await db.collection(collection).deleteMany({});
    return result.deletedCount;
  }
}

/**
 * Seeder file info.
 */
export interface SeederFile {
  name: string;
  path: string;
}
