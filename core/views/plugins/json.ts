/**
 * JSON helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Output value as JSON (pretty printed)
  hbs.registerHelper("json", (value: unknown) => {
    return JSON.stringify(value, null, 2);
  });

  // Output value as inline JSON (no pretty print)
  hbs.registerHelper("jsonInline", (value: unknown) => {
    return JSON.stringify(value);
  });
}
