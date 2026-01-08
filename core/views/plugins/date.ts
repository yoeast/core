/**
 * Date and time helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Format date (default: "January 1, 2024")
  hbs.registerHelper("formatDate", (date: string | Date, format?: string) => {
    const d = new Date(date);
    if (format === "short") {
      return d.toLocaleDateString();
    }
    if (format === "iso") {
      return d.toISOString();
    }
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // Format datetime
  hbs.registerHelper("formatDateTime", (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  // Format time only
  hbs.registerHelper("formatTime", (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  // Relative time ("2 hours ago", "in 3 days")
  hbs.registerHelper("timeAgo", (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const absDiff = Math.abs(diffMs);
    const isFuture = diffMs < 0;

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let result: string;
    if (years > 0) result = `${years} year${years > 1 ? "s" : ""}`;
    else if (months > 0) result = `${months} month${months > 1 ? "s" : ""}`;
    else if (days > 0) result = `${days} day${days > 1 ? "s" : ""}`;
    else if (hours > 0) result = `${hours} hour${hours > 1 ? "s" : ""}`;
    else if (minutes > 0) result = `${minutes} minute${minutes > 1 ? "s" : ""}`;
    else return "just now";

    return isFuture ? `in ${result}` : `${result} ago`;
  });

  // Current year (useful for copyright)
  hbs.registerHelper("year", () => new Date().getFullYear());

  // Current timestamp
  hbs.registerHelper("now", () => new Date().toISOString());
}
