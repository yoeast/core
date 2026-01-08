/**
 * Test migration - adds a field to documents.
 */
import type { Db } from "mongodb";
import { Migration } from "@yoeast/core";

export default class AddTestField extends Migration {
  async up(db: Db): Promise<void> {
    await this.addField(db, "test_collection", "newField", "default_value");
  }

  async down(db: Db): Promise<void> {
    await this.removeField(db, "test_collection", "newField");
  }
}
