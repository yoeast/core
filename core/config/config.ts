/**
 * Configuration system with dot notation access.
 */

import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import coreDefaults from "./defaults";

type ConfigValue = string | number | boolean | null | undefined | ConfigObject | ConfigValue[];
interface ConfigObject {
  [key: string]: ConfigValue;
}

let configStore: ConfigObject = {};
let initialized = false;

/**
 * Get a configuration value using dot notation.
 * 
 * @example
 * config('app.name')           // 'Core'
 * config('app.debug')          // false
 * config('database.default')   // 'sqlite'
 * config('missing', 'default') // 'default'
 */
export function config<T = ConfigValue>(key: string, defaultValue?: T): T {
  if (!initialized) {
    throw new Error("Config not initialized. Call initConfig() first.");
  }

  const parts = key.split(".");
  let current: ConfigValue = configStore;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object" || Array.isArray(current)) {
      return defaultValue as T;
    }
    current = (current as ConfigObject)[part];
  }

  if (current === undefined) {
    return defaultValue as T;
  }

  return current as T;
}

/**
 * Get the entire config object for a namespace.
 * 
 * @example
 * configAll('app')      // { name: 'Core', env: 'production', ... }
 * configAll('database') // { default: 'sqlite', connections: { ... } }
 */
export function configAll<T = ConfigObject>(namespace: string): T | undefined {
  return config<T | undefined>(namespace, undefined);
}

/**
 * Initialize the configuration system.
 * Loads core defaults and merges with user config from app/config/
 */
export async function initConfig(rootDir: string): Promise<void> {
  // Start with core defaults
  configStore = deepClone(coreDefaults) as ConfigObject;

  // Load user configs from app/config/
  const userConfigDir = path.join(rootDir, "app", "config");
  const userConfigs = await loadConfigDir(userConfigDir);

  // Merge user configs over defaults
  for (const [namespace, values] of Object.entries(userConfigs)) {
    if (namespace in configStore && typeof configStore[namespace] === "object") {
      configStore[namespace] = deepMerge(
        configStore[namespace] as ConfigObject,
        values as ConfigObject
      );
    } else {
      configStore[namespace] = values;
    }
  }

  initialized = true;
}

/**
 * Check if config is initialized.
 */
export function isConfigInitialized(): boolean {
  return initialized;
}

/**
 * Reset config (mainly for testing).
 */
export function resetConfig(): void {
  configStore = {};
  initialized = false;
}

/**
 * Load all config files from a directory.
 */
async function loadConfigDir(dir: string): Promise<ConfigObject> {
  const configs: ConfigObject = {};

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name);
      if (ext !== ".ts" && ext !== ".js") continue;

      const name = path.basename(entry.name, ext);
      const filePath = path.join(dir, entry.name);

      try {
        const mod = await import(pathToFileURL(filePath).href);
        configs[name] = mod.default ?? mod;
      } catch (error) {
        console.error(`Failed to load config file ${entry.name}:`, error);
      }
    }
  } catch (error) {
    // Directory doesn't exist - that's fine
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return configs;
}

/**
 * Deep clone an object.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as T;
  }

  const cloned: ConfigObject = {};
  for (const [key, value] of Object.entries(obj)) {
    cloned[key] = deepClone(value);
  }
  return cloned as T;
}

/**
 * Deep merge two objects. Source values override target.
 */
function deepMerge(target: ConfigObject, source: ConfigObject): ConfigObject {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      key in result &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as ConfigObject, value as ConfigObject);
    } else {
      result[key] = value;
    }
  }

  return result;
}
