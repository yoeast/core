# Built-in Commands

> Commands included with Core.

## TL;DR

```bash
bun cli serve          # Start HTTP server
bun cli list           # List all commands
bun cli routes:list    # Show all routes
bun cli cache:clear    # Clear cache
```

## Server Commands

### serve

Start the HTTP server.

```bash
bun cli serve
bun cli serve --port=8080
bun cli serve --host=0.0.0.0
bun cli serve --dev
bun cli serve --plain
```

| Option | Default | Description |
|--------|---------|-------------|
| `--port` | `3000` | Port to listen on |
| `--host` | `0.0.0.0` | Host to bind to |
| `--dev` | `false` | Enable development mode |
| `--plain` | `false` | Use plain nginx-style logs |

### list

List all available commands.

```bash
bun cli list
```

### routes:list

List all registered routes.

```bash
bun cli routes:list
bun cli routes:list --json
```

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

Output:
```
Method  Path              Type       Controller
────────────────────────────────────────────────
GET     /                 HTTP       HomeController
GET     /api/users        HTTP       ListUsersController
POST    /api/users        HTTP       CreateUserController
GET     /api/users/[id]   HTTP       GetUserController
WS      /chat             WebSocket  ChatController
SSE     /events           SSE        EventsController
```

## Cache Commands

### cache:clear

Clear the application cache.

```bash
bun cli cache:clear           # Prompts for confirmation
bun cli cache:clear --force   # No confirmation
bun cli cache:clear --tags=users,posts  # Clear specific tags only
```

| Option | Description |
|--------|-------------|
| `--force` | Skip confirmation prompt |
| `--tags` | Clear only entries with these tags (comma-separated) |

## Database Commands

### migrate

Run pending database migrations.

```bash
bun cli migrate
```

### migrate:status

Show migration status.

```bash
bun cli migrate:status
```

Output:
```
Executed migrations:
  [1] 2024_01_01_000001_create_users_indexes (2024-01-01)
  [1] 2024_01_02_000001_add_email_verification (2024-01-02)

Pending migrations:
  [ ] 2024_01_03_000001_create_posts_collection
```

### migrate:rollback

Rollback the last migration batch.

```bash
bun cli migrate:rollback
```

### db:seed

Run database seeders.

```bash
bun cli db:seed              # Run all seeders
bun cli db:seed users        # Run specific seeder
bun cli db:seed --list       # List available seeders
```

### db:collections

List MongoDB collections.

```bash
bun cli db:collections
```

### db:query

Query a MongoDB collection.

```bash
bun cli db:query users
bun cli db:query users --filter='{"role":"admin"}'
bun cli db:query users --fields=email,name --limit=10
```

| Option | Description |
|--------|-------------|
| `--filter` | MongoDB filter (JSON) |
| `--fields` | Fields to return (comma-separated) |
| `--limit` | Maximum results |
| `--sort` | Sort field (prefix `-` for descending) |

## Skill Commands

### skill:list

List available skills.

```bash
bun cli skill:list
```

### skill:run

Run a skill.

```bash
bun cli skill:run greeting --name=John --formal=true
bun cli skill:run my-skill --payload='{"limit":10}'
```

## See Also

- [CLI](../cli.md) - Creating custom commands
- [Migrations](../migrations.md) - Database migrations
- [Seeders](../seeders.md) - Database seeding
