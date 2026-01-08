/**
 * Migrations Skill
 * 
 * Manage database migrations - run, rollback, check status.
 */

import path from "node:path";
import { service, hasService } from "@yoeast/core";
import { runMigrations, rollbackMigrations, getMigrationStatus } from "@yoeast/core/database";
import type { Db } from "mongodb";

interface Input {
  action: "run" | "status" | "rollback";
}

interface Output {
  success: boolean;
  action: string;
  migrations?: string[];
  executed?: Array<{ name: string; batch: number; executedAt: string }>;
  pending?: string[];
  error?: string;
}

export async function execute(input: Input): Promise<Output> {
  const { action } = input;

  if (!action || !["run", "status", "rollback"].includes(action)) {
    return {
      success: false,
      action: action || "unknown",
      error: "Action must be one of: run, status, rollback",
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
  const migrationsDir = path.join(process.cwd(), "app", "migrations");

  try {
    switch (action) {
      case "run": {
        const executed = await runMigrations(mongodb, migrationsDir);
        return {
          success: true,
          action,
          migrations: executed,
        };
      }

      case "rollback": {
        const rolledBack = await rollbackMigrations(mongodb, migrationsDir);
        return {
          success: true,
          action,
          migrations: rolledBack,
        };
      }

      case "status": {
        const status = await getMigrationStatus(mongodb, migrationsDir);
        return {
          success: true,
          action,
          executed: status.executed.map((m) => ({
            name: m.name,
            batch: m.batch,
            executedAt: m.executedAt.toISOString(),
          })),
          pending: status.pending,
        };
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
