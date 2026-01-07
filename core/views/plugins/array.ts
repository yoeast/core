/**
 * Array and collection helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Get array length
  hbs.registerHelper("length", (arr: unknown[]) => {
    return Array.isArray(arr) ? arr.length : 0;
  });

  // Get first element
  hbs.registerHelper("first", (arr: unknown[]) => {
    return Array.isArray(arr) ? arr[0] : undefined;
  });

  // Get last element
  hbs.registerHelper("last", (arr: unknown[]) => {
    return Array.isArray(arr) ? arr[arr.length - 1] : undefined;
  });

  // Get nth element (0-indexed)
  hbs.registerHelper("nth", (arr: unknown[], index: number) => {
    return Array.isArray(arr) ? arr[index] : undefined;
  });

  // Join array with separator
  hbs.registerHelper("join", (arr: unknown[], separator?: string) => {
    const sep = typeof separator === "string" ? separator : ", ";
    return Array.isArray(arr) ? arr.join(sep) : "";
  });

  // Check if array includes value
  hbs.registerHelper("includes", (arr: unknown[], value: unknown) => {
    return Array.isArray(arr) && arr.includes(value);
  });

  // Range helper: {{#each (range 1 10)}}{{this}}{{/each}}
  hbs.registerHelper("range", (start: number, end: number) => {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  });

  // Slice array
  hbs.registerHelper("slice", (arr: unknown[], start: number, end?: number) => {
    if (!Array.isArray(arr)) return [];
    return typeof end === "number" ? arr.slice(start, end) : arr.slice(start);
  });

  // Take first n elements
  hbs.registerHelper("take", (arr: unknown[], n: number) => {
    return Array.isArray(arr) ? arr.slice(0, n) : [];
  });

  // Skip first n elements
  hbs.registerHelper("skip", (arr: unknown[], n: number) => {
    return Array.isArray(arr) ? arr.slice(n) : [];
  });

  // Reverse array
  hbs.registerHelper("reverse", (arr: unknown[]) => {
    return Array.isArray(arr) ? [...arr].reverse() : [];
  });

  // Sort array (by optional key for objects)
  hbs.registerHelper("sort", (arr: unknown[], key?: string) => {
    if (!Array.isArray(arr)) return [];
    const sorted = [...arr];
    if (typeof key === "string") {
      sorted.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[key];
        const bVal = (b as Record<string, unknown>)[key];
        return String(aVal).localeCompare(String(bVal));
      });
    } else {
      sorted.sort();
    }
    return sorted;
  });
}
