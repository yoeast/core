/**
 * Database service - manages MongoDB connection via Mongoose.
 */

import mongoose from "mongoose";
import type { Db } from "mongodb";
import { Service } from "@yoeast/core";
import { config } from "@yoeast/core/config";

export interface DatabaseInfo {
  connected: boolean;
  host?: string;
  port?: number;
  name?: string;
}

export default class DatabaseService extends Service {
  /**
   * The Mongoose connection instance.
   */
  connection!: typeof mongoose;

  async boot(): Promise<void> {
    const uri = config<string>("database.uri");

    if (!uri) {
      throw new Error("Database URI not configured. Set MONGODB_URI in .env");
    }

    this.connection = await mongoose.connect(uri);
  }

  override async shutdown(): Promise<void> {
    await this.connection.disconnect();
  }

  /**
   * Get the raw MongoDB Db instance for direct operations.
   * Useful for migrations, aggregations, and operations not covered by Mongoose.
   */
  getDb(): Db {
    return this.connection.connection.db!;
  }

  /**
   * Get database connection info for health checks and logging.
   */
  getInfo(): DatabaseInfo {
    const conn = this.connection.connection;
    return {
      connected: conn.readyState === 1,
      host: conn.host,
      port: conn.port,
      name: conn.name,
    };
  }
}
