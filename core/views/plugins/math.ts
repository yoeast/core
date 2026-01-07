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
  
  // Min/max with multiple args
  hbs.registerHelper("min", (...args: number[]) => Math.min(...args.slice(0, -1)));
  hbs.registerHelper("max", (...args: number[]) => Math.max(...args.slice(0, -1)));

  // Power and sqrt
  hbs.registerHelper("pow", (base: number, exp: number) => Math.pow(base, exp));
  hbs.registerHelper("sqrt", (a: number) => Math.sqrt(a));

  // Clamp value between min and max
  hbs.registerHelper("clamp", (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  });
}
