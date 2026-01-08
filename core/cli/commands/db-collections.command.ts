/**
 * db:collections command - list all collections in the database.
 */

import { Command } from "../command";
import { hasService, service } from "../../service";
import type DatabaseService from "@app/services/database";

export default class DbCollectionsCommand extends Command {
  static override signature = "db:collections";
  static override description = "List all collections in the database";

  async handle(): Promise<number> {
    if (!hasService("database")) {
      this.io.error("Database service not available");
      return 1;
    }

    const db = service<DatabaseService>("database");
    const collections = await db.connection.connection.db!.listCollections().toArray();

    if (collections.length === 0) {
      this.io.info("No collections found");
      return 0;
    }

    this.io.info(`Found ${collections.length} collection(s):\n`);

    const rows = collections.map((col) => [
      col.name,
      col.type || "collection",
    ]);

    this.io.table(["Name", "Type"], rows);

    return 0;
  }
}
