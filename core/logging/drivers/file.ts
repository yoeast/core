/**
 * File log driver - outputs logs to a file.
 */

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { LogDriver, LogEntry, LogLevel } from "../types";

export interface FileDriverOptions {
  /**
   * Path to log file.
   * Default: storage/logs/app.log
   */
  path?: string;
  
  /**
   * Minimum level to log to file.
   * Default: uses logger's level
   */
  level?: LogLevel;
  
  /**
   * Include JSON context in output.
   * Default: true
   */
  includeContext?: boolean;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class FileDriver implements LogDriver {
  readonly name = "file";
  private filePath: string;
  private minLevel?: LogLevel;
  private includeContext: boolean;
  private initialized = false;
  
  constructor(options: FileDriverOptions = {}) {
    this.filePath = options.path ?? "storage/logs/app.log";
    this.minLevel = options.level;
    this.includeContext = options.includeContext ?? true;
  }
  
  async log(entry: LogEntry): Promise<void> {
    // Check level filter
    if (this.minLevel && LEVEL_PRIORITY[entry.level] < LEVEL_PRIORITY[this.minLevel]) {
      return;
    }
    
    // Ensure directory exists on first write
    if (!this.initialized) {
      const dir = path.dirname(this.filePath);
      await mkdir(dir, { recursive: true });
      this.initialized = true;
    }
    
    // Format log line
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    let line = `[${timestamp}] ${level} ${entry.message}`;
    
    // Add context
    if (this.includeContext && entry.context && Object.keys(entry.context).length > 0) {
      line += ` ${JSON.stringify(entry.context)}`;
    }
    
    // Add error stack
    if (entry.error?.stack) {
      line += `\n${entry.error.stack}`;
    }
    
    line += "\n";
    
    await appendFile(this.filePath, line, "utf-8");
  }
}
