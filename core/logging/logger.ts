/**
 * Logger - Pluggable logging system with multiple drivers.
 * 
 * @example Basic usage:
 * ```ts
 * import { log } from "@yoeast/core/logging";
 * 
 * log.info("User logged in", { userId: 123 });
 * log.warn("Rate limit approaching");
 * log.error("Failed to connect", error);
 * log.debug("Processing request", { path: "/api/users" });
 * ```
 * 
 * @example Custom configuration:
 * ```ts
 * import { Logger, StdoutDriver, FileDriver } from "@yoeast/core/logging";
 * 
 * const logger = new Logger({
 *   level: "debug",
 *   drivers: [
 *     new StdoutDriver({ colors: true }),
 *     new FileDriver({ path: "storage/logs/app.log" }),
 *   ],
 * });
 * ```
 */

import type { LogLevel, LogEntry, LogDriver, LoggerConfig } from "./types";
import { StdoutDriver } from "./drivers/stdout";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger class with pluggable drivers.
 */
export class Logger {
  private level: LogLevel;
  private drivers: LogDriver[];
  
  constructor(config: LoggerConfig = {}) {
    this.level = config.level ?? "info";
    this.drivers = config.drivers ?? [new StdoutDriver()];
  }
  
  /**
   * Set the minimum log level.
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Get the current log level.
   */
  getLevel(): LogLevel {
    return this.level;
  }
  
  /**
   * Add a driver.
   */
  addDriver(driver: LogDriver): void {
    this.drivers.push(driver);
  }
  
  /**
   * Remove a driver by name.
   */
  removeDriver(name: string): void {
    this.drivers = this.drivers.filter(d => d.name !== name);
  }
  
  /**
   * Check if a level should be logged.
   */
  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }
  
  /**
   * Write a log entry to all drivers.
   */
  private write(entry: LogEntry): void {
    for (const driver of this.drivers) {
      try {
        driver.log(entry);
      } catch (err) {
        // Don't let driver errors break the application
        console.error(`Logger driver "${driver.name}" failed:`, err);
      }
    }
  }
  
  /**
   * Log a debug message.
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;
    this.write({
      level: "debug",
      message,
      timestamp: new Date(),
      context,
    });
  }
  
  /**
   * Log an info message.
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;
    this.write({
      level: "info",
      message,
      timestamp: new Date(),
      context,
    });
  }
  
  /**
   * Log a warning message.
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    this.write({
      level: "warn",
      message,
      timestamp: new Date(),
      context,
    });
  }
  
  /**
   * Log an error message.
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (!this.shouldLog("error")) return;
    const errorObj = error instanceof Error ? error : undefined;
    this.write({
      level: "error",
      message,
      timestamp: new Date(),
      context,
      error: errorObj,
    });
  }
  
  /**
   * Shutdown all drivers.
   */
  async shutdown(): Promise<void> {
    for (const driver of this.drivers) {
      if (driver.shutdown) {
        await driver.shutdown();
      }
    }
  }
}

// Default logger instance
let defaultLogger = new Logger();

/**
 * Initialize the default logger with custom config.
 */
export function initLogger(config: LoggerConfig): void {
  defaultLogger = new Logger(config);
}

/**
 * Get the default logger instance.
 */
export function getLogger(): Logger {
  return defaultLogger;
}

/**
 * Default log interface - uses the default logger.
 */
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => defaultLogger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => defaultLogger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => defaultLogger.warn(message, context),
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => defaultLogger.error(message, error, context),
  setLevel: (level: LogLevel) => defaultLogger.setLevel(level),
  getLevel: () => defaultLogger.getLevel(),
  addDriver: (driver: LogDriver) => defaultLogger.addDriver(driver),
  removeDriver: (name: string) => defaultLogger.removeDriver(name),
};
