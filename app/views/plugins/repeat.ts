/**
 * Repeat content helper.
 * Usage: {{#repeat 5}}content{{/repeat}}
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  hbs.registerHelper("repeat", function (this: unknown, n: number, options: Handlebars.HelperOptions) {
    let result = "";
    for (let i = 0; i < n; i++) {
      result += options.fn(this);
    }
    return result;
  });
}
