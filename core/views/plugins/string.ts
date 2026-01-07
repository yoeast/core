/**
 * String manipulation helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Truncate string with ellipsis
  hbs.registerHelper("truncate", (str: string, length?: number) => {
    const len = typeof length === "number" ? length : 100;
    if (!str || str.length <= len) return str;
    return str.slice(0, len) + "...";
  });

  // Uppercase
  hbs.registerHelper("uppercase", (str: string) => {
    return str?.toUpperCase() ?? "";
  });

  // Lowercase
  hbs.registerHelper("lowercase", (str: string) => {
    return str?.toLowerCase() ?? "";
  });

  // Capitalize first letter
  hbs.registerHelper("capitalize", (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Title case
  hbs.registerHelper("titleCase", (str: string) => {
    if (!str) return "";
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  });

  // URL encode
  hbs.registerHelper("urlencode", (str: string) => {
    return encodeURIComponent(str ?? "");
  });

  // Pluralize (1 "item", 2 "items")
  hbs.registerHelper("pluralize", (count: number, singular: string, plural?: string) => {
    const p = typeof plural === "string" ? plural : `${singular}s`;
    return count === 1 ? singular : p;
  });

  // Slugify string
  hbs.registerHelper("slugify", (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  });
}
