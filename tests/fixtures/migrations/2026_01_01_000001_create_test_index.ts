/**
 * Test migration - creates a test index.
 */
import type { Db } from "mongodb";
import { Migration } from "@core";

export default class CreateTestIndex extends Migration {
  async up(db: Db): Promise<void> {
    await this.createIndex(db, "test_collection", { testField: 1 });
  }

  async down(db: Db): Promise<void> {
    await this.dropIndex(db, "test_collection", "testField_1");
  }
}
