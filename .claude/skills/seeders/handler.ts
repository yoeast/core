/**
 * Seeders Skill
 * 
 * Run database seeders to populate test/development data.
 */

import path from "node:path";
import { service, hasService } from "@yoeast/core";
import { runSeeder, runAllSeeders, listSeeders } from "@yoeast/core/database";
import type { Db } from "mongodb";

interface Input {
  action: "list" | "run";
  name?: string;
}

interface Output {
  success: boolean;
  action: string;
  seeders?: string[];
  error?: string;
}

export async function execute(input: Input): Promise<Output> {
  const { action, name } = input;

  if (!action || !["list", "run"].includes(action)) {
    return {
      success: false,
      action: action || "unknown",
      error: "Action must be one of: list, run",
    };
  }

  if (!hasService("database")) {
    return {
      success: false,
      action,
      error: "Database service is not configured",
    };
  }

  const db = service("database") as unknown as { getDb(): Db };
  const mongodb = db.getDb();
  const seedersDir = path.join(process.cwd(), "app", "seeders");

  try {
    switch (action) {
      case "list": {
        const seeders = await listSeeders(seedersDir);
        return {
          success: true,
          action,
          seeders,
        };
      }

      case "run": {
        if (name) {
          await runSeeder(mongodb, seedersDir, name);
          return {
            success: true,
            action,
            seeders: [name],
          };
        } else {
          const executed = await runAllSeeders(mongodb, seedersDir);
          return {
            success: true,
            action,
            seeders: executed,
          };
        }
      }

      default:
        return {
          success: false,
          action,
          error: `Unknown action: ${action}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      action,
      error: (error as Error).message,
    };
  }
}
