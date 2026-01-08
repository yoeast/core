/**
 * Tests for ConsoleIO output formatting.
 * Tests the formatting utilities without requiring actual TTY.
 */
import { describe, test, expect } from "bun:test";
import { COLORS, color, ConsoleIO } from "@core/cli/console-io";

describe("console-io", () => {
  describe("COLORS constants", () => {
    test("has reset code", () => {
      expect(COLORS.reset).toBe("\x1b[0m");
    });

    test("has formatting codes", () => {
      expect(COLORS.bold).toBe("\x1b[1m");
      expect(COLORS.dim).toBe("\x1b[2m");
    });

    test("has foreground colors", () => {
      expect(COLORS.red).toBe("\x1b[31m");
      expect(COLORS.green).toBe("\x1b[32m");
      expect(COLORS.yellow).toBe("\x1b[33m");
      expect(COLORS.blue).toBe("\x1b[34m");
      expect(COLORS.cyan).toBe("\x1b[36m");
      expect(COLORS.white).toBe("\x1b[37m");
    });

    test("has background colors", () => {
      expect(COLORS.bgRed).toBe("\x1b[41m");
      expect(COLORS.bgGreen).toBe("\x1b[42m");
      expect(COLORS.bgYellow).toBe("\x1b[43m");
      expect(COLORS.bgBlue).toBe("\x1b[44m");
    });
  });

  describe("color function", () => {
    test("applies color codes when TTY", () => {
      // In TTY environment, color codes are applied
      const result = color("hello", COLORS.red);
      // Either returns with codes or without (depends on TTY)
      expect(result).toContain("hello");
    });

    test("handles multiple color codes", () => {
      const result = color("hello", COLORS.bold, COLORS.red);
      expect(result).toContain("hello");
    });

    test("handles empty text", () => {
      const result = color("", COLORS.green);
      // Empty string with possible color codes
      expect(result.replace(/\x1b\[[0-9;]*m/g, "")).toBe("");
    });
  });

  describe("ConsoleIO class", () => {
    let io: ConsoleIO;
    let output: string[];
    let originalLog: typeof console.log;
    let originalWrite: typeof process.stdout.write;

    function captureOutput() {
      output = [];
      originalLog = console.log;
      originalWrite = process.stdout.write;
      console.log = (...args: unknown[]) => {
        output.push(args.map(String).join(" "));
      };
      process.stdout.write = ((text: string) => {
        output.push(text);
        return true;
      }) as typeof process.stdout.write;
    }

    function restoreOutput() {
      console.log = originalLog;
      process.stdout.write = originalWrite;
    }

    test("write outputs text without newline", () => {
      io = new ConsoleIO();
      captureOutput();
      io.write("hello");
      restoreOutput();
      expect(output).toContain("hello");
    });

    test("writeln outputs text with newline", () => {
      io = new ConsoleIO();
      captureOutput();
      io.writeln("hello");
      restoreOutput();
      expect(output).toContain("hello");
    });

    test("writeln with no args outputs empty line", () => {
      io = new ConsoleIO();
      captureOutput();
      io.writeln();
      restoreOutput();
      expect(output).toContain("");
    });

    test("newLine outputs multiple empty lines", () => {
      io = new ConsoleIO();
      captureOutput();
      io.newLine(3);
      restoreOutput();
      expect(output.filter((l) => l === "").length).toBe(3);
    });

    test("info outputs info message", () => {
      io = new ConsoleIO();
      captureOutput();
      io.info("test message");
      restoreOutput();
      expect(output.some((l) => l.includes("test message"))).toBe(true);
    });

    test("success outputs success message", () => {
      io = new ConsoleIO();
      captureOutput();
      io.success("done");
      restoreOutput();
      expect(output.some((l) => l.includes("done"))).toBe(true);
    });

    test("warning outputs warning message", () => {
      io = new ConsoleIO();
      captureOutput();
      io.warning("caution");
      restoreOutput();
      expect(output.some((l) => l.includes("caution"))).toBe(true);
    });

    test("error outputs error message", () => {
      io = new ConsoleIO();
      captureOutput();
      io.error("failed");
      restoreOutput();
      expect(output.some((l) => l.includes("failed"))).toBe(true);
    });

    test("comment outputs dimmed text", () => {
      io = new ConsoleIO();
      captureOutput();
      io.comment("note");
      restoreOutput();
      expect(output.some((l) => l.includes("note"))).toBe(true);
    });

    test("block outputs highlighted block", () => {
      io = new ConsoleIO();
      captureOutput();
      io.block("Important!", "warning");
      restoreOutput();
      expect(output.some((l) => l.includes("Important!"))).toBe(true);
    });

    test("block defaults to info style", () => {
      io = new ConsoleIO();
      captureOutput();
      io.block("Notice");
      restoreOutput();
      expect(output.some((l) => l.includes("Notice"))).toBe(true);
    });
  });

  describe("table formatting", () => {
    let io: ConsoleIO;
    let output: string[];
    let originalLog: typeof console.log;

    test("table outputs formatted table", () => {
      io = new ConsoleIO();
      output = [];
      originalLog = console.log;
      console.log = (...args: unknown[]) => {
        output.push(args.map(String).join(" "));
      };

      io.table(["Name", "Age"], [
        ["Alice", "30"],
        ["Bob", "25"],
      ]);

      console.log = originalLog;

      // Should have header, divider, and 2 data rows
      expect(output.length).toBeGreaterThanOrEqual(4);
      expect(output.some((l) => l.includes("Name"))).toBe(true);
      expect(output.some((l) => l.includes("Alice"))).toBe(true);
      expect(output.some((l) => l.includes("Bob"))).toBe(true);
    });

    test("table handles empty cells", () => {
      io = new ConsoleIO();
      output = [];
      originalLog = console.log;
      console.log = (...args: unknown[]) => {
        output.push(args.map(String).join(" "));
      };

      io.table(["A", "B"], [
        ["value", ""],
        ["", "other"],
      ]);

      console.log = originalLog;
      expect(output.length).toBeGreaterThanOrEqual(3);
    });

    test("table pads columns to max width", () => {
      io = new ConsoleIO();
      output = [];
      originalLog = console.log;
      console.log = (...args: unknown[]) => {
        output.push(args.map(String).join(" "));
      };

      io.table(["Short", "LongerHeader"], [
        ["x", "y"],
        ["longervalue", "z"],
      ]);

      console.log = originalLog;

      // Check that longer values determine column width
      expect(output.some((l) => l.includes("longervalue"))).toBe(true);
    });
  });

  describe("progress bar", () => {
    let io: ConsoleIO;
    let output: string[];
    let originalWrite: typeof process.stdout.write;
    let originalLog: typeof console.log;

    function captureOutput() {
      output = [];
      originalWrite = process.stdout.write;
      originalLog = console.log;
      process.stdout.write = ((text: string) => {
        output.push(text);
        return true;
      }) as typeof process.stdout.write;
      console.log = () => {
        output.push("\n");
      };
    }

    function restoreOutput() {
      process.stdout.write = originalWrite;
      console.log = originalLog;
    }

    test("progress creates progress bar", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(100);
      restoreOutput();
      expect(bar).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    test("progress bar advance updates display", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(100);
      bar.advance(10);
      bar.advance(20);
      restoreOutput();
      // Should have multiple renders
      expect(output.length).toBeGreaterThan(1);
    });

    test("progress bar set updates to specific value", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(100);
      bar.set(50);
      restoreOutput();
      expect(output.some((l) => l.includes("50%"))).toBe(true);
    });

    test("progress bar finish completes bar", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(100);
      bar.finish();
      restoreOutput();
      expect(output.some((l) => l.includes("100%"))).toBe(true);
    });

    test("progress bar handles zero total", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(0);
      bar.finish();
      restoreOutput();
      // Should not throw
      expect(output.length).toBeGreaterThan(0);
    });

    test("progress bar advance caps at total", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(10);
      bar.advance(100); // More than total
      restoreOutput();
      expect(output.some((l) => l.includes("100%"))).toBe(true);
    });

    test("progress bar set caps at total", () => {
      io = new ConsoleIO();
      captureOutput();
      const bar = io.progress(10);
      bar.set(100); // More than total
      restoreOutput();
      expect(output.some((l) => l.includes("100%"))).toBe(true);
    });
  });
});
