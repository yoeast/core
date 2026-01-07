/**
 * Number formatting helpers for Handlebars.
 */
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Format number with locale separators (1234567 -> "1,234,567")
  hbs.registerHelper("formatNumber", (value: number) => {
    if (value === null || value === undefined) return "0";
    return value.toLocaleString();
  });

  // Format as currency
  hbs.registerHelper("formatCurrency", (value: number, currency?: string) => {
    if (value === null || value === undefined) return "$0.00";
    const cur = typeof currency === "string" ? currency : "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
    }).format(value);
  });

  // Format bytes to human readable (1024 -> "1 KB")
  hbs.registerHelper("formatBytes", (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  });

  // Format percentage
  hbs.registerHelper("formatPercent", (value: number, decimals?: number) => {
    const dec = typeof decimals === "number" ? decimals : 1;
    return `${(value * 100).toFixed(dec)}%`;
  });
}
