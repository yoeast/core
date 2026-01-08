/**
 * Tests for CLI Command base class.
 */
import { describe, test, expect, beforeEach } from "bun:test";
import { Command } from "@core/cli/command";

// Test command implementation
class TestCommand extends Command {
  static signature = "test:cmd {name} {--force} {--count=}";
  static description = "Test command";

  async handle(): Promise<number> {
    return 0;
  }
}

class MultiArgCommand extends Command {
  static signature = "multi {first} {second?} {third=default}";
  static description = "Multiple arguments";

  async handle(): Promise<number> {
    return 0;
  }
}

class ArrayCommand extends Command {
  static signature = "arr {files*} {--tags=*}";
  static description = "Array arguments";

  async handle(): Promise<number> {
    return 0;
  }
}

describe("Command base class", () => {
  describe("static methods", () => {
    test("getName returns command name from signature", () => {
      expect(TestCommand.getName()).toBe("test:cmd");
    });

    test("getParsed returns parsed signature", () => {
      const parsed = TestCommand.getParsed();
      expect(parsed.name).toBe("test:cmd");
      expect(parsed.arguments).toHaveLength(1);
      expect(parsed.options).toHaveLength(2);
    });

    test("getParsed caches result", () => {
      const first = TestCommand.getParsed();
      const second = TestCommand.getParsed();
      expect(first).toBe(second);
    });
  });

  describe("argument access", () => {
    let cmd: TestCommand;

    beforeEach(() => {
      cmd = new TestCommand();
    });

    test("argument returns value when set", () => {
      cmd._init({ name: "John" }, {});
      expect(cmd["argument"]("name")).toBe("John");
    });

    test("argument returns undefined for missing arg", () => {
      cmd._init({}, {});
      expect(cmd["argument"]("name")).toBeUndefined();
    });

    test("argument returns default when not set", () => {
      cmd._init({}, {});
      expect(cmd["argument"]("name", "default")).toBe("default");
    });

    test("arguments returns all arguments", () => {
      cmd._init({ name: "Test", other: "Value" }, {});
      const args = cmd["arguments"]();
      expect(args).toEqual({ name: "Test", other: "Value" });
    });

    test("arguments returns a copy", () => {
      cmd._init({ name: "Test" }, {});
      const args = cmd["arguments"]();
      args.name = "Modified";
      expect(cmd["argument"]("name")).toBe("Test");
    });
  });

  describe("option access", () => {
    let cmd: TestCommand;

    beforeEach(() => {
      cmd = new TestCommand();
    });

    test("option returns boolean flag", () => {
      cmd._init({}, { force: true });
      expect(cmd["option"]("force")).toBe(true);
    });

    test("option returns string value", () => {
      cmd._init({}, { count: "5" });
      expect(cmd["option"]("count")).toBe("5");
    });

    test("option returns undefined for missing option", () => {
      cmd._init({}, {});
      expect(cmd["option"]("force")).toBeUndefined();
    });

    test("option returns default when not set", () => {
      cmd._init({}, {});
      expect(cmd["option"]("count", "10")).toBe("10");
    });

    test("options returns all options", () => {
      cmd._init({}, { force: true, count: "5" });
      const opts = cmd["options"]();
      expect(opts).toEqual({ force: true, count: "5" });
    });

    test("options returns a copy", () => {
      cmd._init({}, { force: true });
      const opts = cmd["options"]();
      opts.force = false;
      expect(cmd["option"]("force")).toBe(true);
    });
  });

  describe("getAllOptions type coercion", () => {
    let cmd: TestCommand;

    beforeEach(() => {
      cmd = new TestCommand();
    });

    test("converts 'true' string to boolean", () => {
      cmd._init({}, { flag: "true" });
      const opts = cmd["getAllOptions"]();
      expect(opts.flag).toBe(true);
    });

    test("converts 'false' string to boolean", () => {
      cmd._init({}, { flag: "false" });
      const opts = cmd["getAllOptions"]();
      expect(opts.flag).toBe(false);
    });

    test("converts numeric string to number", () => {
      cmd._init({}, { count: "42" });
      const opts = cmd["getAllOptions"]();
      expect(opts.count).toBe(42);
    });

    test("converts float string to number", () => {
      cmd._init({}, { rate: "3.14" });
      const opts = cmd["getAllOptions"]();
      expect(opts.rate).toBe(3.14);
    });

    test("parses JSON object string", () => {
      cmd._init({}, { config: '{"key":"value"}' });
      const opts = cmd["getAllOptions"]();
      expect(opts.config).toEqual({ key: "value" });
    });

    test("parses JSON array string", () => {
      cmd._init({}, { items: '["a","b","c"]' });
      const opts = cmd["getAllOptions"]();
      expect(opts.items).toEqual(["a", "b", "c"]);
    });

    test("keeps invalid JSON as string", () => {
      cmd._init({}, { data: "{not-json" });
      const opts = cmd["getAllOptions"]();
      expect(opts.data).toBe("{not-json");
    });

    test("keeps regular strings as strings", () => {
      cmd._init({}, { name: "hello" });
      const opts = cmd["getAllOptions"]();
      expect(opts.name).toBe("hello");
    });

    test("preserves boolean values", () => {
      cmd._init({}, { flag: true });
      const opts = cmd["getAllOptions"]();
      expect(opts.flag).toBe(true);
    });

    test("preserves array values", () => {
      cmd._init({}, { tags: ["a", "b"] });
      const opts = cmd["getAllOptions"]();
      expect(opts.tags).toEqual(["a", "b"]);
    });

    test("keeps empty string as string", () => {
      cmd._init({}, { empty: "" });
      const opts = cmd["getAllOptions"]();
      expect(opts.empty).toBe("");
    });
  });

  describe("array arguments and options", () => {
    let cmd: ArrayCommand;

    beforeEach(() => {
      cmd = new ArrayCommand();
    });

    test("handles array argument", () => {
      cmd._init({ files: ["a.txt", "b.txt", "c.txt"] }, {});
      const files = cmd["argument"]("files");
      expect(files).toEqual(["a.txt", "b.txt", "c.txt"]);
    });

    test("handles array option", () => {
      cmd._init({}, { tags: ["tag1", "tag2"] });
      const tags = cmd["option"]("tags");
      expect(tags).toEqual(["tag1", "tag2"]);
    });
  });

  describe("multiple arguments", () => {
    let cmd: MultiArgCommand;

    beforeEach(() => {
      cmd = new MultiArgCommand();
    });

    test("handles required and optional arguments", () => {
      cmd._init({ first: "one", second: "two", third: "three" }, {});
      expect(cmd["argument"]("first")).toBe("one");
      expect(cmd["argument"]("second")).toBe("two");
      expect(cmd["argument"]("third")).toBe("three");
    });

    test("handles missing optional argument", () => {
      cmd._init({ first: "one" }, {});
      expect(cmd["argument"]("first")).toBe("one");
      expect(cmd["argument"]("second")).toBeUndefined();
    });
  });

  describe("showHelp", () => {
    test("generates help text", () => {
      const cmd = new TestCommand();
      // Just verify it doesn't throw
      const originalLog = console.log;
      let output = "";
      console.log = (msg: string) => {
        output += msg;
      };
      cmd.showHelp();
      console.log = originalLog;
      expect(output).toContain("test:cmd");
    });
  });
});
