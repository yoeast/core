/**
 * Resource hints configuration.
 * 
 * Define critical resources that should be preloaded/preconnected
 * on every page for optimal performance. These are sent as HTTP Link headers.
 * 
 * Note: HTTP 103 Early Hints not yet supported by Bun.serve.
 * Link headers still provide benefits as browsers process headers before body.
 */

export default {
  /**
   * Resources to preload (high priority, needed for current page).
   * Use for critical CSS, fonts, and above-the-fold images.
   */
  preload: [
    // { href: "/css/app.css", as: "style" },
    // { href: "/fonts/inter-var.woff2", as: "font", crossorigin: true },
    // { href: "/js/app.js", as: "script" },
  ],

  /**
   * Origins to preconnect (establish early TCP/TLS connection).
   * Use for APIs and CDNs you'll fetch from.
   */
  preconnect: [
    // { href: "https://api.example.com" },
    // { href: "https://cdn.example.com", crossorigin: true },
  ],

  /**
   * Resources to prefetch (low priority, might be needed for next navigation).
   * Use for resources likely needed on the next page.
   */
  prefetch: [
    // { href: "/api/user" },
  ],

  /**
   * DNS to prefetch (resolve DNS early without connection).
   * Use for third-party services you might use.
   */
  dnsPrefetch: [
    // { href: "https://analytics.example.com" },
  ],
};
