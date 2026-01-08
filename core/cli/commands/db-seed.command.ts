/**
 * Run database seeders.
 * 
 * Usage:
 *   bun cli db:seed           Run all seeders
 *   bun cli db:seed users     Run specific seeder
 */

import path from "node:path";
import { Command } from "../command";
import { hasService, service } from "../../service";
import { runSeeder, runAllSeeders, listSeeders } from "../../database";
import type { Db } from "mongodb";

export default class DbSeedCommand extends Command {
  static override signature = "db:seed {name?} {--list}";
  static override description = "Run database seeders";

  async handle(): Promise<number> {
    const name = this.argument<string>("name", "");
    const listOnly = this.option<boolean>("list", false);

    // Check database service
    if (!hasService("database")) {
      this.io.error("Database service is not configured");
      return 1;
    }

    const db = service("database") as unknown as { getDb(): Db };
    const mongodb = db.getDb();
    const seedersDir = path.join(process.cwd(), "app", "seeders");

    // List seeders
    if (listOnly) {
      const seeders = await listSeeders(seedersDir);
      if (seeders.length === 0) {
        this.io.info("No seeders found");
      } else {
        this.io.info("Available seeders:");
        for (const s of seeders) {
          this.io.writeln(`  - ${s}`);
        }
      }
      return 0;
    }

    try {
      if (name && typeof name === "string") {
        // Run specific seeder
        this.io.info(`Running seeder: ${name}`);
        await runSeeder(mongodb, seedersDir, name);
        this.io.success(`Seeded: ${name}`);
      } else {
        // Run all seeders
        this.io.info("Running all seeders...");
        const executed = await runAllSeeders(mongodb, seedersDir);

        if (executed.length === 0) {
          this.io.info("No seeders to run");
        } else {
          for (const s of executed) {
            this.io.success(`Seeded: ${s}`);
          }
          this.io.info(`\nRan ${executed.length} seeder(s)`);
        }
      }

      return 0;
    } catch (error) {
      this.io.error(`Seeding failed: ${(error as Error).message}`);
      return 1;
    }
  }
}
