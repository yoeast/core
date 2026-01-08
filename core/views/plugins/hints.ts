/**
 * Resource hints Handlebars helpers.
 * 
 * Generates <link> tags for preload, preconnect, prefetch, and dns-prefetch.
 * 
 * @example
 * {{preload "/css/app.css" as="style"}}
 * {{preload "/fonts/inter.woff2" as="font" crossorigin=true}}
 * {{preconnect "https://api.example.com"}}
 * {{prefetch "/api/users"}}
 * {{dnsPrefetch "https://analytics.example.com"}}
 * 
 * istanbul ignore file - requires build artifacts for meaningful testing
 */

import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  /**
   * Generate a preload link tag.
   * @example {{preload "/css/app.css" as="style"}}
   * @example {{preload "/fonts/inter.woff2" as="font" crossorigin=true}}
   */
  hbs.registerHelper("preload", function(href: string, options: Handlebars.HelperOptions) {
    const hash = options.hash || {};
    const attrs: string[] = [
      'rel="preload"',
      `href="${escapeAttr(href)}"`,
    ];
    
    if (hash.as) {
      attrs.push(`as="${escapeAttr(hash.as)}"`);
    }
    
    if (hash.crossorigin) {
      if (hash.crossorigin === true) {
        attrs.push("crossorigin");
      } else {
        attrs.push(`crossorigin="${escapeAttr(hash.crossorigin)}"`);
      }
    }
    
    if (hash.type) {
      attrs.push(`type="${escapeAttr(hash.type)}"`);
    }
    
    if (hash.media) {
      attrs.push(`media="${escapeAttr(hash.media)}"`);
    }
    
    if (hash.integrity) {
      attrs.push(`integrity="${escapeAttr(hash.integrity)}"`);
    }
    
    if (hash.fetchpriority) {
      attrs.push(`fetchpriority="${escapeAttr(hash.fetchpriority)}"`);
    }
    
    return new hbs.SafeString(`<link ${attrs.join(" ")}>`);
  });

  /**
   * Generate a preconnect link tag.
   * @example {{preconnect "https://api.example.com"}}
   * @example {{preconnect "https://cdn.example.com" crossorigin=true}}
   */
  hbs.registerHelper("preconnect", function(href: string, options: Handlebars.HelperOptions) {
    const hash = options.hash || {};
    const attrs: string[] = [
      'rel="preconnect"',
      `href="${escapeAttr(href)}"`,
    ];
    
    if (hash.crossorigin) {
      if (hash.crossorigin === true) {
        attrs.push("crossorigin");
      } else {
        attrs.push(`crossorigin="${escapeAttr(hash.crossorigin)}"`);
      }
    }
    
    return new hbs.SafeString(`<link ${attrs.join(" ")}>`);
  });

  /**
   * Generate a prefetch link tag.
   * @example {{prefetch "/next-page.html"}}
   * @example {{prefetch "/api/data" as="fetch"}}
   */
  hbs.registerHelper("prefetch", function(href: string, options: Handlebars.HelperOptions) {
    const hash = options.hash || {};
    const attrs: string[] = [
      'rel="prefetch"',
      `href="${escapeAttr(href)}"`,
    ];
    
    if (hash.as) {
      attrs.push(`as="${escapeAttr(hash.as)}"`);
    }
    
    if (hash.crossorigin) {
      if (hash.crossorigin === true) {
        attrs.push("crossorigin");
      } else {
        attrs.push(`crossorigin="${escapeAttr(hash.crossorigin)}"`);
      }
    }
    
    return new hbs.SafeString(`<link ${attrs.join(" ")}>`);
  });

  /**
   * Generate a dns-prefetch link tag.
   * @example {{dnsPrefetch "https://analytics.example.com"}}
   */
  hbs.registerHelper("dnsPrefetch", function(href: string) {
    return new hbs.SafeString(`<link rel="dns-prefetch" href="${escapeAttr(href)}">`);
  });

  /**
   * Generate multiple resource hint tags from an array.
   * @example {{resourceHints hints}}
   */
  hbs.registerHelper("resourceHints", function(hints: Array<{
    type: string;
    href: string;
    as?: string;
    crossorigin?: boolean | string;
    media?: string;
    mimeType?: string;
    integrity?: string;
    fetchpriority?: string;
  }>) {
    if (!hints || !Array.isArray(hints)) {
      return "";
    }
    
    const tags = hints.map(hint => {
      const attrs: string[] = [
        `rel="${escapeAttr(hint.type)}"`,
        `href="${escapeAttr(hint.href)}"`,
      ];
      
      if (hint.as) {
        attrs.push(`as="${escapeAttr(hint.as)}"`);
      }
      
      if (hint.crossorigin) {
        if (hint.crossorigin === true) {
          attrs.push("crossorigin");
        } else {
          attrs.push(`crossorigin="${escapeAttr(String(hint.crossorigin))}"`);
        }
      }
      
      if (hint.media) {
        attrs.push(`media="${escapeAttr(hint.media)}"`);
      }
      
      if (hint.mimeType) {
        attrs.push(`type="${escapeAttr(hint.mimeType)}"`);
      }
      
      if (hint.integrity) {
        attrs.push(`integrity="${escapeAttr(hint.integrity)}"`);
      }
      
      if (hint.fetchpriority) {
        attrs.push(`fetchpriority="${escapeAttr(hint.fetchpriority)}"`);
      }
      
      return `<link ${attrs.join(" ")}>`;
    });
    
    return new hbs.SafeString(tags.join("\n"));
  });
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
