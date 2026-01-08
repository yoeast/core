/**
 * Another test seeder - uses upsert.
 */
import type { Db } from "mongodb";
import { Seeder } from "@yoeast/core";

export default class AnotherSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    await this.upsertByKey(
      db,
      "test_collection",
      [
        { name: "Upsert Item 1", value: 300 },
        { name: "Upsert Item 2", value: 400 },
      ],
      "name"
    );
  }
}
