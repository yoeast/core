# Core Framework

A modern, fast, and developer-friendly web framework built on [Bun](https://bun.sh). Inspired by Laravel and Symfony, Core provides an elegant API with file-based routing, built-in caching, and first-class TypeScript support.

## Features

- 🚀 **Fast** - Built on Bun for maximum performance
- 📁 **File-based Routing** - URL structure mirrors your file structure
- 🎯 **TypeScript First** - Full type safety out of the box
- 💾 **Multi-driver Caching** - LRU and Redis support with response caching
- 🔐 **API Authentication** - Token-based API protection with scopes
- 🖼️ **Handlebars Views** - Simple, logic-light templating
- 🔌 **Services** - Singleton services with lifecycle hooks
- 🛠️ **CLI Tools** - Built-in commands and custom command support
- 🤖 **AI-Friendly** - Skills system for automation

## Quick Start

```bash
bun create yoeast/core my-app
cd my-app
docker compose up -d
bun install
bun cli serve
```

## Project Structure

```
my-app/
├── app/
│   ├── cli/           # Custom CLI commands
│   ├── config/        # Configuration overrides
│   ├── middleware/    # HTTP middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # HTTP routes (file-based)
│   ├── services/      # Singleton services
│   └── views/         # Handlebars templates
├── public/            # Static files
├── storage/           # Runtime storage
└── tests/             # Test files
```

## Your First Route

Create `app/routes/hello.get.ts`:

```typescript
import { Controller } from "@yoeast/core";

export default class HelloController extends Controller {
  async handle() {
    return this.json({ message: "Hello, World!" });
  }
}
```

Visit `http://localhost:3000/hello` to see your response.

## Documentation

### Getting Started
- [Installation](./getting-started/installation.md) - Project setup
- [Configuration](./guides/config.md) - Environment and config files

### Core Concepts
- [Routing](./core-concepts/routing.md) - File-based routing
- [Controllers](./core-concepts/controllers.md) - Request handling
- [Models](./core-concepts/models.md) - Mongoose models
- [Services](./core-concepts/services.md) - Singleton services
- [Views](./core-concepts/views.md) - Handlebars templates
- [Middleware](./core-concepts/middleware.md) - Request/response middleware

### Guides
- [CLI](./guides/cli.md) - Command-line tools
- [Cache](./guides/cache.md) - Caching system
- [Migrations](./guides/migrations.md) - Database migrations
- [Seeders](./guides/seeders.md) - Database seeding
- [Testing](./guides/testing.md) - Writing tests
- [Logging](./guides/logging.md) - Application logging
- [Skills](./guides/skills.md) - AI automation

### Deep Dives
- [Request Data](./core-concepts/controllers/request-data.md) - Params, query, body
- [Responses](./core-concepts/controllers/responses.md) - JSON, HTML, redirects
- [Validation](./core-concepts/controllers/validation.md) - Schema validation
- [Response Caching](./core-concepts/controllers/caching.md) - ETags and caching
- [CORS](./core-concepts/controllers/cors.md) - Cross-origin requests
- [Resource Hints](./core-concepts/controllers/hints.md) - Preload, preconnect
- [WebSocket](./core-concepts/routes/websocket.md) - Real-time connections
- [SSE](./core-concepts/routes/sse.md) - Server-sent events

### Reference
- [API Controllers](./api-reference/api-controller.md) - Schema-driven APIs
- [Built-in Commands](./guides/cli/built-in.md) - Available CLI commands
- [View Helpers](./core-concepts/views/helpers.md) - Template helpers
- [Storage](./guides/storage.md) - Storage directory
- [Public](./guides/public.md) - Static files

## Requirements

- [Bun](https://bun.sh) v1.0 or later
- Docker (for MongoDB and Redis)

## License

MIT
