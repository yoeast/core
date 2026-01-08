# Storage Directory

> Runtime files, logs, cache, and database data.

## TL;DR

```
storage/
├── logs/       # Application logs
└── views/      # Precompiled view cache
```

## Structure

| Directory | Purpose | Gitignored |
|-----------|---------|------------|
| `storage/logs/` | Log files | Yes |
| `storage/views/` | Compiled templates | Yes |

## Guide

### Cache Storage

Cache storage depends on the configured driver:

- `lru` stores data in memory (no disk usage)
- `redis` stores data in Redis (external service)

### Logs Directory

Application log files:

```
storage/logs/
├── app.log        # Application logs
├── error.log      # Error logs
└── access.log     # HTTP access logs
```

Configure log file location:
```ts
import { Logger, FileDriver } from "@yoeast/core";

const logger = new Logger({
  level: "info",
  drivers: [
    new FileDriver({ path: "storage/logs/app.log" }),
  ],
});
```

### Views Directory

Precompiled Handlebars templates:

```
storage/views/
├── pages/
│   └── home.js    # Compiled template
└── partials/
    └── nav.js     # Compiled partial
```

Enable view caching:
```ts
// app/config/views.ts
export default {
  cache: true,           // Enable caching
  cachePath: "storage/views",
};
```

### Gitignore

The `storage/` directory contents are gitignored:

```gitignore
# .gitignore
storage/logs/*
storage/views/*

# Keep directory structure
!storage/logs/.gitkeep
!storage/views/.gitkeep
```

### Accessing Storage Paths

```ts
import { join } from "path";

// Get storage paths
const logsPath = join(process.cwd(), "storage/logs");
const viewsPath = join(process.cwd(), "storage/views");
```

### Permissions

Ensure the storage directory is writable:

```bash
chmod -R 755 storage/
```

## See Also

- [Logging](./logging.md) - Application logging
- [Cache](./cache.md) - Caching system
- [Configuration](./config.md) - Config files
