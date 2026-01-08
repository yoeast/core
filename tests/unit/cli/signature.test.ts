import { describe, test, expect } from "bun:test";
import { parseSignature, generateHelp } from "@yoeast/core/cli/signature";

describe("CLI signature parsing", () => {
  describe("parseSignature", () => {
    test("parses simple command name", () => {
      const result = parseSignature("list");
      expect(result.name).toBe("list");
      expect(result.arguments).toHaveLength(0);
      expect(result.options).toHaveLength(0);
    });

    test("parses command with namespace", () => {
      const result = parseSignature("users:list");
      expect(result.name).toBe("users:list");
    });

    test("parses required argument", () => {
      const result = parseSignature("greet {name}");
      expect(result.name).toBe("greet");
      expect(result.arguments).toHaveLength(1);
      expect(result.arguments[0]).toEqual({
        name: "name",
        description: "",
        required: true,
        variadic: false,
        default: undefined,
      });
    });

    test("parses optional argument", () => {
      const result = parseSignature("greet {name?}");
      expect(result.arguments[0]?.required).toBe(false);
    });

    test("parses argument with default value", () => {
      const result = parseSignature("greet {name=World}");
      expect(result.arguments[0]).toMatchObject({
        name: "name",
        required: false,
        default: "World",
      });
    });

    test("parses variadic argument", () => {
      const result = parseSignature("process {files*}");
      expect(result.arguments[0]).toMatchObject({
        name: "files",
        variadic: true,
      });
    });

    test("parses argument with description", () => {
      const result = parseSignature("greet {name : The name to greet}");
      expect(result.arguments[0]?.description).toBe("The name to greet");
    });

    test("parses boolean option (flag)", () => {
      const result = parseSignature("deploy {--force}");
      expect(result.options).toHaveLength(1);
      expect(result.options[0]).toEqual({
        name: "force",
        short: undefined,
        description: "",
        requiresValue: false,
        isArray: false,
        default: undefined,
      });
    });

    test("parses option with short alias", () => {
      const result = parseSignature("deploy {--f|force}");
      expect(result.options[0]).toMatchObject({
        name: "force",
        short: "f",
      });
    });

    test("parses option with value", () => {
      const result = parseSignature("list {--limit=}");
      expect(result.options[0]).toMatchObject({
        name: "limit",
        requiresValue: true,
      });
    });

    test("parses option with default value", () => {
      const result = parseSignature("list {--limit=10}");
      expect(result.options[0]).toMatchObject({
        name: "limit",
        requiresValue: true,
        default: "10",
      });
    });

    test("parses array option", () => {
      const result = parseSignature("build {--env=*}");
      expect(result.options[0]).toMatchObject({
        name: "env",
        requiresValue: true,
        isArray: true,
      });
    });

    test("parses option with description", () => {
      const result = parseSignature("deploy {--force : Force deployment}");
      expect(result.options[0]?.description).toBe("Force deployment");
    });

    test("parses complex signature", () => {
      const result = parseSignature(
        "users:create {email : User email} {name? : Optional name} {--a|admin : Make admin} {--role=user : User role}"
      );

      expect(result.name).toBe("users:create");
      expect(result.arguments).toHaveLength(2);
      expect(result.arguments[0]).toMatchObject({
        name: "email",
        required: true,
        description: "User email",
      });
      expect(result.arguments[1]).toMatchObject({
        name: "name",
        required: false,
        description: "Optional name",
      });
      expect(result.options).toHaveLength(2);
      expect(result.options[0]).toMatchObject({
        name: "admin",
        short: "a",
        description: "Make admin",
      });
      expect(result.options[1]).toMatchObject({
        name: "role",
        default: "user",
        description: "User role",
      });
    });

    test("handles extra whitespace", () => {
      const result = parseSignature("  greet   {name}   {--force}  ");
      expect(result.name).toBe("greet");
      expect(result.arguments).toHaveLength(1);
      expect(result.options).toHaveLength(1);
    });

    test("throws on empty signature", () => {
      expect(() => parseSignature("")).toThrow("Signature must include a command name");
    });

    test("throws on signature starting with argument", () => {
      expect(() => parseSignature("{name}")).toThrow("Signature must start with command name");
    });

    test("throws on invalid token", () => {
      expect(() => parseSignature("greet name")).toThrow("Invalid token");
    });
  });

  describe("generateHelp", () => {
    test("generates help for simple command", () => {
      const parsed = parseSignature("list");
      const help = generateHelp(parsed, "List all items");
      
      expect(help).toContain("Usage:");
      expect(help).toContain("list");
      expect(help).toContain("List all items");
    });

    test("generates help with arguments", () => {
      const parsed = parseSignature("greet {name} {title?}");
      const help = generateHelp(parsed, "Greet someone");
      
      expect(help).toContain("<name>");
      expect(help).toContain("[title]");
      expect(help).toContain("Arguments:");
    });

    test("generates help with options", () => {
      const parsed = parseSignature("deploy {--f|force} {--env=}");
      const help = generateHelp(parsed, "Deploy application");
      
      expect(help).toContain("Options:");
      expect(help).toContain("-f, --force");
      expect(help).toContain("--env=<value>");
      expect(help).toContain("-h, --help");
    });

    test("includes default values", () => {
      const parsed = parseSignature("list {--limit=10}");
      const help = generateHelp(parsed, "List items");
      
      expect(help).toContain('default: "10"');
    });

    test("shows variadic arguments", () => {
      const parsed = parseSignature("process {files*}");
      const help = generateHelp(parsed, "Process files");
      
      expect(help).toContain("<files...>");
    });
  });
});
