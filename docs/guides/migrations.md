# Migrations

> Database schema migrations for MongoDB.

## TL;DR

```ts
// app/migrations/2024_01_15_000001_create_users_indexes.ts
import { Migration, type Db } from "@core";

export default class CreateUsersIndexes extends Migration {
  async up(db: Db) {
    await this.createIndex(db, "users", { email: 1 }, { unique: true });
  }

  async down(db: Db) {
    await this.dropIndex(db, "users", "email_1");
  }
}
```

```bash
bun cli migrate           # Run pending migrations
bun cli migrate:status    # Show migration status
bun cli migrate:rollback  # Rollback last batch
```

## Quick Reference

### File Naming
```
YYYY_MM_DD_HHMMSS_description.ts
```
Example: `2024_01_15_143022_create_users_indexes.ts`

### Migration Methods
| Method | Description |
|--------|-------------|
| `up(db)` | Apply the migration |
| `down(db)` | Reverse the migration |

### Helper Methods
| Method | Description |
|--------|-------------|
| `createIndex(db, collection, keys, options?)` | Create index |
| `dropIndex(db, collection, indexName)` | Drop index |
| `addField(db, collection, field, defaultValue)` | Add field to docs |
| `removeField(db, collection, field)` | Remove field from docs |
| `renameField(db, collection, oldName, newName)` | Rename field |

### CLI Commands
| Command | Description |
|---------|-------------|
| `migrate` | Run pending migrations |
| `migrate:status` | Show migration status |
| `migrate:rollback` | Rollback last batch |

## Guide

### Creating a Migration

Create a file in `app/migrations/` with timestamp prefix:

```ts
// app/migrations/2024_01_15_000001_create_posts_indexes.ts
import type { Db } from "mongodb";
import { Migration } from "@core";

export default class CreatePostsIndexes extends Migration {
  async up(db: Db): Promise<void> {
    // Create indexes
    await this.createIndex(db, "posts", { slug: 1 }, { unique: true });
    await this.createIndex(db, "posts", { authorId: 1 });
    await this.createIndex(db, "posts", { createdAt: -1 });
    await this.createIndex(db, "posts", { tags: 1 });
  }

  async down(db: Db): Promise<void> {
    // Reverse the migration
    await this.dropIndex(db, "posts", "slug_1");
    await this.dropIndex(db, "posts", "authorId_1");
    await this.dropIndex(db, "posts", "createdAt_-1");
    await this.dropIndex(db, "posts", "tags_1");
  }
}
```

### Index Migrations

```ts
// Single field index
await this.createIndex(db, "users", { email: 1 });

// Compound index
await this.createIndex(db, "posts", { authorId: 1, createdAt: -1 });

// Unique index
await this.createIndex(db, "users", { username: 1 }, { unique: true });

// Partial index
await this.createIndex(db, "orders", { status: 1 }, {
  partialFilterExpression: { status: "pending" },
});

// Text index
await this.createIndex(db, "posts", { title: "text", content: "text" });

// TTL index (auto-delete after 30 days)
await this.createIndex(db, "sessions", { createdAt: 1 }, { expireAfterSeconds: 2592000 });
```

### Field Migrations

Add or modify fields across documents:

```ts
export default class AddUserVerification extends Migration {
  async up(db: Db): Promise<void> {
    // Add field with default value
    await this.addField(db, "users", "emailVerified", false);
    await this.addField(db, "users", "verifiedAt", null);
  }

  async down(db: Db): Promise<void> {
    await this.removeField(db, "users", "emailVerified");
    await this.removeField(db, "users", "verifiedAt");
  }
}
```

### Rename Fields

```ts
export default class RenameUserFields extends Migration {
  async up(db: Db): Promise<void> {
    await this.renameField(db, "users", "firstName", "first_name");
    await this.renameField(db, "users", "lastName", "last_name");
  }

  async down(db: Db): Promise<void> {
    await this.renameField(db, "users", "first_name", "firstName");
    await this.renameField(db, "users", "last_name", "lastName");
  }
}
```

### Raw MongoDB Operations

Access the raw database for complex operations:

```ts
async up(db: Db): Promise<void> {
  // Create collection with validation
  await db.createCollection("products", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "price"],
        properties: {
          name: { bsonType: "string" },
          price: { bsonType: "number", minimum: 0 },
        },
      },
    },
  });

  // Bulk update
  await db.collection("users").updateMany(
    { role: { $exists: false } },
    { $set: { role: "user" } }
  );
}
```

### Running Migrations

```bash
# Run all pending migrations
bun cli migrate

# Check status
bun cli migrate:status
```

Output:
```
Executed migrations:
  [1] 2024_01_15_000001_create_users_indexes (2024-01-15)
  [1] 2024_01_16_000001_add_email_verification (2024-01-16)

Pending migrations:
  [ ] 2024_01_17_000001_create_posts_indexes
```

### Rolling Back

```bash
# Rollback last batch
bun cli migrate:rollback
```

### Migration Batches

Migrations run together are grouped into a batch. Rollback reverts an entire batch:

```
Batch 1: migration_1, migration_2 (rolled back together)
Batch 2: migration_3
Batch 3: migration_4, migration_5
```

### Best Practices

1. **Keep migrations small** - One logical change per migration
2. **Always implement down()** - Enable rollbacks
3. **Test rollbacks** - Run migrate → rollback → migrate
4. **Don't modify old migrations** - Create new ones instead
5. **Use descriptive names** - `create_users_indexes` not `migration1`

## See Also

- [Database Service](../core-concepts/services/database.md) - MongoDB setup
- [Models](../core-concepts/models.md) - Mongoose models
- [Seeders](./seeders.md) - Database seeding
