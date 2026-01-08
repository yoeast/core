# Installation

> Set up a new Core project.

## TL;DR

```bash
bun create yoeast/core my-app
cd my-app
docker compose up -d
bun install
bun cli serve
```

## Requirements

- [Bun](https://bun.sh) v1.0 or later
- Docker (for MongoDB and Redis)

## Quick Reference

| Command | Description |
|---------|-------------|
| `bun create yoeast/core my-app` | Create new project |
| `bun install` | Install dependencies |
| `bun cli serve` | Start dev server |
| `bun test` | Run tests |

## Guide

### 1. Create a New Project

```bash
bun create yoeast/core my-app
cd my-app
```

### 2. Start Services

Start MongoDB and Redis using Docker:

```bash
docker compose up -d
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Configure Environment (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# .env
APP_NAME="My App"
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/myapp
```

### 5. Start the Server

```bash
bun cli serve
```

Visit http://localhost:3000 to see your app.

### 6. Create Your First Route

Create `app/routes/hello.get.ts`:

```ts
import { Controller } from "@core";

export default class HelloController extends Controller {
  async handle() {
    return this.json({ message: "Hello, World!" });
  }
}
```

Visit http://localhost:3000/hello to see the response.

## Project Structure

```
my-app/
├── app/
│   ├── cli/           # Custom CLI commands
│   ├── config/        # Configuration overrides
│   ├── models/        # Mongoose models
│   ├── routes/        # HTTP routes (file-based)
│   ├── services/      # Singleton services
│   └── views/         # Handlebars templates
├── public/            # Static files
├── storage/           # Runtime storage (logs, cache)
├── tests/             # Test files
├── .env               # Environment variables
└── docker-compose.yml # Docker services
```

## Next Steps

- [Configuration](../guides/config.md) - Environment and config files
- [Routing](../core-concepts/routing.md) - File-based routing
- [Controllers](../core-concepts/controllers.md) - Handling requests

## See Also

- [Configuration](../guides/config.md)
- [CLI Commands](../guides/cli/built-in.md)
