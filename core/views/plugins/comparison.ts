/**
 * Comparison and logical helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Equals
  hbs.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  hbs.registerHelper("ne", (a: unknown, b: unknown) => a !== b);

  // Numeric comparisons
  hbs.registerHelper("gt", (a: number, b: number) => a > b);
  hbs.registerHelper("gte", (a: number, b: number) => a >= b);
  hbs.registerHelper("lt", (a: number, b: number) => a < b);
  hbs.registerHelper("lte", (a: number, b: number) => a <= b);

  // Logical operators
  hbs.registerHelper("and", (...args: unknown[]) => {
    const values = args.slice(0, -1); // Remove Handlebars options object
    return values.every((v) => !!v);
  });

  hbs.registerHelper("or", (...args: unknown[]) => {
    const values = args.slice(0, -1);
    return values.some((v) => !!v);
  });

  hbs.registerHelper("not", (value: unknown) => !value);

  // Block helper: {{#ifEquals a b}}...{{else}}...{{/ifEquals}}
  hbs.registerHelper("ifEquals", function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  // Block helper: {{#ifGt a b}}...{{/ifGt}}
  hbs.registerHelper("ifGt", function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a > b ? options.fn(this) : options.inverse(this);
  });

  // Block helper: {{#ifLt a b}}...{{/ifLt}}
  hbs.registerHelper("ifLt", function (this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    return a < b ? options.fn(this) : options.inverse(this);
  });

  // Block helper: {{#unless condition}}...{{/unless}} is built-in
  // But we add {{#ifNot condition}}...{{/ifNot}} for consistency
  hbs.registerHelper("ifNot", function (this: unknown, value: unknown, options: Handlebars.HelperOptions) {
    return !value ? options.fn(this) : options.inverse(this);
  });
}
