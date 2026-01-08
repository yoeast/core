/**
 * Code Quality Skill - Run TypeScript and linting checks.
 */

import { spawn } from "bun";

interface Input {
  verbose?: boolean;
  quiet?: boolean;
}

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
}

interface CheckResult {
  passed: boolean;
  errors: TypeScriptError[];
}

interface Output {
  success: boolean;
  checks: {
    typescript: CheckResult;
  };
  summary: string;
}

export async function execute(input: Input): Promise<Output> {
  const verbose = input.verbose ?? false;
  const quiet = input.quiet ?? false;

  // Run TypeScript check
  const tsResult = await runTypeScript();

  const allPassed = tsResult.passed;
  const failedCount = allPassed ? 0 : 1;

  return {
    success: allPassed,
    checks: {
      typescript: tsResult,
    },
    summary: allPassed 
      ? "All checks passed" 
      : `${failedCount} check${failedCount > 1 ? "s" : ""} failed`,
  };
}

async function runTypeScript(): Promise<CheckResult> {
  const proc = spawn({
    cmd: ["bun", "x", "tsc", "--noEmit", "--pretty", "false"],
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode === 0) {
    return { passed: true, errors: [] };
  }

  // Parse TypeScript errors
  const errors: TypeScriptError[] = [];
  const output = stdout + stderr;
  const lines = output.split("\n");

  // TypeScript error format: file(line,col): error TS1234: message
  const errorRegex = /^(.+)\((\d+),(\d+)\):\s*error\s+TS\d+:\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(errorRegex);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[4],
      });
    }
  }

  return { passed: false, errors };
}
