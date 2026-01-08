/**
 * Rollback database migrations.
 * 
 * Usage:
 *   bun cli migrate:rollback    Rollback the last batch of migrations
 */

import path from "node:path";
import { Command } from "../command";
import { hasService, service } from "../../service";
import { rollbackMigrations } from "../../database";
import type { Db } from "mongodb";

export default class MigrateRollbackCommand extends Command {
  static override signature = "migrate:rollback";
  static override description = "Rollback the last batch of migrations";

  async handle(): Promise<number> {
    // Check database service
    if (!hasService("database")) {
      this.io.error("Database service is not configured");
      return 1;
    }

    const db = service("database") as unknown as { getDb(): Db };
    const mongodb = db.getDb();
    const migrationsDir = path.join(process.cwd(), "app", "migrations");

    this.io.info("Rolling back migrations...");

    try {
      const rolledBack = await rollbackMigrations(mongodb, migrationsDir);

      if (rolledBack.length === 0) {
        this.io.success("Nothing to rollback");
      } else {
        for (const name of rolledBack) {
          this.io.warning(`Rolled back: ${name}`);
        }
        this.io.info(`\nRolled back ${rolledBack.length} migration(s)`);
      }

      return 0;
    } catch (error) {
      this.io.error(`Rollback failed: ${(error as Error).message}`);
      return 1;
    }
  }
}
