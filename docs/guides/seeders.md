# Seeders

> Populate database with test or initial data.

## TL;DR

```ts
// app/seeders/users.seeder.ts
import type { Db } from "mongodb";
import { Seeder } from "@core";

export default class UsersSeeder extends Seeder {
  async run(db: Db) {
    await this.insertIfEmpty(db, "users", [
      { email: "admin@example.com", name: "Admin", role: "admin" },
      { email: "user@example.com", name: "User", role: "user" },
    ]);
  }
}
```

```bash
bun cli db:seed          # Run all seeders
bun cli db:seed users    # Run specific seeder
bun cli db:seed --list   # List available seeders
```

## Quick Reference

### File Location
```
app/seeders/*.seeder.ts
```

### Seeder Methods
| Method | Description |
|--------|-------------|
| `run(db)` | Main seeding logic |

### Helper Methods
| Method | Description |
|--------|-------------|
| `insertIfEmpty(db, collection, docs)` | Insert only if collection empty |
| `upsertByKey(db, collection, docs, key)` | Update or insert by key |
| `truncate(db, collection)` | Clear collection |

### CLI Commands
| Command | Description |
|---------|-------------|
| `db:seed` | Run all seeders |
| `db:seed <name>` | Run specific seeder |
| `db:seed --list` | List available seeders |

## Guide

### Creating a Seeder

Create a file in `app/seeders/` with `.seeder.ts` extension:

```ts
// app/seeders/categories.seeder.ts
import type { Db } from "mongodb";
import { Seeder } from "@core";

export default class CategoriesSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    await this.insertIfEmpty(db, "categories", [
      { name: "Technology", slug: "technology" },
      { name: "Science", slug: "science" },
      { name: "Health", slug: "health" },
      { name: "Business", slug: "business" },
    ]);
  }
}
```

### Insert If Empty

Only insert if collection has no documents:

```ts
async run(db: Db): Promise<void> {
  await this.insertIfEmpty(db, "settings", [
    { key: "site_name", value: "My Site" },
    { key: "maintenance", value: false },
  ]);
}
```

### Upsert by Key

Update existing or insert new based on a key field:

```ts
async run(db: Db): Promise<void> {
  await this.upsertByKey(db, "permissions", [
    { name: "users.read", description: "View users" },
    { name: "users.write", description: "Create/edit users" },
    { name: "users.delete", description: "Delete users" },
  ], "name");  // Match by 'name' field
}
```

### Truncate and Seed

Clear collection before seeding:

```ts
async run(db: Db): Promise<void> {
  // Clear existing data
  await this.truncate(db, "demo_data");
  
  // Insert fresh data
  const collection = db.collection("demo_data");
  await collection.insertMany([
    { value: 1 },
    { value: 2 },
    { value: 3 },
  ]);
}
```

### Seeding with Relationships

Seed related data:

```ts
import type { Db, ObjectId } from "mongodb";
import { Seeder } from "@core";

export default class PostsSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    // Get existing user
    const user = await db.collection("users").findOne({ email: "admin@example.com" });
    if (!user) return;

    // Get categories
    const categories = await db.collection("categories").find().toArray();
    
    await this.insertIfEmpty(db, "posts", [
      {
        title: "Getting Started",
        slug: "getting-started",
        content: "Welcome to our platform...",
        authorId: user._id,
        categoryId: categories[0]?._id,
        createdAt: new Date(),
      },
      {
        title: "Advanced Features",
        slug: "advanced-features",
        content: "Let's explore advanced features...",
        authorId: user._id,
        categoryId: categories[1]?._id,
        createdAt: new Date(),
      },
    ]);
  }
}
```

### Generating Fake Data

Use a library like faker for realistic test data:

```ts
import type { Db } from "mongodb";
import { Seeder } from "@core";
import { faker } from "@faker-js/faker";

export default class UsersSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    const users = Array.from({ length: 100 }, () => ({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),
      bio: faker.lorem.paragraph(),
      createdAt: faker.date.past(),
    }));

    await this.insertIfEmpty(db, "users", users);
  }
}
```

### Conditional Seeding

Different data for different environments:

```ts
async run(db: Db): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    // Production: only essential data
    await this.upsertByKey(db, "settings", [
      { key: "initialized", value: true },
    ], "key");
  } else {
    // Development: test data
    await this.insertIfEmpty(db, "users", [
      { email: "test@example.com", name: "Test User", role: "user" },
      { email: "admin@example.com", name: "Admin", role: "admin" },
    ]);
  }
}
```

### Running Seeders

```bash
# Run all seeders
bun cli db:seed

# Run specific seeder
bun cli db:seed users
bun cli db:seed categories

# List available seeders
bun cli db:seed --list
```

### Seeder Order

Seeders run in alphabetical order. Prefix with numbers for specific order:

```
app/seeders/
├── 01-users.seeder.ts      # Runs first
├── 02-categories.seeder.ts # Runs second
├── 03-posts.seeder.ts      # Runs third (depends on users, categories)
└── 04-comments.seeder.ts   # Runs last (depends on posts)
```

### Best Practices

1. **Idempotent seeders** - Running multiple times produces same result
2. **Use insertIfEmpty** - Prevents duplicate data
3. **Order dependencies** - Number files for correct order
4. **Keep production separate** - Different data for dev vs prod
5. **Minimal production seeds** - Only essential data in production

## See Also

- [Migrations](./migrations.md) - Database schema migrations
- [Database Service](../core-concepts/services/database.md) - MongoDB setup
- [CLI](./cli.md) - Command-line interface
