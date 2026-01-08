/**
 * Users seeder - creates sample users for development.
 */

import type { Db } from "mongodb";
import { Seeder } from "@core";

export default class UsersSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    const users = [
      {
        email: "admin@example.com",
        password: "password123", // In production, hash this!
        name: "Admin User",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "user@example.com",
        password: "password123",
        name: "Regular User",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Only insert if collection is empty
    const inserted = await this.insertIfEmpty(db, "users", users);
    
    if (inserted > 0) {
      console.log(`  Created ${inserted} sample users`);
    } else {
      console.log("  Users collection not empty, skipping");
    }
  }
}
