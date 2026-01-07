/**
 * Database Query Skill
 * 
 * Execute MongoDB queries against any collection.
 */

import { service } from "@core";
import type DatabaseService from "@app/services/database";

interface Input {
  collection: string;
  filter?: string;
  fields?: string;
  sort?: string;
  limit?: number;
  skip?: number;
  count?: boolean;
  aggregate?: string;
}

interface Output {
  success: boolean;
  documents?: unknown[];
  count?: number;
  total?: number;
  error?: string;
}

export async function execute(input: Input): Promise<Output> {
  const { collection: colName, count: countOnly, aggregate } = input;

  if (!colName) {
    return { success: false, error: "Collection name is required" };
  }

  const db = service<DatabaseService>("database");
  const collection = db.connection.connection.db.collection(colName);

  // Aggregation pipeline
  if (aggregate) {
    try {
      const pipeline = JSON.parse(aggregate);
      const results = await collection.aggregate(pipeline).toArray();
      return { success: true, documents: results, count: results.length };
    } catch (error) {
      return { success: false, error: `Invalid aggregation: ${error}` };
    }
  }

  // Parse filter
  let filter = {};
  if (input.filter) {
    try {
      filter = JSON.parse(input.filter);
    } catch {
      return { success: false, error: "Invalid filter JSON" };
    }
  }

  // Count only
  if (countOnly) {
    const count = await collection.countDocuments(filter);
    return { success: true, count };
  }

  // Build query
  let cursor = collection.find(filter);

  // Projection
  if (input.fields) {
    const projection: Record<string, number> = {};
    for (const field of input.fields.split(",")) {
      projection[field.trim()] = 1;
    }
    cursor = cursor.project(projection);
  }

  // Sort
  if (input.sort) {
    const sort: Record<string, 1 | -1> = {};
    for (const part of input.sort.split(",")) {
      const [field, dir] = part.trim().split(":");
      if (field) {
        sort[field] = dir === "desc" || dir === "-1" ? -1 : 1;
      }
    }
    cursor = cursor.sort(sort);
  }

  // Pagination
  if (input.skip) {
    cursor = cursor.skip(input.skip);
  }
  cursor = cursor.limit(input.limit ?? 10);

  // Execute
  const documents = await cursor.toArray();
  const total = await collection.countDocuments(filter);

  return {
    success: true,
    documents,
    count: documents.length,
    total,
  };
}
