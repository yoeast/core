/**
 * Debug helpers for Handlebars.
 * Useful during development.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Log to console (development)
  hbs.registerHelper("log", (...args: unknown[]) => {
    console.log("[Handlebars]", ...args.slice(0, -1));
    return "";
  });

  // Dump variable as JSON in template
  hbs.registerHelper("debug", (value: unknown) => {
    return new hbs.SafeString(`<pre style="background:#f5f5f5;padding:1rem;overflow:auto;font-size:12px;">${JSON.stringify(value, null, 2)}</pre>`);
  });

  // Dump all available context
  hbs.registerHelper("debugContext", function (this: unknown) {
    return new hbs.SafeString(`<pre style="background:#f5f5f5;padding:1rem;overflow:auto;font-size:12px;">${JSON.stringify(this, null, 2)}</pre>`);
  });

  // Breakpoint - logs context and returns empty (for debugging template issues)
  hbs.registerHelper("breakpoint", function (this: unknown, label?: string) {
    const name = typeof label === "string" ? label : "breakpoint";
    console.log(`[Handlebars ${name}]`, this);
    return "";
  });
}
