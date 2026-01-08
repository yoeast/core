# Public Directory

> Static files served directly by the HTTP server.

## TL;DR

```
public/
├── css/
│   └── app.css
├── js/
│   └── app.js
├── images/
│   └── logo.png
└── favicon.ico
```

Files are served at their path: `public/css/app.css` → `/css/app.css`

## Structure

| Path | URL | Description |
|------|-----|-------------|
| `public/css/` | `/css/` | Stylesheets |
| `public/js/` | `/js/` | JavaScript |
| `public/images/` | `/images/` | Images |
| `public/fonts/` | `/fonts/` | Web fonts |
| `public/favicon.ico` | `/favicon.ico` | Favicon |
| `public/robots.txt` | `/robots.txt` | Robots file |

## Guide

### Adding Static Files

Place files in `public/` to serve them:

```
public/
├── css/
│   ├── app.css
│   └── vendor/
│       └── bootstrap.css
├── js/
│   ├── app.js
│   └── vendor/
│       └── alpine.js
└── images/
    ├── logo.png
    └── hero.jpg
```

Access in HTML:
```html
<link rel="stylesheet" href="/css/app.css">
<script src="/js/app.js"></script>
<img src="/images/logo.png" alt="Logo">
```

### Favicon

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
└── apple-touch-icon.png
```

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### Robots.txt

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### Manifest

```json
// public/manifest.json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Fonts

```
public/fonts/
├── inter.woff2
├── inter-bold.woff2
└── custom-icons.woff2
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

### Build Output

If using a build tool, output to `public/`:

```js
// vite.config.js
export default {
  build: {
    outDir: 'public/build',
  },
};
```

```
public/
├── build/           # Built assets
│   ├── app.js
│   └── app.css
└── images/          # Static images
```

### Cache Headers

Static files are served with a single cache policy based on `static.maxAge`
from config (default: 1 day). This applies to all files under `public/`.

### MIME Types

Files are served with correct MIME types based on extension:

| Extension | MIME Type |
|-----------|-----------|
| `.html` | `text/html` |
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.jpg` | `image/jpeg` |
| `.svg` | `image/svg+xml` |
| `.woff2` | `font/woff2` |

### Security

Static files still go through global middleware, so:
- Don't put sensitive files in `public/`
- Use appropriate file permissions
- Consider a CDN for production

## See Also

- [Views](../core-concepts/views.md) - HTML templates
- [Resource Hints](../core-concepts/controllers/hints.md) - Preloading assets
