/**
 * CLI Runner - discovers and executes commands.
 */

import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { Command, type CommandConstructor } from "./command";
import { parseArgs } from "./parser";
import { ConsoleIO, color, COLORS } from "./console-io";

const COMMAND_EXTENSIONS = new Set([".ts", ".js"]);

export interface RunnerOptions {
  rootDir?: string;
}

export class Runner {
  private commands = new Map<string, CommandConstructor>();
  private io = new ConsoleIO();

  /**
   * Register a command class.
   */
  register(CommandClass: CommandConstructor): void {
    const name = CommandClass.getName();
    this.commands.set(name, CommandClass);
  }

  /**
   * Load commands from a directory.
   */
  async loadFromDirectory(dir: string): Promise<void> {
    const files = await listFiles(dir);

    for (const file of files) {
      const ext = path.extname(file);
      if (!COMMAND_EXTENSIONS.has(ext)) continue;
      if (!file.endsWith(".command.ts") && !file.endsWith(".command.js")) continue;

      try {
        const mod = await import(pathToFileURL(file).href);
        const CommandClass = mod.default as CommandConstructor | undefined;

        if (CommandClass && isCommandClass(CommandClass)) {
          this.register(CommandClass);
        }
      } catch (error) {
        console.error(`Failed to load command from ${file}:`, error);
      }
    }
  }

  /**
   * Run the CLI with given arguments.
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<number> {
    // No command specified - show help
    if (argv.length === 0) {
      this.showGlobalHelp();
      return 0;
    }

    const commandName = argv[0]!;

    // Built-in help flags
    if (commandName === "--help" || commandName === "-h") {
      this.showGlobalHelp();
      return 0;
    }

    // Check for command-level help: `cli users:create --help`
    if (argv.includes("--help") || argv.includes("-h")) {
      const CommandClass = this.commands.get(commandName);
      if (CommandClass) {
        const instance = new (CommandClass as new () => Command)();
        instance.showHelp();
        return 0;
      }
    }

    // List command
    if (commandName === "list") {
      this.showGlobalHelp();
      return 0;
    }

    return this.runCommand(commandName, argv.slice(1));
  }

  /**
   * Run a specific command.
   */
  private async runCommand(name: string, argv: string[]): Promise<number> {
    const CommandClass = this.commands.get(name);

    if (!CommandClass) {
      this.io.error(`Command not found: ${name}`);
      this.io.newLine();
      this.io.comment("Run 'bun cli list' to see available commands.");
      return 1;
    }

    const parsed = CommandClass.getParsed();
    const allowUnknownOptions = (CommandClass as typeof Command & { allowUnknownOptions?: boolean }).allowUnknownOptions ?? false;
    
    try {
      const { args, opts } = parseArgs(argv, parsed, { allowUnknownOptions });

      const instance = new (CommandClass as new () => Command)();
      instance._init(args, opts);

      return await instance.handle();
    } catch (error) {
      if (error instanceof Error) {
        this.io.error(error.message);
      } else {
        this.io.error(String(error));
      }
      return 1;
    }
  }

  /**
   * Show global help with all available commands.
   */
  private showGlobalHelp(): void {
    console.log();
    console.log(color("  Core", COLORS.bold, COLORS.green));
    console.log();
    console.log(color("  Usage:", COLORS.yellow) + " bun cli " + color("<command>", COLORS.cyan) + " [arguments] [options]");
    console.log();
    console.log(color("  Available commands:", COLORS.yellow));

    // Group commands by namespace
    const grouped = new Map<string, Array<{ name: string; description: string }>>();

    for (const [name, CommandClass] of this.commands) {
      const parts = name.split(":");
      const namespace = parts.length > 1 ? parts[0]! : "";
      const description = CommandClass.description || "";

      if (!grouped.has(namespace)) {
        grouped.set(namespace, []);
      }
      grouped.get(namespace)!.push({ name, description });
    }

    // Sort namespaces
    const namespaces = [...grouped.keys()].sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });

    const maxLen = Math.max(...[...this.commands.keys()].map((n) => n.length));

    for (const namespace of namespaces) {
      const commands = grouped.get(namespace)!.sort((a, b) => a.name.localeCompare(b.name));

      if (namespace) {
        console.log();
        console.log(color(`  ${namespace}`, COLORS.bold));
      }

      for (const { name, description } of commands) {
        const padded = name.padEnd(maxLen + 2);
        console.log(`    ${color(padded, COLORS.green)}${color(description, COLORS.dim)}`);
      }
    }

    console.log();
    console.log(color("  Options:", COLORS.yellow));
    console.log(`    ${color("-h, --help", COLORS.green)}    ${color("Show help for a command", COLORS.dim)}`);
    console.log();
  }
}

/**
 * Check if a value is a Command class.
 */
function isCommandClass(value: unknown): value is CommandConstructor {
  return (
    typeof value === "function" &&
    "signature" in value &&
    typeof (value as CommandConstructor).signature === "string" &&
    value.prototype instanceof Command
  );
}

/**
 * Recursively list files in a directory.
 */
async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listFiles(full)));
      } else {
        files.push(full);
      }
    }

    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * Create and run the CLI.
 */
export async function runCli(options: RunnerOptions = {}): Promise<never> {
  const rootDir = options.rootDir ?? process.cwd();

  // Initialize core systems for CLI commands that need them
  const { initConfig } = await import("../config");
  const { bootServices, shutdownServices } = await import("../service");

  await initConfig(rootDir);
  await bootServices(rootDir);

  const runner = new Runner();

  // Load built-in commands
  const builtinDir = path.join(import.meta.dir, "commands");
  await runner.loadFromDirectory(builtinDir);

  // Load app commands
  const appDir = path.join(rootDir, "app", "cli");
  await runner.loadFromDirectory(appDir);

  const exitCode = await runner.run();

  // Cleanup
  await shutdownServices();

  process.exit(exitCode);
}
