# Core Framework - AI Agent Guidelines

This is **Core**, a Bun-based web framework inspired by Laravel/Symfony with file-based routing.

## Bun Conventions

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Bun automatically loads `.env`, so don't use dotenv

## Project Structure

```
.claude/skills/                # AI agent skills (modular capabilities)
  user-management/      # Example skill
    SKILL.md            # Skill documentation and usage
    handler.ts          # Skill implementation

app/                    # User application code
  cli/                  # Custom CLI commands (*.command.ts)
  config/               # Config overrides (*.ts exports object)
  cron/                 # Cron jobs (*.daily.ts, *.hourly.ts, etc.)
  middleware/           # HTTP middleware
  models/               # Mongoose models
  queue/                # Queue jobs (*.job.ts)
  routes/               # HTTP routes (file-based routing)
  services/             # Services (database, etc.)
  views/                # Handlebars templates
    layouts/            # Layout templates
    pages/              # Page templates
    partials/           # Partial templates
    plugins/            # Handlebars helpers

core/                   # Framework code (don't modify unless extending framework)
  bin/                  # CLI binary
  cli/                  # CLI framework
  config/               # Config system
  views/                # View system + built-in helpers

public/                 # Static files (served directly)
storage/                # Runtime storage (gitignored contents)
  cache/                # Cache files
  data/                 # Database data (MongoDB, Redis)
  logs/                 # Log files
  views/                # Precompiled view cache

tests/                  # Test files
```

## Path Aliases

- `@yoeast/core` - Framework exports (`import { Controller } from "@yoeast/core"`)
- `@yoeast/core/*` - Direct framework file access (`import { config } from "@yoeast/core/config"`)
- `@app` - App directory (`import { User } from "@app/models/User"`)
- `@app/*` - Direct app file access

## File-Based Routing

Routes are defined by file location and name:

```
app/routes/
  index.get.ts          → GET /
  users.get.ts          → GET /users
  users.post.ts         → POST /users
  users/[id].get.ts     → GET /users/:id
  users/[id].put.ts     → PUT /users/:id
  api/health.get.ts     → GET /api/health
  files/[...path].get.ts → GET /files/* (catch-all)
```

### Route File Template

```ts
import { Controller } from "@yoeast/core";

export default class MyController extends Controller {
  async handle() {
    // Access request data
    const params = this.getParams();           // Route params
    const query = this.getQueryObject();       // Query string
    const body = await this.getBodyJson();     // JSON body
    
    // Return responses
    return this.json({ data: "value" });       // JSON response
    return this.text("Hello");                 // Text response
    return this.redirect("/other");            // Redirect
    return this.render("home", { title: "Hi" }); // Handlebars view
  }
}
```

### Route Parameter Matchers

```
[id].get.ts             # Any value
[id:number].get.ts      # Numbers only
[slug:slug].get.ts      # URL-safe slugs
[uuid:uuid].get.ts      # UUIDs
[...path].get.ts        # Catch-all (wildcard)
```

## Controllers

Controllers extend `Controller` and implement `handle()`:

```ts
import { Controller } from "@yoeast/core";

export default class UsersController extends Controller {
  // Optional: validation schema
  schema = {
    params: z.object({ id: z.string() }),
    query: z.object({ page: z.number().optional() }),
    body: z.object({ name: z.string() }),
  };
  
  // Lifecycle hooks
  async before(req: Request) { /* runs before handle */ }
  async after(req: Request, res: Response) { /* runs after handle */ }
  
  async handle() {
    // Validated data (if schema defined)
    const params = this.getValidatedParams();
    const query = this.getValidatedQuery();
    const body = this.getValidatedBody();
    
    // Request helpers
    this.getRequest();                    // Raw Request object
    this.getHeader("Authorization");      // Get header
    this.getCookie("session");            // Get cookie
    this.setCookie("session", "value");   // Set cookie
    
    // Response helpers
    this.status(201);                     // Set status code
    this.setHeader("X-Custom", "value");  // Set header
    return this.json({ success: true });
  }
}
```

## CORS (Cross-Origin Resource Sharing)

CORS is configured per-controller using the `cors` property:

```ts
import { Controller } from "@yoeast/core";
import type { CorsOptions } from "@yoeast/core";

export default class ApiController extends Controller {
  // Enable CORS with defaults (allows all origins)
  protected cors = true;
  
  async handle() {
    return this.json({ data: "value" });
  }
}
```

Custom CORS configuration:

