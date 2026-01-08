/**
 * Test seeder - creates test documents.
 */
import type { Db } from "mongodb";
import { Seeder } from "@yoeast/core";

export default class TestSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    await this.insertIfEmpty(db, "test_collection", [
      { name: "Test Item 1", value: 100 },
      { name: "Test Item 2", value: 200 },
    ]);
  }
}
