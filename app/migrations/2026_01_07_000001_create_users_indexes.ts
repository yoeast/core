/**
 * Create indexes for the users collection.
 * 
 * This migration ensures the email field has a unique index.
 */

import type { Db } from "mongodb";
import { Migration } from "@yoeast/core";

export default class CreateUsersIndexes extends Migration {
  async up(db: Db): Promise<void> {
    // Create unique index on email
    await this.createIndex(db, "users", { email: 1 }, { unique: true });
    
    // Create index on createdAt for sorting
    await this.createIndex(db, "users", { createdAt: -1 });
  }

  async down(db: Db): Promise<void> {
    await this.dropIndex(db, "users", "email_1");
    await this.dropIndex(db, "users", "createdAt_-1");
  }
}
