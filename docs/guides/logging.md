# Logging

> Pluggable logging system with colored console output and file logging.

## TL;DR

```ts
import { log } from "@yoeast/core";

log.info("User logged in", { userId: "123" });
log.error("Payment failed", new Error("declined"), { orderId: "456" });
```

## Quick Reference

### Log Levels

| Level | Method | Color | Use For |
|-------|--------|-------|---------|
| `debug` | `log.debug()` | Gray | Development debugging |
| `info` | `log.info()` | Blue | General information |
| `warn` | `log.warn()` | Yellow | Warnings, deprecations |
| `error` | `log.error()` | Red | Errors, exceptions |

### Method Signatures

```ts
log.debug(message: string, context?: Record<string, unknown>): void
log.info(message: string, context?: Record<string, unknown>): void
log.warn(message: string, context?: Record<string, unknown>): void
log.error(message: string, error?: Error, context?: Record<string, unknown>): void
```

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | `LogLevel` | `"info"` | Minimum level to log |
| `drivers` | `LogDriver[]` | `[StdoutDriver]` | Where to send logs |

## Guide

### Basic Logging

```ts
import { log } from "@yoeast/core";

log.debug("Verbose debugging info");
log.info("Server started", { port: 3000 });
log.warn("Deprecated API called");
log.error("Database connection failed", error, { host: "db.example.com" });
```

### Error Logging

The `error` method accepts an optional Error object as the second argument:

```ts
try {
  await doSomething();
} catch (err) {
  log.error("Operation failed", err, { operation: "doSomething" });
}
```

### Log Levels

Logs are filtered by level. Setting level to `"warn"` only shows `warn` and `error`:

```
debug (0) → info (1) → warn (2) → error (3)
```

```ts
log.setLevel("warn"); // Only warn and error logs
log.setLevel("debug"); // All logs
```

### Configure in Code

```ts
import { initLogger, StdoutDriver, FileDriver } from "@yoeast/core";

initLogger({
  level: "debug",
  drivers: [
    new StdoutDriver(),
    new FileDriver({ path: "storage/logs/app.log" }),
  ],
});
```

### File Logging

The FileDriver writes plain text logs with timestamps:

```ts
import { Logger, FileDriver } from "@yoeast/core";

const logger = new Logger({
  level: "info",
  drivers: [
    new FileDriver({ path: "storage/logs/app.log" }),
  ],
});

logger.info("Application started");
```

Output format:
```
[2024-01-15T10:30:00.000Z] INFO  Message {"context":"data"}
[2024-01-15T10:30:01.000Z] ERROR Failed to connect
Error: Connection refused
    at connect (file.ts:10:5)
```

### Custom Logger Instance

```ts
import { Logger, StdoutDriver } from "@yoeast/core";

const auditLog = new Logger({
  level: "info",
  drivers: [new StdoutDriver()],
});

auditLog.info("User action", { action: "delete", target: "post:123" });
```

## API Reference

### Logger Class

```ts
class Logger {
  constructor(options: LoggerOptions);
  
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  addDriver(driver: LogDriver): void;
  removeDriver(name: string): void;
}
```

### LoggerOptions

```ts
interface LoggerOptions {
  level?: LogLevel;      // Minimum level to log
  drivers?: LogDriver[]; // Output drivers
}

type LogLevel = "debug" | "info" | "warn" | "error";
```

### Built-in Drivers

#### StdoutDriver

Colored console output with timestamps.

```ts
new StdoutDriver()
```

#### FileDriver

Plain text file logging with timestamps.

```ts
new FileDriver({ 
  path: string,           // Log file path
  level?: LogLevel,       // Minimum level for this driver
  includeContext?: boolean // Include JSON context (default: true)
})
```

### Custom Driver

```ts
import type { LogDriver, LogEntry } from "@yoeast/core";

class MyDriver implements LogDriver {
  readonly name = "my-driver";
  
  log(entry: LogEntry): void {
    // entry.timestamp - Date object
    // entry.level - "debug" | "info" | "warn" | "error"
    // entry.message - string
    // entry.context - Record<string, unknown> | undefined
    // entry.error - Error | undefined (for error level)
  }
}
```

## See Also

- [Configuration](./config.md) - Environment variables
- [Services](../core-concepts/services.md) - Using logging in services