```ts
export default class ApiController extends Controller {
  protected cors: CorsOptions = {
    origin: ["https://example.com", "https://app.example.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Total-Count"],
    maxAge: 86400, // 24 hours
  };
  
  async handle() {
    return this.json({ data: "value" });
  }
}
```

CORS options:
- `origin` - `"*"` | `string` | `string[]` | `(origin: string) => boolean`
- `methods` - Allowed HTTP methods (default: GET, HEAD, PUT, PATCH, POST, DELETE)
- `allowedHeaders` - Headers the client can send (default: Content-Type, Authorization, X-Requested-With)
- `exposedHeaders` - Headers exposed to the browser
- `credentials` - Allow cookies/auth headers (default: false)
- `maxAge` - Preflight cache duration in seconds (default: 86400)

Default CORS config can be set in `app/config/cors.ts`:

```ts
export default {
  origin: "*",
  credentials: false,
  maxAge: 86400,
};
```

## Resource Hints (Preload, Preconnect)

Optimize page loading with resource hints via HTTP `Link` headers. Browsers start fetching resources as soon as they receive headers, before the body streams.

> **Note:** HTTP 103 Early Hints not yet supported by Bun.serve ([tracking issue](https://github.com/oven-sh/bun/issues/8690)). Link headers provide similar benefits.

### Global Configuration

Define always-needed resources in `app/config/hints.ts`:

```ts
export default {
  // Resources to preload on every page
  preload: [
    { href: "/css/app.css", as: "style" },
    { href: "/fonts/inter.woff2", as: "font", crossorigin: true },
    { href: "/js/app.js", as: "script" },
  ],
  
  // Origins to preconnect to
  preconnect: [
    { href: "https://api.example.com" },
    { href: "https://cdn.example.com", crossorigin: true },
  ],
  
  // Resources to prefetch (low priority)
  prefetch: [
    { href: "/api/user" },
  ],
  
  // DNS to prefetch
  dnsPrefetch: [
    { href: "https://analytics.example.com" },
  ],
};
```

### Controller Hints

Add page-specific hints in controllers:

```ts
export default class ProductController extends Controller {
  async handle() {
    // Preload page-specific resources
    this.preload("/css/product.css", "style");
    this.preload("/images/hero.webp", "image", { fetchpriority: "high" });
    
    // Preconnect to APIs this page uses
    this.preconnect("https://reviews-api.example.com");
    
    // Prefetch likely next navigation
    this.prefetch("/api/related-products");
    
    return this.render("product", { ... });
  }
}
```

### Handlebars Helpers

Generate `<link>` tags in templates:

```html
<head>
  {{! Preload critical resources }}
  {{preload "/css/app.css" as="style"}}
  {{preload "/fonts/inter.woff2" as="font" crossorigin=true}}
  
  {{! Preconnect to APIs }}
  {{preconnect "https://api.example.com"}}
  
  {{! Prefetch next page resources }}
  {{prefetch "/next-page.html"}}
  
  {{! DNS prefetch }}
  {{dnsPrefetch "https://analytics.example.com"}}
  
  {{! Render all hints from array }}
  {{resourceHints hints}}
</head>
```

### Resource Types

For `preload`, the `as` attribute specifies the resource type:
- `style` - CSS stylesheets
- `script` - JavaScript files
- `font` - Web fonts (requires `crossorigin`)
- `image` - Images
- `fetch` - Data fetched via fetch/XHR
- `document` - HTML documents
- `audio`, `video` - Media files

## Services

Services are singletons with lifecycle hooks, loaded from `app/services/`:

```ts
// app/services/database.ts
import { Service } from "@yoeast/core";

export default class DatabaseService extends Service {
  connection!: SomeClient;
  
  async boot() {
    this.connection = await SomeClient.connect();
  }
  
  async shutdown() {
    await this.connection.close();
  }
}

// Usage anywhere:
import { service } from "@yoeast/core";
const db = service<DatabaseService>("database");
```

## Models (Mongoose)

Models live in `app/models/`:

```ts
// app/models/User.ts
import { Schema, model, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
```

## API Controllers

For API endpoints, use `ApiController` with Zod schemas for input/output validation:

```ts
// app/routes/api/users/[id].get.ts
import { z } from "zod";
import { ApiController } from "@yoeast/core";
import { User } from "@app/models/User";

export default class GetUserController extends ApiController {
  // Input schema (params + query + body merged)
  static override input = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
  });

  // Response schemas by status code
  static override responses = {
    200: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().nullable(),
      }),
    }),
    404: z.object({
      error: z.string(),
      message: z.string(),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { id } = this.input; // Typed and validated
    const user = await User.findById(id);

    if (!user) {
      return this.response(404, { error: "NotFound", message: "User not found" });
    }

    return this.response(200, {
      user: { id: user.id, email: user.email, name: user.name ?? null },
    });
  }
}
```

### API Authentication

```ts
export default class ProtectedController extends ApiController {
  protected override apiProtected = true;
  protected override apiScopes = ["admin"]; // Optional: require scopes

  static override responses = {
    200: z.object({ data: z.string() }),
  };

  protected override async handle(): Promise<Response> {
    const clientId = this.getClientId();
    return this.response(200, { data: `Hello ${clientId}` });
  }
}
```

### OpenAPI Generation

API routes auto-generate OpenAPI specs available at `/api/openapi.json`.

## Migrations

Database schema migrations in `app/migrations/`:

```ts
// app/migrations/2026_01_07_000001_create_users_indexes.ts
import type { Db } from "mongodb";
import { Migration } from "@yoeast/core";

export default class CreateUsersIndexes extends Migration {
  async up(db: Db): Promise<void> {
    await this.createIndex(db, "users", { email: 1 }, { unique: true });
  }

  async down(db: Db): Promise<void> {
    await this.dropIndex(db, "users", "email_1");
  }
}
```

### Migration Helpers

- `createIndex(db, collection, index, options)` - Create index
- `dropIndex(db, collection, indexName)` - Drop index
- `addField(db, collection, field, defaultValue)` - Add field to all docs
- `removeField(db, collection, field)` - Remove field from all docs
- `renameField(db, collection, oldName, newName)` - Rename field

## Seeders

Database seeders in `app/seeders/`:

```ts
// app/seeders/users.seeder.ts
import type { Db } from "mongodb";
import { Seeder } from "@yoeast/core";

export default class UsersSeeder extends Seeder {
  async run(db: Db): Promise<void> {
    await this.insertIfEmpty(db, "users", [
      { email: "admin@example.com", name: "Admin", role: "admin" },
    ]);
  }
}
```

### Seeder Helpers

- `insertIfEmpty(db, collection, docs)` - Insert only if empty
- `upsertByKey(db, collection, docs, keyField)` - Upsert by key
- `truncate(db, collection)` - Clear collection

## CLI Commands

Commands live in `app/cli/` or `core/cli/commands/`:

```ts
// app/cli/greet.command.ts
import { Command } from "@yoeast/core";

export default class GreetCommand extends Command {
  static signature = "greet {name} {--loud}";
  static description = "Greet someone";
  
  async handle() {
    const name = this.argument<string>("name");
    const loud = this.option<boolean>("loud");
    
    const greeting = `Hello, ${name}!`;
    this.io.success(loud ? greeting.toUpperCase() : greeting);
    
    return 0; // Exit code
  }
}
```

### Built-in Commands

```bash
# Server
bun cli serve              # Start HTTP server
bun cli list               # List all commands
bun cli routes:list        # List all routes

# Database
bun cli db:collections     # List MongoDB collections
bun cli db:query <col>     # Query a collection
bun cli migrate            # Run pending migrations
bun cli migrate:status     # Show migration status
bun cli migrate:rollback   # Rollback last batch
bun cli db:seed            # Run all seeders
bun cli db:seed <name>     # Run specific seeder
bun cli db:seed --list     # List available seeders

# Cache
bun cli cache:clear        # Clear all cache (prompts for confirmation)
bun cli cache:clear --force  # Clear without confirmation
bun cli cache:clear --tags=users,posts  # Clear by tags only

# Skills
bun cli skill:list         # List available skills
bun cli skill:run <name>   # Run a skill
```

## Logging

Pluggable logging system with multiple drivers and log levels:

```ts
import { log } from "@yoeast/core";

// Basic logging
log.info("User logged in", { userId: 123 });
log.warn("Rate limit approaching");
log.error("Failed to connect", error);
log.debug("Processing request", { path: "/api/users" });

// Set log level at runtime
log.setLevel("debug");  // Show all logs
log.setLevel("warn");   // Only warn and error
```

### Log Levels

- `debug` - Detailed debugging information
- `info` - General information (default)
- `warn` - Warning conditions
- `error` - Error conditions

### Custom Logger Configuration

```ts
import { Logger, StdoutDriver, FileDriver } from "@yoeast/core";

const logger = new Logger({
  level: "debug",
  drivers: [
    new StdoutDriver({ colors: true }),
    new FileDriver({ path: "storage/logs/app.log" }),
  ],
});

logger.info("Custom logger ready");
```

### Custom Drivers

Create custom log drivers by implementing `LogDriver`:

```ts
// app/loggers/slack.ts
import type { LogDriver, LogEntry } from "@yoeast/core";

export class SlackDriver implements LogDriver {
  readonly name = "slack";
  
  async log(entry: LogEntry): Promise<void> {
    if (entry.level === "error") {
      await fetch(webhookUrl, {
        method: "POST",
        body: JSON.stringify({ text: `🔴 ${entry.message}` }),
      });
    }
  }
}
```

### Configuration

Default level set via `LOG_LEVEL` environment variable or in `app/config/logging.ts`:

```ts
export default {
  level: "info",
};
```

## Views (Handlebars)

Templates use Handlebars syntax:

```html
<!-- app/views/pages/home.html -->
<h1>{{title}}</h1>

{{#if user}}
  <p>Welcome, {{user.name}}!</p>
{{/if}}

{{#each items}}
  <li>{{this}}</li>
{{/each}}
```

```html
<!-- app/views/layouts/main.html -->
<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body>
  {{{content}}}  <!-- Triple braces for unescaped HTML -->
</body>
</html>
```

### View Helpers

Custom helpers go in `app/views/plugins/`:

```ts
// app/views/plugins/uppercase.ts
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  hbs.registerHelper("uppercase", (str: string) => str.toUpperCase());
}
```

## Configuration

Config uses `env()` and `config()`:

```ts
// Access environment variables
import { env } from "@yoeast/core";
const port = env("PORT", 3000);
const debug = env("DEBUG", false);

// Access config values (dot notation)
import { config } from "@yoeast/core";
const appName = config("app.name");
const dbUri = config("database.uri");
```

Config files in `app/config/` merge with core defaults:

```ts
// app/config/app.ts
export default {
  name: "My App",
  customSetting: true,
};
```

## Middleware

```ts
// app/middleware/auth.ts
import { Middleware } from "@yoeast/core";

export default class AuthMiddleware extends Middleware {
  async handle(req: Request, next: () => Promise<Response>) {
    const token = req.headers.get("Authorization");
    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }
    return next();
  }
}
```

## WebSocket Routes

```ts
// app/routes/chat.ws.ts
import { WebSocketController } from "@yoeast/core";

export default class ChatController extends WebSocketController {
  open(ws: ServerWebSocket) {
    ws.send("Connected!");
  }
  
  message(ws: ServerWebSocket, msg: string | Buffer) {
    ws.send(`Echo: ${msg}`);
  }
  
  close(ws: ServerWebSocket) {
    console.log("Disconnected");
  }
}
```

## SSE Routes

```ts
// app/routes/events.sse.ts
import { SseController } from "@yoeast/core";

export default class EventsController extends SseController {
  async stream() {
    await this.send("connected", { time: Date.now() });
    
    // Send events over time
    for (let i = 0; i < 10; i++) {
      await this.send("tick", { count: i });
      await Bun.sleep(1000);
    }
  }
}
```

## Cache System

Multi-driver caching with LRU (default) and Redis support. Includes tags for bulk invalidation.

### Basic Usage

```ts
import { cache } from "@yoeast/core";

// Get/Set values (TTL in seconds)
await cache.set("key", { data: "value" }, 300);
const data = await cache.get<{ data: string }>("key");

// Remember pattern: get or compute
const users = await cache.remember("users:all", 600, async () => {
  return await User.find();
});

// Delete
await cache.delete("key");
await cache.clear(); // Clear all
```

### Controller Integration

Controllers have a built-in `cache` property:

```ts
import { Controller } from "@yoeast/core";

export default class UsersController extends Controller {
  async handle() {
    // Use cache.remember for automatic caching
    const users = await this.cache.remember("users:list", 300, async () => {
      return await User.find().lean();
    });
    
    return this.json(users);
  }
}
```

### Cache Tags

Group related entries for bulk invalidation:

```ts
// Set with tags
await cache.setWithTags("user:123", userData, ["users", "profile"], 300);
await cache.setWithTags("user:456", otherData, ["users"], 300);

// Tagged operations
const tagged = cache.tags(["users"]);
await tagged.set("posts:all", posts, 600);
await tagged.flush(); // Delete all entries with "users" tag
```

### Controller Response Caching

All response methods (`json()`, `text()`, `render()`) support caching with ETags:

```ts
import { Controller } from "@yoeast/core";

export default class UsersController extends Controller {
  // Default TTL for all responses (in seconds)
  protected responseCacheTtl = 300; // 5 minutes

  async handle() {
    // Uses default TTL, auto-generates cache key from URL
    return this.json({ users: [] });
    
    // Override TTL for this response
    return this.json({ users: [] }, { ttl: 60 });
    
    // Custom cache key
    return this.json({ users: [] }, { key: "users:list" });
    
    // Disable caching for this response
    return this.json({ users: [] }, { noCache: true });
    
    // Works with render() too
    return this.render("users/list", { users }, { ttl: 600 });
  }
}
```

Response headers include:
- `X-Cache: HIT` or `X-Cache: MISS` or `X-Cache: SKIP`
- `ETag` for conditional requests
- `Cache-Control: max-age=N`

### Configuration

```ts
// .env
CACHE_DRIVER=lru          # or "redis"
CACHE_PREFIX=myapp:
CACHE_TTL=3600

# Redis settings (if using redis driver)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Custom Drivers

```ts
// app/config/cache.ts
export default {
  default: "redis",
  stores: {
    redis: {
      host: "redis.example.com",
      port: 6379,
      password: "secret",
    },
  },
};
```

## Testing

```ts
// tests/example.test.ts
import { test, expect } from "bun:test";
import { startServer } from "@yoeast/core";

test("health check", async () => {
  const server = await startServer({ port: 0, silent: true });
  
  const res = await fetch(`http://localhost:${server.port}/health`);
  expect(res.status).toBe(200);
  
  const data = await res.json();
  expect(data.status).toBe("ok");
  
  server.stop();
});
```

## Development

```bash
# Start MongoDB
docker compose up -d

# Start dev server
bun run cli.ts serve

# Run tests
bun test

# Create new project
bunx @yoeast/core/cli init my-app
```

## Skills System

Skills are modular, AI-invokable capabilities stored in `.claude/skills/`. Each skill is a folder containing:
- `SKILL.md` - Documentation with usage examples and input/output schema
- `handler.ts` - Implementation that exports an `execute(input)` function

### Available Skills

```bash
# List all skills
bun cli skill:list

# Run a skill
bun cli skill:run <skill-name> --option=value
```

### Built-in Skills

**user-management** - CRUD operations for users
```bash
bun cli skill:run user-management --action=create --email=user@example.com --password=secret
bun cli skill:run user-management --action=find --email=user@example.com
bun cli skill:run user-management --action=update --id=<user_id> --name="New Name"
bun cli skill:run user-management --action=delete --id=<user_id>
```

**database-query** - Query any MongoDB collection
```bash
bun cli skill:run database-query --collection=users --limit=10
bun cli skill:run database-query --collection=users --filter='{"email":"test@example.com"}'
bun cli skill:run database-query --collection=users --fields=email,name --sort=createdAt:desc
```

**http-request** - Make HTTP requests to external APIs
```bash
bun cli skill:run http-request --url=https://api.example.com/data
bun cli skill:run http-request --url=https://api.example.com/users --method=POST --body='{"name":"John"}'
```

**migrations** - Database migration management
```bash
bun cli skill:run migrations --action=status    # Check migration status
bun cli skill:run migrations --action=run       # Run pending migrations
bun cli skill:run migrations --action=rollback  # Rollback last batch
```

**seeders** - Database seeder management
```bash
bun cli skill:run seeders --action=list         # List available seeders
bun cli skill:run seeders --action=run          # Run all seeders
bun cli skill:run seeders --action=run --name=users  # Run specific seeder
```

### Creating a New Skill

1. Create folder: `.claude/skills/my-skill/`
2. Create `SKILL.md` with documentation
3. Create `handler.ts`:

```ts
interface Input {
  action: string;
  // ... other inputs
}

interface Output {
  success: boolean;
  // ... other outputs
}

export async function execute(input: Input): Promise<Output> {
  // Implementation
  return { success: true };
}
```

Skills are the primary way AI agents interact with the system programmatically.

## Key Principles

1. **File-based routing** - URL structure mirrors file structure
2. **Convention over configuration** - Sensible defaults, override when needed
3. **Services for external resources** - Database, cache, etc. managed via Service class
4. **Handlebars for views** - Simple, logic-light templates
5. **CLI for tooling** - Database queries, migrations, scaffolding via commands
6. **Skills for AI** - Modular, documented capabilities for agent automation
7. **AI-friendly** - Clear patterns, consistent naming, easy to understand and extend
