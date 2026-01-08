/**
 * Log levels supported by the logging system.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry passed to drivers.
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * Log driver interface - implement this to create custom log drivers.
 */
export interface LogDriver {
  /**
   * Driver name for identification.
   */
  readonly name: string;
  
  /**
   * Write a log entry.
   */
  log(entry: LogEntry): void | Promise<void>;
  
  /**
   * Optional: Called when the driver is being shut down.
   */
  shutdown?(): void | Promise<void>;
}

/**
 * Logger configuration.
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output.
   * Default: "info"
   */
  level?: LogLevel;
  
  /**
   * Drivers to use for logging.
   * Default: [StdoutDriver]
   */
  drivers?: LogDriver[];
}

// Re-export for convenience
export { StdoutDriver } from "./drivers/stdout";
export { FileDriver } from "./drivers/file";
