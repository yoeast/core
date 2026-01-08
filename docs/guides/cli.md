# CLI

> Build command-line tools with Laravel-style signatures.

## TL;DR

```ts
// app/cli/greet.command.ts
import { Command } from "@core";

export default class GreetCommand extends Command {
  static signature = "greet {name} {--loud}";
  static description = "Greet someone";

  async handle() {
    const name = this.argument("name");
    const loud = this.option("loud");
    
    const msg = `Hello, ${name}!`;
    this.io.success(loud ? msg.toUpperCase() : msg);
    
    return 0;
  }
}
```

```bash
bun cli greet John --loud
# ✓ HELLO, JOHN!
```

## Quick Reference

### File Naming
| Pattern | Location |
|---------|----------|
| `*.command.ts` | `app/cli/` |
| Built-in commands | `core/cli/commands/` |

### Signature Syntax
| Pattern | Type | Example |
|---------|------|---------|
| `{name}` | Required argument | `{email}` |
| `{name?}` | Optional argument | `{name?}` |
| `{name=default}` | Argument with default | `{name=World}` |
| `{name*}` | Array argument | `{files*}` |
| `{--flag}` | Boolean option | `{--verbose}` |
| `{--o\|option}` | Option with alias | `{--f\|force}` |
| `{--name=}` | Option with value | `{--limit=}` |
| `{--name=default}` | Option with default | `{--limit=10}` |

### IO Methods
| Method | Description |
|--------|-------------|
| `writeln(text)` | Print line |
| `info(text)` | Blue info message |
| `success(text)` | Green success message |
| `warning(text)` | Yellow warning |
| `error(text)` | Red error |
| `table(headers, rows)` | Print table |
| `ask(question)` | Prompt for input |
| `confirm(question)` | Yes/no prompt |
| `choice(q, options)` | Multiple choice |

## Guide

### Creating Commands

Commands go in `app/cli/` with `.command.ts` extension:

```ts
// app/cli/users/create.command.ts
import { Command } from "@core";

export default class CreateUserCommand extends Command {
  static signature = "users:create {email} {--admin}";
  static description = "Create a new user";

  async handle() {
    const email = this.argument("email") as string;
    const isAdmin = this.option("admin") as boolean;
    
    // Create user...
    this.io.success(`Created user: ${email}`);
    
    return 0; // Exit code
  }
}
```

### Arguments

```ts
// Required argument
static signature = "greet {name}";
const name = this.argument("name"); // string

// Optional argument
static signature = "greet {name?}";
const name = this.argument("name"); // string | undefined

// With default
static signature = "greet {name=World}";
const name = this.argument("name"); // string, defaults to "World"

// Array argument (collects remaining args)
static signature = "process {files*}";
const files = this.argument("files"); // string[]
```

### Options

```ts
// Boolean flag
static signature = "deploy {--force}";
const force = this.option("force"); // boolean

// Short alias
static signature = "deploy {--f|force}";
// --force or -f work the same

// Option with value
static signature = "list {--limit=}";
const limit = this.option("limit"); // string | undefined

// Option with default
static signature = "list {--limit=10}";
const limit = this.option("limit"); // string, defaults to "10"

// Multiple options
static signature = "build {--env=} {--verbose} {--w|watch}";
```

### Output Methods

```ts
async handle() {
  // Plain output
  this.io.writeln("Plain text");
  this.io.write("No newline");
  this.io.newLine(2);
  
  // Styled output
  this.io.info("ℹ Information");      // Blue
  this.io.success("✓ Success");        // Green
  this.io.warning("⚠ Warning");        // Yellow
  this.io.error("✗ Error");            // Red
  this.io.comment("// Comment");       // Gray
  
  return 0;
}
```

### Tables

```ts
async handle() {
  this.io.table(
    ["ID", "Name", "Email"],
    [
      ["1", "John", "john@example.com"],
      ["2", "Jane", "jane@example.com"],
    ]
  );
  
  return 0;
}
```

Output:
```
┌────┬──────┬──────────────────┐
│ ID │ Name │ Email            │
├────┼──────┼──────────────────┤
│ 1  │ John │ john@example.com │
│ 2  │ Jane │ jane@example.com │
└────┴──────┴──────────────────┘
```

### User Input

```ts
async handle() {
  // Text input
  const name = await this.io.ask("What is your name?");
  const email = await this.io.ask("Email?", "default@example.com");
  
  // Password (hidden)
  const password = await this.io.secret("Password?");
  
  // Yes/No
  const confirmed = await this.io.confirm("Continue?", false);
  
  // Multiple choice
  const env = await this.io.choice("Environment?", ["dev", "staging", "prod"]);
  
  return 0;
}
```

### Exit Codes

```ts
async handle() {
  try {
    await doSomething();
    return 0; // Success
  } catch (error) {
    this.io.error(`Failed: ${error.message}`);
    return 1; // Error
  }
}
```

### Progress Updates

```ts
async handle() {
  const items = getItems();
  
  for (let i = 0; i < items.length; i++) {
    await processItem(items[i]);
    this.io.writeln(`Processing ${i + 1}/${items.length}...`);
  }
  
  this.io.success(`Processed ${items.length} items`);
  return 0;
}
```

## See Also

- [Built-in Commands](./cli/built-in.md) - Available commands
- [Skills](./skills.md) - AI-invokable commands
- [Migrations](./migrations.md) - Database migration commands
