/**
 * Tests for CLI Runner.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import { Runner } from "@yoeast/core/cli/runner";
import { Command } from "@yoeast/core/cli/command";

// Test commands
class HelloCommand extends Command {
  static signature = "hello {name}";
  static description = "Say hello";

  async handle(): Promise<number> {
    return 0;
  }
}

class GoodbyeCommand extends Command {
  static signature = "goodbye {--formal}";
  static description = "Say goodbye";

  async handle(): Promise<number> {
    return 0;
  }
}

class NamespacedCommand extends Command {
  static signature = "users:create {email}";
  static description = "Create a user";

  async handle(): Promise<number> {
    return 0;
  }
}

class AnotherNamespacedCommand extends Command {
  static signature = "users:delete {id}";
  static description = "Delete a user";

  async handle(): Promise<number> {
    return 0;
  }
}

class FailingCommand extends Command {
  static signature = "fail";
  static description = "Always fails";

  async handle(): Promise<number> {
    throw new Error("Command failed intentionally");
  }
}

class ExitCodeCommand extends Command {
  static signature = "exit {code}";
  static description = "Return specific exit code";

  async handle(): Promise<number> {
    const code = parseInt(this.argument("code") as string, 10);
    return code;
  }
}

class RequiredArgCommand extends Command {
  static signature = "required {name}";
  static description = "Has required arg";

  async handle(): Promise<number> {
    return 0;
  }
}

class AllowUnknownCommand extends Command {
  static signature = "passthrough {--known=}";
  static description = "Allows unknown options";
  static allowUnknownOptions = true;

  async handle(): Promise<number> {
    return 0;
  }
}

describe("CLI Runner", () => {
  let runner: Runner;

  beforeEach(() => {
    runner = new Runner();
  });

  describe("register", () => {
    test("registers a command", () => {
      runner.register(HelloCommand);
      // Command is registered - run should find it
      // We can't directly inspect commands map, but we can test run
    });

    test("registers multiple commands", () => {
      runner.register(HelloCommand);
      runner.register(GoodbyeCommand);
      runner.register(NamespacedCommand);
    });
  });

  describe("run", () => {
    test("returns 0 with no arguments (shows help)", async () => {
      runner.register(HelloCommand);
      const code = await runner.run([]);
      expect(code).toBe(0);
    });

    test("returns 0 with --help flag", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["--help"]);
      expect(code).toBe(0);
    });

    test("returns 0 with -h flag", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["-h"]);
      expect(code).toBe(0);
    });

    test("returns 0 with list command", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["list"]);
      expect(code).toBe(0);
    });

    test("runs command with arguments", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["hello", "World"]);
      expect(code).toBe(0);
    });

    test("runs command with options", async () => {
      runner.register(GoodbyeCommand);
      const code = await runner.run(["goodbye", "--formal"]);
      expect(code).toBe(0);
    });

    test("returns 1 for unknown command", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["unknown"]);
      expect(code).toBe(1);
    });

    test("returns 1 when command throws", async () => {
      runner.register(FailingCommand);
      const code = await runner.run(["fail"]);
      expect(code).toBe(1);
    });

    test("returns exit code from command", async () => {
      runner.register(ExitCodeCommand);
      
      expect(await runner.run(["exit", "0"])).toBe(0);
      expect(await runner.run(["exit", "1"])).toBe(1);
      expect(await runner.run(["exit", "42"])).toBe(42);
    });

    test("returns 1 for missing required argument", async () => {
      runner.register(RequiredArgCommand);
      const code = await runner.run(["required"]);
      expect(code).toBe(1);
    });

    test("shows command help with --help after command name", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["hello", "--help"]);
      expect(code).toBe(0);
    });

    test("shows command help with -h after command name", async () => {
      runner.register(HelloCommand);
      const code = await runner.run(["hello", "-h"]);
      expect(code).toBe(0);
    });
  });

  describe("allowUnknownOptions", () => {
    test("passes unknown options when allowed", async () => {
      runner.register(AllowUnknownCommand);
      const code = await runner.run(["passthrough", "--unknown=value", "--known=test"]);
      expect(code).toBe(0);
    });

    test("rejects unknown options when not allowed", async () => {
      runner.register(GoodbyeCommand);
      const code = await runner.run(["goodbye", "--unknown"]);
      expect(code).toBe(1);
    });
  });

  describe("help output", () => {
    test("groups commands by namespace", async () => {
      runner.register(HelloCommand);
      runner.register(NamespacedCommand);
      runner.register(AnotherNamespacedCommand);
      
      // Just verify it doesn't throw
      const code = await runner.run([]);
      expect(code).toBe(0);
    });

    test("shows all registered commands", async () => {
      runner.register(HelloCommand);
      runner.register(GoodbyeCommand);
      runner.register(NamespacedCommand);
      
      const code = await runner.run(["list"]);
      expect(code).toBe(0);
    });
  });

  describe("loadFromDirectory", () => {
    test("loads nothing from non-existent directory", async () => {
      // Should not throw, just return empty
      await runner.loadFromDirectory("/nonexistent/path");
      const code = await runner.run([]);
      expect(code).toBe(0);
    });

    test("loads commands from directory", async () => {
      // Load from actual commands directory
      const builtinDir = import.meta.dir.replace("/tests/unit/cli", "/core/cli/commands");
      await runner.loadFromDirectory(builtinDir);
      
      // Should have loaded some commands
      const code = await runner.run(["list"]);
      expect(code).toBe(0);
    });
  });
});
