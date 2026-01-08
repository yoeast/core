# Installation

> Set up a new Core project.

## TL;DR

```bash
git clone git@github.com:yoeast/core.git my-app
cd my-app
bun install
bun cli serve
```

## Requirements

- [Bun](https://bun.sh) v1.0 or later
- MongoDB (for database features)

## Quick Reference

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun cli serve` | Start dev server |
| `bun test` | Run tests |

## Guide

### 1. Clone the Starter

```bash
git clone git@github.com:yoeast/core.git my-app
cd my-app
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment

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

### 4. Start MongoDB

Using Docker:

```bash
docker compose up -d
```

Or connect to an existing MongoDB instance via `MONGODB_URI`.

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
