# Testing

> Write tests with Bun's built-in test runner.

## TL;DR

```ts
// tests/example.test.ts
import { test, expect } from "bun:test";

test("adds numbers", () => {
  expect(1 + 2).toBe(3);
});
```

```bash
bun test                    # Run all tests
bun test tests/unit         # Run specific folder
bun test --watch            # Watch mode
```

## Quick Reference

### File Naming
| Pattern | Location |
|---------|----------|
| `*.test.ts` | `tests/` |
| `*.spec.ts` | `tests/` |

### Test Functions
| Function | Description |
|----------|-------------|
| `test(name, fn)` | Define a test |
| `describe(name, fn)` | Group tests |
| `beforeAll(fn)` | Run once before all tests |
| `afterAll(fn)` | Run once after all tests |
| `beforeEach(fn)` | Run before each test |
| `afterEach(fn)` | Run after each test |

### Common Matchers
| Matcher | Description |
|---------|-------------|
| `toBe(value)` | Strict equality |
| `toEqual(value)` | Deep equality |
| `toBeTruthy()` | Truthy value |
| `toBeFalsy()` | Falsy value |
| `toContain(item)` | Array/string contains |
| `toThrow(error?)` | Function throws |
| `toBeNull()` | Is null |
| `toBeUndefined()` | Is undefined |

## Guide

### Basic Tests

```ts
// tests/unit/math.test.ts
import { test, expect } from "bun:test";

test("addition", () => {
  expect(2 + 2).toBe(4);
});

test("string contains", () => {
  expect("hello world").toContain("world");
});

test("array includes", () => {
  expect([1, 2, 3]).toContain(2);
});
```

### Grouping Tests

```ts
import { describe, test, expect } from "bun:test";

describe("Calculator", () => {
  test("adds", () => {
    expect(add(1, 2)).toBe(3);
  });

  test("subtracts", () => {
    expect(subtract(5, 3)).toBe(2);
  });

  describe("edge cases", () => {
    test("handles zero", () => {
      expect(add(0, 0)).toBe(0);
    });
  });
});
```

### Setup and Teardown

```ts
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

describe("Database tests", () => {
  let db: Database;

  beforeAll(async () => {
    // Connect once before all tests
    db = await Database.connect();
  });

  afterAll(async () => {
    // Disconnect after all tests
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clear data before each test
    await db.clear();
  });

  test("creates record", async () => {
    const user = await db.createUser({ name: "John" });
    expect(user.name).toBe("John");
  });
});
```

### Testing HTTP Routes

```ts
import { test, expect, beforeAll, afterAll } from "bun:test";
import { startServer } from "@core";

let server: ReturnType<typeof startServer>;
let baseUrl: string;

beforeAll(async () => {
  server = await startServer({ port: 0, silent: true });
  baseUrl = `http://localhost:${server.port}`;
});

afterAll(() => {
  server.stop();
});

test("GET /health returns 200", async () => {
  const res = await fetch(`${baseUrl}/health`);
  expect(res.status).toBe(200);
  
  const data = await res.json();
  expect(data.status).toBe("ok");
});

test("POST /api/users creates user", async () => {
  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", name: "Test" }),
  });
  
  expect(res.status).toBe(201);
  
  const data = await res.json();
  expect(data.user.email).toBe("test@example.com");
});
```

### Testing Controllers

```ts
import { test, expect } from "bun:test";

// Import and instantiate directly
import UsersController from "@app/routes/users.get";

test("controller returns users", async () => {
  const controller = new UsersController();
  
  // Create mock request
  const req = new Request("http://localhost/users?page=1");
  
  // Run controller
  const res = await controller.run(req, {}, new URLSearchParams("page=1"));
  
  expect(res.status).toBe(200);
  
  const data = await res.json();
  expect(Array.isArray(data.users)).toBe(true);
});
```

### Async Tests

```ts
test("async operation", async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

test("promise resolves", async () => {
  await expect(Promise.resolve(42)).resolves.toBe(42);
});

test("promise rejects", async () => {
  await expect(Promise.reject(new Error("fail"))).rejects.toThrow("fail");
});
```

### Testing Errors

```ts
test("throws error", () => {
  expect(() => {
    throw new Error("Something went wrong");
  }).toThrow("Something went wrong");
});

test("throws specific error type", () => {
  expect(() => {
    throw new TypeError("Invalid type");
  }).toThrow(TypeError);
});
```

### Mocking

```ts
import { test, expect, mock } from "bun:test";

test("mocks function", () => {
  const fn = mock(() => 42);
  
  expect(fn()).toBe(42);
  expect(fn).toHaveBeenCalled();
  expect(fn).toHaveBeenCalledTimes(1);
});

test("mocks with implementation", () => {
  const fn = mock((x: number) => x * 2);
  
  expect(fn(5)).toBe(10);
  expect(fn).toHaveBeenCalledWith(5);
});
```

### Skipping and Focusing

```ts
test.skip("skipped test", () => {
  // Won't run
});

test.only("only this runs", () => {
  // Only this test runs when present
});

test.todo("not implemented yet");
```

### Test Organization

```
tests/
├── unit/                 # Unit tests
│   ├── utils.test.ts
│   ├── validation.test.ts
│   └── cache.test.ts
├── integration/          # Integration tests
│   ├── api.test.ts
│   ├── database.test.ts
│   └── routes.test.ts
├── fixtures/             # Test fixtures
│   └── app/
│       └── routes/
│           └── test.get.ts
└── helpers/              # Test utilities
    └── setup.ts
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific file
bun test tests/unit/cache.test.ts

# Run specific folder
bun test tests/unit

# Watch mode
bun test --watch

# With coverage
bun test --coverage

# Timeout per test (ms)
bun test --timeout 5000

# Run tests matching pattern
bun test --test-name-pattern "cache"
```

### Test Fixtures

Create test routes in `tests/fixtures/app/routes/`:

```ts
// tests/fixtures/app/routes/test-endpoint.get.ts
import { Controller } from "@core";

export default class TestController extends Controller {
  async handle() {
    return this.json({ test: true });
  }
}
```

Use in tests by starting server with fixtures path:

```ts
import { startServer } from "@core";
import { join } from "path";

beforeAll(async () => {
  server = await startServer({ rootDir: join(__dirname, "fixtures"), port: 0, silent: true });
});
```

## See Also

- [Controllers](../core-concepts/controllers.md) - Controller testing
- [CLI](./cli.md) - Testing commands
