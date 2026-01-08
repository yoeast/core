/**
 * Show migration status.
 * 
 * Usage:
 *   bun cli migrate:status    Show status of all migrations
 */

import path from "node:path";
import { Command } from "../command";
import { hasService, service } from "../../service";
import { getMigrationStatus } from "../../database";
import type { Db } from "mongodb";

export default class MigrateStatusCommand extends Command {
  static override signature = "migrate:status";
  static override description = "Show the status of all migrations";

  async handle(): Promise<number> {
    // Check database service
    if (!hasService("database")) {
      this.io.error("Database service is not configured");
      return 1;
    }

    const db = service("database") as unknown as { getDb(): Db };
    const mongodb = db.getDb();
    const migrationsDir = path.join(process.cwd(), "app", "migrations");

    try {
      const status = await getMigrationStatus(mongodb, migrationsDir);

      // Display executed migrations
      if (status.executed.length > 0) {
        this.io.info("Executed migrations:");
        for (const m of status.executed) {
          const date = m.executedAt.toISOString().split("T")[0];
          this.io.success(`  [${m.batch}] ${m.name} (${date})`);
        }
      } else {
        this.io.info("No migrations have been executed");
      }

      // Display pending migrations
      if (status.pending.length > 0) {
        this.io.info("\nPending migrations:");
        for (const name of status.pending) {
          this.io.warning(`  [ ] ${name}`);
        }
      } else if (status.executed.length > 0) {
        this.io.info("\nNo pending migrations");
      }

      return 0;
    } catch (error) {
      this.io.error(`Failed to get status: ${(error as Error).message}`);
      return 1;
    }
  }
}
