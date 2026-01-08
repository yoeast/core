import { describe, test, expect } from "bun:test";
import { parseArgs } from "@yoeast/core/cli/parser";
import { parseSignature } from "@yoeast/core/cli/signature";

describe("CLI argument parser", () => {
  describe("positional arguments", () => {
    test("parses required argument", () => {
      const sig = parseSignature("greet {name}");
      const result = parseArgs(["John"], sig);
      
      expect(result.args.name).toBe("John");
    });

    test("parses multiple arguments", () => {
      const sig = parseSignature("copy {source} {dest}");
      const result = parseArgs(["file.txt", "backup.txt"], sig);
      
      expect(result.args.source).toBe("file.txt");
      expect(result.args.dest).toBe("backup.txt");
    });

    test("parses optional argument", () => {
      const sig = parseSignature("greet {name?}");
      const result = parseArgs([], sig);
      
      expect(result.args.name).toBeUndefined();
    });

    test("uses default value when not provided", () => {
      const sig = parseSignature("greet {name=World}");
      const result = parseArgs([], sig);
      
      expect(result.args.name).toBe("World");
    });

    test("overrides default when provided", () => {
      const sig = parseSignature("greet {name=World}");
      const result = parseArgs(["John"], sig);
      
      expect(result.args.name).toBe("John");
    });

    test("parses variadic argument", () => {
      const sig = parseSignature("process {files*}");
      const result = parseArgs(["a.txt", "b.txt", "c.txt"], sig);
      
      expect(result.args.files).toEqual(["a.txt", "b.txt", "c.txt"]);
    });

    test("variadic with preceding argument", () => {
      const sig = parseSignature("copy {dest} {files*}");
      const result = parseArgs(["output/", "a.txt", "b.txt"], sig);
      
      expect(result.args.dest).toBe("output/");
      expect(result.args.files).toEqual(["a.txt", "b.txt"]);
    });

    test("throws on missing required argument", () => {
      const sig = parseSignature("greet {name}");
      
      expect(() => parseArgs([], sig)).toThrow("Missing required argument: name");
    });
  });

  describe("options", () => {
    test("parses boolean flag", () => {
      const sig = parseSignature("deploy {--force}");
      const result = parseArgs(["--force"], sig);
      
      expect(result.opts.force).toBe(true);
    });

    test("boolean flag defaults to false", () => {
      const sig = parseSignature("deploy {--force}");
      const result = parseArgs([], sig);
      
      expect(result.opts.force).toBe(false);
    });

    test("parses option with value (= syntax)", () => {
      const sig = parseSignature("list {--limit=}");
      const result = parseArgs(["--limit=10"], sig);
      
      expect(result.opts.limit).toBe("10");
    });

    test("parses option with value (space syntax)", () => {
      const sig = parseSignature("list {--limit=}");
      const result = parseArgs(["--limit", "10"], sig);
      
      expect(result.opts.limit).toBe("10");
    });

    test("uses default option value", () => {
      const sig = parseSignature("list {--limit=20}");
      const result = parseArgs([], sig);
      
      expect(result.opts.limit).toBe("20");
    });

    test("parses short option", () => {
      const sig = parseSignature("deploy {--f|force}");
      const result = parseArgs(["-f"], sig);
      
      expect(result.opts.force).toBe(true);
    });

    test("parses short option with value", () => {
      const sig = parseSignature("list {--l|limit=}");
      const result = parseArgs(["-l", "10"], sig);
      
      expect(result.opts.limit).toBe("10");
    });

    test("parses short option with immediate value", () => {
      const sig = parseSignature("list {--l|limit=}");
      const result = parseArgs(["-l10"], sig);
      
      expect(result.opts.limit).toBe("10");
    });

    test("parses combined short flags", () => {
      const sig = parseSignature("cmd {--v|verbose} {--f|force} {--q|quiet}");
      const result = parseArgs(["-vfq"], sig);
      
      expect(result.opts.verbose).toBe(true);
      expect(result.opts.force).toBe(true);
      expect(result.opts.quiet).toBe(true);
    });

    test("parses array option", () => {
      const sig = parseSignature("build {--env=*}");
      const result = parseArgs(["--env=dev", "--env=test"], sig);
      
      expect(result.opts.env).toEqual(["dev", "test"]);
    });

    test("throws on unknown option", () => {
      const sig = parseSignature("cmd");
      
      expect(() => parseArgs(["--unknown"], sig)).toThrow("Unknown option: --unknown");
    });

    test("throws on missing required value", () => {
      const sig = parseSignature("list {--limit=}");
      
      expect(() => parseArgs(["--limit"], sig)).toThrow("Option --limit requires a value");
    });

    test("throws on unknown short option", () => {
      const sig = parseSignature("cmd {--f|force}");
      
      expect(() => parseArgs(["-x"], sig)).toThrow("Unknown option: -x");
    });
  });

  describe("mixed arguments and options", () => {
    test("parses args before options", () => {
      const sig = parseSignature("greet {name} {--loud}");
      const result = parseArgs(["John", "--loud"], sig);
      
      expect(result.args.name).toBe("John");
      expect(result.opts.loud).toBe(true);
    });

    test("parses options before args", () => {
      const sig = parseSignature("greet {name} {--loud}");
      const result = parseArgs(["--loud", "John"], sig);
      
      expect(result.args.name).toBe("John");
      expect(result.opts.loud).toBe(true);
    });

    test("parses interleaved args and options", () => {
      const sig = parseSignature("copy {source} {dest} {--verbose} {--force}");
      const result = parseArgs(["--verbose", "a.txt", "--force", "b.txt"], sig);
      
      expect(result.args.source).toBe("a.txt");
      expect(result.args.dest).toBe("b.txt");
      expect(result.opts.verbose).toBe(true);
      expect(result.opts.force).toBe(true);
    });
  });

  describe("-- separator", () => {
    test("treats everything after -- as positional", () => {
      const sig = parseSignature("run {args*}");
      const result = parseArgs(["--", "--help", "-v"], sig);
      
      expect(result.args.args).toEqual(["--help", "-v"]);
    });

    test("allows passing option-like values as args", () => {
      const sig = parseSignature("echo {message}");
      const result = parseArgs(["--", "--not-an-option"], sig);
      
      expect(result.args.message).toBe("--not-an-option");
    });
  });

  describe("allowUnknownOptions", () => {
    test("stores unknown options when allowed", () => {
      const sig = parseSignature("cmd");
      const result = parseArgs(["--custom=value"], sig, { allowUnknownOptions: true });
      
      expect(result.opts.custom).toBe("value");
    });

    test("stores unknown boolean options when allowed", () => {
      const sig = parseSignature("cmd");
      const result = parseArgs(["--custom"], sig, { allowUnknownOptions: true });
      
      expect(result.opts.custom).toBe(true);
    });

    test("stores unknown option with space value", () => {
      const sig = parseSignature("cmd");
      const result = parseArgs(["--custom", "value"], sig, { allowUnknownOptions: true });
      
      expect(result.opts.custom).toBe("value");
    });
  });
});
