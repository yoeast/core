/**
 * Utility helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Concatenate values
  hbs.registerHelper("concat", (...args: unknown[]) => {
    return args.slice(0, -1).join("");
  });

  // Default/fallback value
  hbs.registerHelper("default", (value: unknown, defaultValue: unknown) => {
    return value ?? defaultValue;
  });

  // Coalesce - return first truthy value
  hbs.registerHelper("coalesce", (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.find((v) => v) ?? values[values.length - 1];
  });

  // Check if value is defined (not null/undefined)
  hbs.registerHelper("isDefined", (value: unknown) => {
    return value !== null && value !== undefined;
  });

  // Check if value is empty (null, undefined, empty string, empty array)
  hbs.registerHelper("isEmpty", (value: unknown) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  });

  // Type checking
  hbs.registerHelper("isArray", (value: unknown) => Array.isArray(value));
  hbs.registerHelper("isObject", (value: unknown) => typeof value === "object" && value !== null && !Array.isArray(value));
  hbs.registerHelper("isString", (value: unknown) => typeof value === "string");
  hbs.registerHelper("isNumber", (value: unknown) => typeof value === "number");
  hbs.registerHelper("isBoolean", (value: unknown) => typeof value === "boolean");
}
