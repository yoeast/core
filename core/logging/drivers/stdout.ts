/**
 * Stdout log driver - outputs logs to console with colors.
 */

import type { LogDriver, LogEntry, LogLevel } from "../types";
import { color, COLORS } from "../../cli/console-io";

export interface StdoutDriverOptions {
  /**
   * Use colors in output.
   * Default: true (unless NO_COLOR env is set)
   */
  colors?: boolean;
  
  /**
   * Include timestamp in output.
   * Default: true
   */
  timestamps?: boolean;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.dim,
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR",
};

export class StdoutDriver implements LogDriver {
  readonly name = "stdout";
  private colors: boolean;
  private timestamps: boolean;
  
  constructor(options: StdoutDriverOptions = {}) {
    this.colors = options.colors ?? !process.env.NO_COLOR;
    this.timestamps = options.timestamps ?? true;
  }
  
  log(entry: LogEntry): void {
    const parts: string[] = [];
    
    // Timestamp
    if (this.timestamps) {
      const time = entry.timestamp.toTimeString().slice(0, 8);
      parts.push(this.colors ? color(time, COLORS.dim) : time);
    }
    
    // Level
    const levelLabel = LEVEL_LABELS[entry.level];
    parts.push(
      this.colors 
        ? color(levelLabel, LEVEL_COLORS[entry.level], COLORS.bold) 
        : levelLabel
    );
    
    // Message
    parts.push(entry.message);
    
    // Context (if any)
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context);
      parts.push(this.colors ? color(contextStr, COLORS.dim) : contextStr);
    }
    
    const line = parts.join(" ");
    
    // Output to appropriate stream
    if (entry.level === "error") {
      console.error(line);
      if (entry.error?.stack) {
        console.error(this.colors ? color(entry.error.stack, COLORS.dim) : entry.error.stack);
      }
    } else if (entry.level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}
