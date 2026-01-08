# Core

A modern web framework built on [Bun](https://bun.sh) with file-based routing, inspired by Laravel and Symfony.

## Quick Start

```bash
# Install dependencies
bun install

# Start MongoDB (required)
docker compose up -d

# Run the server
bun cli serve
```

The server starts at `http://localhost:3000`.

## Project Structure

```
app/
  routes/       # HTTP routes (file-based routing)
  services/     # Database and other services
  models/       # Mongoose models
  middleware/   # HTTP middleware
  cli/          # Custom CLI commands
  views/        # Handlebars templates

core/           # Framework internals
docs/           # Documentation
tests/          # Test files
```

## File-Based Routing

Routes are defined by file location:

```
app/routes/index.get.ts        → GET /
app/routes/users.post.ts       → POST /users
app/routes/users/[id].get.ts   → GET /users/:id
```

## CLI Commands

```bash
bun cli list              # Show all commands
bun cli serve             # Start server
bun cli db:collections    # List database collections
bun cli routes:list       # List all routes
```

## Documentation

See the `docs/` directory for full documentation.
