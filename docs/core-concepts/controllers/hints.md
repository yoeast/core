# Resource Hints

> Optimize page load with preload, preconnect, and prefetch hints.

## TL;DR

```ts
// app/routes/index.get.ts
import { Controller } from "@core";

export default class HomeController extends Controller {
  async handle() {
    this.preload("/styles/main.css", "style");
    this.preconnect("https://api.example.com");
    
    return this.render("home");
  }
}
```

Response includes `Link` header:
```
Link: </styles/main.css>; rel=preload; as=style, <https://api.example.com>; rel=preconnect
```

## Quick Reference

### Controller Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `preload(href, as)` | Load critical resource early | `this.preload("/app.js", "script")` |
| `preconnect(href)` | Establish early connection | `this.preconnect("https://cdn.example.com")` |
| `prefetch(href)` | Load for next navigation | `this.prefetch("/next-page.js", "script")` |
| `dnsPrefetch(href)` | Resolve DNS early | `this.dnsPrefetch("https://analytics.example.com")` |

### Resource Types (`as` values)

| Type | Use For |
|------|---------|
| `script` | JavaScript files |
| `style` | CSS files |
| `font` | Font files |
| `image` | Images |
| `fetch` | API requests |
| `document` | HTML documents |

## Guide

### Preload Critical Resources

Preload tells the browser to fetch resources needed for the current page:

```ts
export default class PageController extends Controller {
  async handle() {
    // Critical CSS
    this.preload("/styles/critical.css", "style");
    
    // JavaScript needed immediately
    this.preload("/scripts/app.js", "script");
    
    // Hero image
    this.preload("/images/hero.webp", "image");
    
    return this.render("page");
  }
}
```

### Preconnect to Third-Party Origins

Speed up requests to external services:

```ts
export default class PageController extends Controller {
  async handle() {
    // CDN for static assets
    this.preconnect("https://cdn.example.com");
    
    // API server
    this.preconnect("https://api.example.com");
    
    // Analytics (DNS only - lighter weight)
    this.dnsPrefetch("https://analytics.example.com");
    
    return this.render("page");
  }
}
```

### Prefetch Next Page Resources

Load resources the user will likely need next:

```ts
export default class ArticleController extends Controller {
  async handle() {
    const article = await this.getArticle();
    
    // Prefetch likely next articles
    if (article.nextArticle) {
      this.prefetch(`/articles/${article.nextArticle}`, "document");
    }
    
    return this.render("article", { article });
  }
}
```

### Cross-Origin Fonts

Fonts require `crossorigin` attribute:

```ts
export default class PageController extends Controller {
  async handle() {
    this.preload("https://fonts.example.com/font.woff2", "font", {
      crossorigin: "anonymous",
    });
    
    return this.render("page");
  }
}
```

### Global Hints via Config

Add hints to all responses in `app/config/hints.ts`:

```ts
// app/config/hints.ts
export default {
  preconnect: [
    { href: "https://cdn.example.com" },
    { href: "https://fonts.googleapis.com" },
  ],
  preload: [
    { href: "/styles/global.css", as: "style" },
  ],
  dnsPrefetch: [
    { href: "https://analytics.example.com" },
  ],
};
```

### Handlebars Helpers

Use in templates for HTML `<link>` tags:

```html
<!-- In <head> -->
{{preload "/styles/main.css" as="style"}}
{{preconnect "https://api.example.com"}}
{{dnsPrefetch "https://analytics.example.com"}}

<!-- Output a list of hints (array passed from controller) -->
{{resourceHints hints}}
```

Output:
```html
<link rel="preload" href="/styles/main.css" as="style">
<link rel="preconnect" href="https://api.example.com">
<link rel="dns-prefetch" href="https://analytics.example.com">
```

## API Reference

### Controller Methods

```ts
class Controller {
  preload(href: string, as: AsType, options?: HintOptions): void;
  preconnect(href: string, crossorigin?: CrossOrigin): void;
  prefetch(href: string, as?: AsType): void;
  dnsPrefetch(href: string): void;
}

type AsType = "script" | "style" | "font" | "image" | "fetch" | "document" | "audio" | "video" | "track" | "worker";
type CrossOrigin = "anonymous" | "use-credentials";

interface HintOptions {
  crossorigin?: CrossOrigin;
  mimeType?: string;    // MIME type
  media?: string;       // Media query
  integrity?: string;   // Subresource integrity
  fetchpriority?: "high" | "low" | "auto";
}
```

### Hint Types

```ts
interface PreloadHint {
  rel: "preload";
  href: string;
  as: AsType;
  crossorigin?: CrossOrigin;
  mimeType?: string;
  media?: string;
}

interface PreconnectHint {
  rel: "preconnect";
  href: string;
  crossorigin?: CrossOrigin;
}

interface PrefetchHint {
  rel: "prefetch";
  href: string;
  as?: AsType;
}

interface DnsPrefetchHint {
  rel: "dns-prefetch";
  href: string;
}
```

### Config Schema

```ts
// app/config/hints.ts
interface HintsConfig {
  preconnect?: Array<{ href: string; crossorigin?: CrossOrigin }>;
  preload?: Array<{ href: string; as: AsType; crossorigin?: CrossOrigin; type?: string }>;
  prefetch?: Array<{ href: string; as?: AsType }>;
  dnsPrefetch?: Array<{ href: string }>;
}
```

### Utility Functions

```ts
import { buildLinkHeader, buildLinkTags, configToHints } from "@core";

// Build HTTP Link header from hints
const header = buildLinkHeader(hints);
// "</style.css>; rel=preload; as=style"

// Build HTML <link> tags
const html = buildLinkTags(hints);
// '<link rel="preload" href="/style.css" as="style">'

// Convert config to hint array
const hints = configToHints(config);
```

## Notes

- **HTTP/2 Server Push** is not supported (Bun.serve limitation)
- **103 Early Hints** is not supported (Bun.serve limitation, [issue #8690](https://github.com/oven-sh/bun/issues/8690))
- Link headers are the current best practice and work well with HTTP/2

## See Also

- [Controllers](../controllers.md)
- [Configuration](../../getting-started/configuration.md)
- [Views](../views.md)
