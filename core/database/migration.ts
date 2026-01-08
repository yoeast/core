/**
 * Migration system for MongoDB schema changes.
 * 
 * Migrations handle:
 * - Index creation/updates/deletion
 * - Data transformations
 * - Schema changes (adding fields with defaults, etc.)
 */

import type { Db, IndexSpecification, CreateIndexesOptions } from "mongodb";

/**
 * Base class for migrations.
 * 
 * @example
 * export default class CreateUsersIndexes extends Migration {
 *   async up(db: Db) {
 *     await this.createIndex(db, "users", { email: 1 }, { unique: true });
 *   }
 * 
 *   async down(db: Db) {
 *     await db.collection("users").dropIndex("email_1");
 *   }
 * }
 */
export abstract class Migration {
  /**
   * Run the migration.
   */
  abstract up(db: Db): Promise<void>;

  /**
   * Reverse the migration.
   */
  abstract down(db: Db): Promise<void>;

  /**
   * Helper: Create an index if it doesn't exist.
   */
  protected async createIndex(
    db: Db,
    collection: string,
    index: IndexSpecification,
    options?: CreateIndexesOptions
  ): Promise<void> {
    await db.collection(collection).createIndex(index, options);
  }

  /**
   * Helper: Drop an index by name.
   */
  protected async dropIndex(db: Db, collection: string, indexName: string): Promise<void> {
    try {
      await db.collection(collection).dropIndex(indexName);
    } catch (error) {
      // Ignore if index doesn't exist
      if ((error as Error).message?.includes("index not found")) {
        return;
      }
      throw error;
    }
  }

  /**
   * Helper: Add a field with a default value to all documents.
   */
  protected async addField(
    db: Db,
    collection: string,
    field: string,
    defaultValue: unknown
  ): Promise<void> {
    await db.collection(collection).updateMany(
      { [field]: { $exists: false } },
      { $set: { [field]: defaultValue } }
    );
  }

  /**
   * Helper: Remove a field from all documents.
   */
  protected async removeField(db: Db, collection: string, field: string): Promise<void> {
    await db.collection(collection).updateMany({}, { $unset: { [field]: "" } });
  }

  /**
   * Helper: Rename a field in all documents.
   */
  protected async renameField(
    db: Db,
    collection: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    await db.collection(collection).updateMany({}, { $rename: { [oldName]: newName } });
  }
}

/**
 * Migration record stored in the database.
 */
export interface MigrationRecord {
  name: string;
  batch: number;
  executedAt: Date;
}

/**
 * Migration file info.
 */
export interface MigrationFile {
  name: string;
  path: string;
}
