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

- `@core` - Framework exports (`import { Controller } from "@core"`)
- `@core/*` - Direct framework file access (`import { config } from "@core/config"`)
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
import { Controller } from "@core";

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
import { Controller } from "@core";

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

## Services

Services are singletons with lifecycle hooks, loaded from `app/services/`:

```ts
// app/services/database.ts
import { Service } from "@core";

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
import { service } from "@core";
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

## CLI Commands

Commands live in `app/cli/` or `core/cli/commands/`:

```ts
// app/cli/greet.command.ts
import { Command } from "@core";

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
bun cli serve              # Start HTTP server
bun cli list               # List all commands
bun cli db:collections     # List MongoDB collections
bun cli db:query <col>     # Query a collection
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
import { env } from "@core";
const port = env("PORT", 3000);
const debug = env("DEBUG", false);

// Access config values (dot notation)
import { config } from "@core";
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
import { Middleware } from "@core";

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
import { WebSocketController } from "@core";

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
import { SseController } from "@core";

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

## Testing

```ts
// tests/example.test.ts
import { test, expect } from "bun:test";
import { startServer } from "@core";

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
bunx @core/cli init my-app
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
