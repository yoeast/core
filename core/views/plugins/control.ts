/**
 * Control flow helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Switch/case helpers
  hbs.registerHelper("switch", function (this: Record<string, unknown>, value: unknown, options: Handlebars.HelperOptions) {
    this._switchValue = value;
    const result = options.fn(this);
    delete this._switchValue;
    return result;
  });

  hbs.registerHelper("case", function (this: Record<string, unknown>, value: unknown, options: Handlebars.HelperOptions) {
    if (value === this._switchValue) {
      return options.fn(this);
    }
    return "";
  });

  hbs.registerHelper("defaultCase", function (this: Record<string, unknown>, options: Handlebars.HelperOptions) {
    return options.fn(this);
  });

  // Times helper: {{#times 5}}...{{/times}}
  hbs.registerHelper("times", function (this: unknown, n: number, options: Handlebars.HelperOptions) {
    let result = "";
    for (let i = 0; i < n; i++) {
      result += options.fn({ ...(this as object), index: i, first: i === 0, last: i === n - 1 });
    }
    return result;
  });

  // Repeat helper with separator: {{#repeat items ", "}}{{name}}{{/repeat}}
  hbs.registerHelper("repeat", function (this: unknown, arr: unknown[], separator: string | Handlebars.HelperOptions, options?: Handlebars.HelperOptions) {
    if (!Array.isArray(arr)) return "";
    
    // Handle case where separator is actually options (no separator provided)
    const opts = typeof separator === "object" ? separator : options!;
    const sep = typeof separator === "string" ? separator : "";
    
    return arr.map((item, index) => opts.fn({ 
      ...(item as object), 
      index, 
      first: index === 0, 
      last: index === arr.length - 1 
    })).join(sep);
  });
}
