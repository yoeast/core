import { describe, test, expect, beforeEach, mock } from "bun:test";
import { Logger, log, initLogger, getLogger } from "@core/logging";
import type { LogDriver, LogEntry, LogLevel } from "@core/logging";

// Mock driver for testing
class MockDriver implements LogDriver {
  readonly name = "mock";
  entries: LogEntry[] = [];
  
  log(entry: LogEntry): void {
    this.entries.push(entry);
  }
  
  clear(): void {
    this.entries = [];
  }
}

describe("Logger", () => {
  let mockDriver: MockDriver;
  let logger: Logger;
  
  beforeEach(() => {
    mockDriver = new MockDriver();
    logger = new Logger({ level: "debug", drivers: [mockDriver] });
  });
  
  describe("log levels", () => {
    test("debug logs when level is debug", () => {
      logger.debug("test message");
      expect(mockDriver.entries).toHaveLength(1);
      expect(mockDriver.entries[0]!.level).toBe("debug");
      expect(mockDriver.entries[0]!.message).toBe("test message");
    });
    
    test("info logs when level is debug or info", () => {
      logger.info("test message");
      expect(mockDriver.entries).toHaveLength(1);
      expect(mockDriver.entries[0]!.level).toBe("info");
    });
    
    test("warn logs when level is debug, info, or warn", () => {
      logger.warn("test message");
      expect(mockDriver.entries).toHaveLength(1);
      expect(mockDriver.entries[0]!.level).toBe("warn");
    });
    
    test("error always logs", () => {
      logger.error("test message");
      expect(mockDriver.entries).toHaveLength(1);
      expect(mockDriver.entries[0]!.level).toBe("error");
    });
    
    test("debug does not log when level is info", () => {
      logger.setLevel("info");
      logger.debug("test message");
      expect(mockDriver.entries).toHaveLength(0);
    });
    
    test("info does not log when level is warn", () => {
      logger.setLevel("warn");
      logger.info("test message");
      expect(mockDriver.entries).toHaveLength(0);
    });
    
    test("warn does not log when level is error", () => {
      logger.setLevel("error");
      logger.warn("test message");
      expect(mockDriver.entries).toHaveLength(0);
    });
  });
  
  describe("context", () => {
    test("includes context in log entry", () => {
      logger.info("test", { userId: 123, action: "login" });
      expect(mockDriver.entries[0]!.context).toEqual({ userId: 123, action: "login" });
    });
    
    test("context is optional", () => {
      logger.info("test");
      expect(mockDriver.entries[0]!.context).toBeUndefined();
    });
  });
  
  describe("error logging", () => {
    test("includes error object", () => {
      const error = new Error("test error");
      logger.error("something failed", error);
      expect(mockDriver.entries[0]!.error).toBe(error);
    });
    
    test("handles non-Error objects", () => {
      logger.error("something failed", "string error");
      expect(mockDriver.entries[0]!.error).toBeUndefined();
    });
    
    test("error with context", () => {
      const error = new Error("test error");
      logger.error("something failed", error, { userId: 123 });
      expect(mockDriver.entries[0]!.error).toBe(error);
      expect(mockDriver.entries[0]!.context).toEqual({ userId: 123 });
    });
  });
  
  describe("timestamp", () => {
    test("includes timestamp in log entry", () => {
      const before = new Date();
      logger.info("test");
      const after = new Date();
      
      const timestamp = mockDriver.entries[0]!.timestamp;
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
  
  describe("drivers", () => {
    test("logs to multiple drivers", () => {
      const driver2 = new MockDriver();
      logger.addDriver(driver2);
      
      logger.info("test");
      
      expect(mockDriver.entries).toHaveLength(1);
      expect(driver2.entries).toHaveLength(1);
    });
    
    test("can remove driver by name", () => {
      logger.removeDriver("mock");
      logger.info("test");
      expect(mockDriver.entries).toHaveLength(0);
    });
  });
  
  describe("level management", () => {
    test("setLevel changes the level", () => {
      logger.setLevel("error");
      expect(logger.getLevel()).toBe("error");
    });
    
    test("getLevel returns current level", () => {
      expect(logger.getLevel()).toBe("debug");
    });
  });
});

describe("default log", () => {
  let mockDriver: MockDriver;
  
  beforeEach(() => {
    mockDriver = new MockDriver();
    initLogger({ level: "debug", drivers: [mockDriver] });
  });
  
  test("log.info uses default logger", () => {
    log.info("test message");
    expect(mockDriver.entries).toHaveLength(1);
    expect(mockDriver.entries[0]!.message).toBe("test message");
  });
  
  test("log.debug uses default logger", () => {
    log.debug("test message");
    expect(mockDriver.entries).toHaveLength(1);
  });
  
  test("log.warn uses default logger", () => {
    log.warn("test message");
    expect(mockDriver.entries).toHaveLength(1);
  });
  
  test("log.error uses default logger", () => {
    log.error("test message");
    expect(mockDriver.entries).toHaveLength(1);
  });
  
  test("log.setLevel changes default logger level", () => {
    log.setLevel("error");
    log.info("should not log");
    expect(mockDriver.entries).toHaveLength(0);
  });
  
  test("getLogger returns the default logger", () => {
    const logger = getLogger();
    expect(logger.getLevel()).toBe("debug");
  });
});
