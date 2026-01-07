/**
 * Highlight text helper.
 * Usage: {{highlight text query}}
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  hbs.registerHelper("highlight", (text: string, query: string) => {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return new hbs.SafeString(text.replace(regex, "<mark>$1</mark>"));
  });
}
