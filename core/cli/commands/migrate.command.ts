/**
 * Run database migrations.
 * 
 * Usage:
 *   bun cli migrate           Run all pending migrations
 */

import path from "node:path";
import { Command } from "../command";
import { hasService, service } from "../../service";
import { runMigrations } from "../../database";
import type { Db } from "mongodb";

export default class MigrateCommand extends Command {
  static override signature = "migrate";
  static override description = "Run pending database migrations";

  async handle(): Promise<number> {
    // Check database service
    if (!hasService("database")) {
      this.io.error("Database service is not configured");
      return 1;
    }

    const db = service("database") as unknown as { getDb(): Db };
    const mongodb = db.getDb();
    const migrationsDir = path.join(process.cwd(), "app", "migrations");

    this.io.info("Running migrations...");

    try {
      const executed = await runMigrations(mongodb, migrationsDir);

      if (executed.length === 0) {
        this.io.success("Nothing to migrate");
      } else {
        for (const name of executed) {
          this.io.success(`Migrated: ${name}`);
        }
        this.io.info(`\nRan ${executed.length} migration(s)`);
      }

      return 0;
    } catch (error) {
      this.io.error(`Migration failed: ${(error as Error).message}`);
      return 1;
    }
  }
}
