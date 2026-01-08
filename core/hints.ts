/**
 * Resource Hints - Preload, Preconnect, Prefetch support.
 * 
 * Enables HTTP 103 Early Hints and <link> tag generation for resource optimization.
 * 
 * @example Config-based hints (app/config/hints.ts):
 * ```ts
 * export default {
 *   preload: [
 *     { href: "/css/app.css", as: "style" },
 *     { href: "/fonts/inter.woff2", as: "font", crossorigin: true },
 *   ],
 *   preconnect: [
 *     { href: "https://api.example.com" },
 *     { href: "https://cdn.example.com", crossorigin: true },
 *   ],
 * };
 * ```
 * 
 * @example Controller-based hints:
 * ```ts
 * export default class PageController extends Controller {
 *   async handle() {
 *     this.preload("/css/page-specific.css", "style");
 *     this.preconnect("https://analytics.example.com");
 *     return this.render("page");
 *   }
 * }
 * ```
 */

/**
 * Resource hint types.
 */
export type HintType = "preload" | "preconnect" | "prefetch" | "dns-prefetch" | "prerender";

/**
 * Resource types for preload "as" attribute.
 */
export type ResourceType = 
  | "audio"
  | "document"
  | "embed"
  | "fetch"
  | "font"
  | "image"
  | "object"
  | "script"
  | "style"
  | "track"
  | "video"
  | "worker";

/**
 * Single resource hint configuration.
 */
export interface ResourceHint {
  /** The URL of the resource */
  href: string;
  /** Hint type */
  type: HintType;
  /** Resource type (required for preload) */
  as?: ResourceType;
  /** CORS mode */
  crossorigin?: boolean | "anonymous" | "use-credentials";
  /** Media query */
  media?: string;
  /** MIME type */
  mimeType?: string;
  /** Integrity hash */
  integrity?: string;
  /** Fetch priority */
  fetchpriority?: "high" | "low" | "auto";
}

/**
 * Hints configuration structure.
 */
export interface HintsConfig {
  /** Resources to preload (fetched with high priority, needed for current page) */
  preload?: Array<Omit<ResourceHint, "type"> & { as: ResourceType }>;
  /** Origins to preconnect (establish early connection) */
  preconnect?: Array<{ href: string; crossorigin?: boolean | "anonymous" | "use-credentials" }>;
  /** Resources to prefetch (low priority, might be needed for next navigation) */
  prefetch?: Array<Omit<ResourceHint, "type">>;
  /** DNS to prefetch */
  dnsPrefetch?: Array<{ href: string }>;
}

/**
 * Build a Link header value from hints.
 */
export function buildLinkHeader(hints: ResourceHint[]): string {
  return hints.map(hint => {
    const parts: string[] = [`<${hint.href}>`];
    parts.push(`rel=${hint.type}`);
    
    if (hint.as) {
      parts.push(`as=${hint.as}`);
    }
    
    if (hint.crossorigin) {
      if (hint.crossorigin === true || hint.crossorigin === "anonymous") {
        parts.push("crossorigin");
      } else {
        parts.push(`crossorigin=${hint.crossorigin}`);
      }
    }
    
    if (hint.mimeType) {
      parts.push(`type=${hint.mimeType}`);
    }
    
    return parts.join("; ");
  }).join(", ");
}

/**
 * Build HTML <link> tags from hints.
 */
export function buildLinkTags(hints: ResourceHint[]): string {
  return hints.map(hint => {
    const attrs: string[] = [
      `rel="${hint.type}"`,
      `href="${escapeHtml(hint.href)}"`,
    ];
    
    if (hint.as) {
      attrs.push(`as="${hint.as}"`);
    }
    
    if (hint.crossorigin) {
      if (hint.crossorigin === true || hint.crossorigin === "anonymous") {
        attrs.push("crossorigin");
      } else {
        attrs.push(`crossorigin="${hint.crossorigin}"`);
      }
    }
    
    if (hint.media) {
      attrs.push(`media="${escapeHtml(hint.media)}"`);
    }
    
    if (hint.mimeType) {
      attrs.push(`type="${escapeHtml(hint.mimeType)}"`);
    }
    
    if (hint.integrity) {
      attrs.push(`integrity="${escapeHtml(hint.integrity)}"`);
    }
    
    if (hint.fetchpriority) {
      attrs.push(`fetchpriority="${hint.fetchpriority}"`);
    }
    
    return `<link ${attrs.join(" ")}>`;
  }).join("\n");
}

/**
 * Convert config format to ResourceHint array.
 */
export function configToHints(config: HintsConfig): ResourceHint[] {
  const hints: ResourceHint[] = [];
  
  if (config.preload) {
    for (const item of config.preload) {
      hints.push({ ...item, type: "preload" });
    }
  }
  
  if (config.preconnect) {
    for (const item of config.preconnect) {
      hints.push({ ...item, type: "preconnect" });
    }
  }
  
  if (config.prefetch) {
    for (const item of config.prefetch) {
      hints.push({ ...item, type: "prefetch" });
    }
  }
  
  if (config.dnsPrefetch) {
    for (const item of config.dnsPrefetch) {
      hints.push({ ...item, type: "dns-prefetch" });
    }
  }
  
  return hints;
}

/**
 * Simple HTML escape for attribute values.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Hint collector for building up hints during request handling.
 */
export class HintCollector {
  private hints: ResourceHint[] = [];
  
  /**
   * Add a preload hint.
   */
  preload(href: string, as: ResourceType, options?: { 
    crossorigin?: boolean | "anonymous" | "use-credentials";
    media?: string;
    mimeType?: string;
    integrity?: string;
    fetchpriority?: "high" | "low" | "auto";
  }): void {
    this.hints.push({
      href,
      type: "preload",
      as,
      ...options,
    });
  }
  
  /**
   * Add a preconnect hint.
   */
  preconnect(href: string, crossorigin?: boolean | "anonymous" | "use-credentials"): void {
    this.hints.push({
      href,
      type: "preconnect",
      crossorigin,
    });
  }
  
  /**
   * Add a prefetch hint.
   */
  prefetch(href: string, as?: ResourceType): void {
    this.hints.push({
      href,
      type: "prefetch",
      as,
    });
  }
  
  /**
   * Add a DNS prefetch hint.
   */
  dnsPrefetch(href: string): void {
    this.hints.push({
      href,
      type: "dns-prefetch",
    });
  }
  
  /**
   * Add a raw hint.
   */
  addHint(hint: ResourceHint): void {
    this.hints.push(hint);
  }
  
  /**
   * Get all collected hints.
   */
  getHints(): ResourceHint[] {
    return [...this.hints];
  }
  
  /**
   * Check if any hints have been added.
   */
  hasHints(): boolean {
    return this.hints.length > 0;
  }
  
  /**
   * Clear all hints.
   */
  clear(): void {
    this.hints = [];
  }
  
  /**
   * Merge with config hints.
   */
  mergeConfig(config: HintsConfig): ResourceHint[] {
    const configHints = configToHints(config);
    return [...configHints, ...this.hints];
  }
}
