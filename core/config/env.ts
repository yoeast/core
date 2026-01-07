/**
 * Environment variable helper with type coercion.
 * Bun automatically loads .env files.
 */

type EnvValue = string | number | boolean | undefined;

/**
 * Get an environment variable with optional default and type coercion.
 */
export function env(key: string): string | undefined;
export function env(key: string, defaultValue: string): string;
export function env(key: string, defaultValue: number): number;
export function env(key: string, defaultValue: boolean): boolean;
export function env<T extends EnvValue>(key: string, defaultValue?: T): T | string | undefined {
  const value = process.env[key];

  if (value === undefined) {
    return defaultValue;
  }

  // Coerce based on default value type
  if (typeof defaultValue === "boolean") {
    return coerceBoolean(value) as T;
  }

  if (typeof defaultValue === "number") {
    return coerceNumber(value, defaultValue) as T;
  }

  return value;
}

/**
 * Require an environment variable (throws if missing).
 */
export function envRequired(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function coerceBoolean(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes" || lower === "on";
}

function coerceNumber(value: string, defaultValue: number): number {
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}
