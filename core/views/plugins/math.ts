/**
 * Math helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  hbs.registerHelper("add", (a: number, b: number) => a + b);
  hbs.registerHelper("subtract", (a: number, b: number) => a - b);
  hbs.registerHelper("multiply", (a: number, b: number) => a * b);
  hbs.registerHelper("divide", (a: number, b: number) => (b !== 0 ? a / b : 0));
  hbs.registerHelper("mod", (a: number, b: number) => a % b);
  hbs.registerHelper("ceil", (a: number) => Math.ceil(a));
  hbs.registerHelper("floor", (a: number) => Math.floor(a));
  hbs.registerHelper("round", (a: number) => Math.round(a));
  hbs.registerHelper("abs", (a: number) => Math.abs(a));
  
  // Min/max with multiple args - use type assertion to handle Handlebars options object
  hbs.registerHelper("min", (...args: unknown[]) => Math.min(...(args.slice(0, -1) as number[])));
  hbs.registerHelper("max", (...args: unknown[]) => Math.max(...(args.slice(0, -1) as number[])));

  // Power and sqrt
  hbs.registerHelper("pow", (base: number, exp: number) => Math.pow(base, exp));
  hbs.registerHelper("sqrt", (a: number) => Math.sqrt(a));

  // Clamp value between min and max
  hbs.registerHelper("clamp", (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  });
}
