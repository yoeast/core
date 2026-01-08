---
name: migrations
description: Manage database migrations - run, rollback, and check status
---

# Database Migrations

Manage MongoDB database migrations via CLI.

## Usage

```bash
bun cli skill:run migrations --action=<action>
```

## Actions

### Run pending migrations
```bash
bun cli skill:run migrations --action=run
```

### Check migration status
```bash
bun cli skill:run migrations --action=status
```

### Rollback last batch
```bash
bun cli skill:run migrations --action=rollback
```

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | yes | One of: run, status, rollback |

## Outputs

Returns JSON with:
- `success`: boolean
- `action`: The action performed
- `migrations`: Array of migration names affected
- `executed`: Array of executed migrations (for status)
- `pending`: Array of pending migrations (for status)
- `error`: Error message (on failure)

## Creating Migrations

Migrations are created in `app/migrations/` with timestamp prefix:

```typescript
// app/migrations/2026_01_07_000001_create_users_indexes.ts
import type { Db } from "mongodb";
import { Migration } from "@core";

export default class CreateUsersIndexes extends Migration {
  async up(db: Db): Promise<void> {
    await this.createIndex(db, "users", { email: 1 }, { unique: true });
  }

  async down(db: Db): Promise<void> {
    await this.dropIndex(db, "users", "email_1");
  }
}
```

## Migration Helpers

Available in the Migration base class:

- `createIndex(db, collection, index, options)` - Create an index
- `dropIndex(db, collection, indexName)` - Drop an index  
- `addField(db, collection, field, defaultValue)` - Add field to all docs
- `removeField(db, collection, field)` - Remove field from all docs
- `renameField(db, collection, oldName, newName)` - Rename a field
