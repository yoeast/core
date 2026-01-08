/**
 * db:query command - query a collection and display results.
 */

import { Command } from "../command";
import { hasService, service } from "../../service";
import type DatabaseService from "@app/services/database";

export default class DbQueryCommand extends Command {
  static override signature = "db:query {collection} {--filter=} {--limit=10} {--fields=} {--sort=}";
  static override description = "Query a collection and display results";

  async handle(): Promise<number> {
    if (!hasService("database")) {
      this.io.error("Database service not available");
      return 1;
    }

    const collection = this.argument("collection", "") as string;
    const filterStr = this.option("filter", "") as string;
    const limitStr = this.option("limit", "10") as string;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const fieldsStr = this.option("fields", "") as string;
    const sortStr = this.option("sort", "") as string;

    if (!collection) {
      this.io.error("Collection name is required");
      return 1;
    }

    const db = service<DatabaseService>("database");
    const col = db.connection.connection.db!.collection(collection);

    // Parse filter JSON
    let filter = {};
    if (filterStr) {
      try {
        filter = JSON.parse(filterStr);
      } catch {
        this.io.error("Invalid filter JSON");
        return 1;
      }
    }

    // Parse projection (fields)
    let projection: Record<string, number> | undefined;
    if (fieldsStr) {
      projection = {};
      for (const field of fieldsStr.split(",")) {
        projection[field.trim()] = 1;
      }
    }

    // Parse sort
    let sort: Record<string, 1 | -1> | undefined;
    if (sortStr) {
      sort = {};
      for (const part of sortStr.split(",")) {
        const [field, dir] = part.trim().split(":");
        if (field) {
          sort[field] = dir === "desc" || dir === "-1" ? -1 : 1;
        }
      }
    }

    // Execute query
    let cursor = col.find(filter);
    if (projection) cursor = cursor.project(projection);
    if (sort) cursor = cursor.sort(sort);
    cursor = cursor.limit(limit);

    const docs = await cursor.toArray();
    const total = await col.countDocuments(filter);

    if (docs.length === 0) {
      this.io.info("No documents found");
      return 0;
    }

    this.io.info(`Showing ${docs.length} of ${total} document(s):\n`);

    // Display as formatted JSON
    for (const doc of docs) {
      this.io.writeln(JSON.stringify(doc, null, 2));
      this.io.newLine();
    }

    return 0;
  }
}
