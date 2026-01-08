---
name: seeders
description: Run database seeders to populate test/development data
---

# Database Seeders

Run database seeders to populate test or development data.

## Usage

```bash
bun cli skill:run seeders --action=<action> [--name=<seeder>]
```

## Actions

### List available seeders
```bash
bun cli skill:run seeders --action=list
```

### Run all seeders
```bash
bun cli skill:run seeders --action=run
```

### Run specific seeder
```bash
bun cli skill:run seeders --action=run --name=users
```

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | yes | One of: list, run |
| name | string | no | Specific seeder name (for run action) |

## Outputs

Returns JSON with:
- `success`: boolean
- `action`: The action performed
- `seeders`: Array of seeder names (for list or run)
- `error`: Error message (on failure)

## Creating Seeders

Seeders are created in `app/seeders/` with `.seeder.ts` suffix:

```typescript
// app/seeders/users.seeder.ts
import type { Db } from "mongodb";
import { Seeder } from "@yoeast/core";

export default class UsersSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    const users = [
      { email: "admin@example.com", name: "Admin", role: "admin" },
      { email: "user@example.com", name: "User", role: "user" },
    ];

    // Insert only if collection is empty
    await this.insertIfEmpty(db, "users", users);
  }
}
```

## Seeder Helpers

Available in the Seeder base class:

- `insertIfEmpty(db, collection, documents)` - Insert if collection empty
- `upsertByKey(db, collection, documents, keyField)` - Upsert by key
- `truncate(db, collection)` - Clear collection before seeding
