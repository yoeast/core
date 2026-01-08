/**
 * Lint command - Run TypeScript and other code quality checks.
 */

import { Command } from "../command";
import { spawn } from "bun";

export default class LintCommand extends Command {
  static override signature = "lint {--fix} {--quiet}";
  static override description = "Run TypeScript and code quality checks";

  async handle(): Promise<number> {
    const fix = this.option("fix", false) as boolean;
    const quiet = this.option("quiet", false) as boolean;

    let hasErrors = false;

    // Run TypeScript check
    if (!quiet) {
      this.io.info("Running TypeScript check...");
    }

    const tscResult = await this.runTypeScript();
    if (tscResult.exitCode !== 0) {
      hasErrors = true;
      if (tscResult.output) {
        console.log(tscResult.output);
      }
    } else if (!quiet) {
      this.io.success("TypeScript: No errors");
    }

    // Summary
    if (!quiet) {
      console.log();
    }

    if (hasErrors) {
      this.io.error("Lint checks failed");
      return 1;
    }

    if (!quiet) {
      this.io.success("All checks passed");
    }
    return 0;
  }

  private async runTypeScript(): Promise<{ exitCode: number; output: string }> {
    const proc = spawn({
      cmd: ["bun", "x", "tsc", "--noEmit", "--pretty"],
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return {
      exitCode,
      output: stdout + stderr,
    };
  }
}
