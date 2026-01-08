# Layouts

> Wrap page content in a consistent structure.

## TL;DR

```html
<!-- app/views/layouts/main.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <header>{{> partials/nav}}</header>
  <main>{{{content}}}</main>
  <footer>&copy; {{year}} My App</footer>
</body>
</html>
```

```ts
// Uses main layout by default
return this.render("home", { title: "Welcome" });

// Use different layout
return this.render("dashboard", data, { layout: "layouts/admin" });

// No layout
return this.render("email/welcome", data, { layout: false });
```

## Quick Reference

### Layout Location
```
app/views/layouts/
├── main.html      # Default layout
├── admin.html     # Admin layout
└── email.html     # Email layout
```

### Special Variables
| Variable | Description |
|----------|-------------|
| `{{{content}}}` | Page content (unescaped) |
| `{{title}}` | Page title from render data |
| Any data | All render data is available |

## Guide

### Default Layout

Create `app/views/layouts/main.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{default title "My App"}}</title>
  
  <!-- Styles -->
  <link rel="stylesheet" href="/css/app.css">
  
  <!-- Resource hints -->
  {{preconnect "https://fonts.googleapis.com"}}
  {{preload "/css/app.css" "style"}}
</head>
<body>
  <!-- Navigation -->
  {{> partials/nav}}
  
  <!-- Flash messages -->
  {{#if flash}}
    <div class="flash flash-{{flash.type}}">
      {{flash.message}}
    </div>
  {{/if}}
  
  <!-- Page content inserted here -->
  <main>
    {{{content}}}
  </main>
  
  <!-- Footer -->
  {{> partials/footer}}
  
  <!-- Scripts -->
  <script src="/js/app.js"></script>
</body>
</html>
```

### Using Layouts

By default, all pages use `layouts/main`:

```ts
// app/routes/home.get.ts
export default class HomeController extends Controller {
  async handle() {
    return this.render("home", {
      title: "Welcome",
      user: await this.getUser(),
    });
  }
}
```

```html
<!-- app/views/pages/home.html -->
<h1>Welcome, {{user.name}}!</h1>
<p>This content is wrapped by the layout.</p>
```

### Different Layouts

Use a different layout for specific pages:

```ts
// Admin pages use admin layout
return this.render("admin/dashboard", data, { 
  layout: "layouts/admin" 
});
```

```html
<!-- app/views/layouts/admin.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Admin - {{title}}</title>
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin">
  <aside class="sidebar">
    {{> partials/admin-nav}}
  </aside>
  <main class="admin-content">
    {{{content}}}
  </main>
</body>
</html>
```

### No Layout

Render without a layout (useful for emails, partials, API responses):

```ts
// Email templates
return this.render("email/welcome", { 
  name: user.name,
  confirmUrl: url,
}, { layout: false });

// HTMX partials
return this.render("partials/user-list", { 
  users 
}, { layout: false });
```

### Nested Layouts

Create section-specific layouts that extend the main layout:

```html
<!-- app/views/layouts/docs.html -->
{{!-- This is a standalone layout, not nested --}}
<!DOCTYPE html>
<html>
<head>
  <title>Docs - {{title}}</title>
</head>
<body>
  <div class="docs-layout">
    <nav class="docs-sidebar">
      {{> partials/docs-nav}}
    </nav>
    <article class="docs-content">
      {{{content}}}
    </article>
  </div>
</body>
</html>
```

### Passing Data to Layouts

All data passed to `render()` is available in the layout:

```ts
return this.render("page", {
  title: "My Page",
  user: currentUser,
  nav: { active: "home" },
  meta: {
    description: "Page description",
    keywords: ["key1", "key2"],
  },
});
```

```html
<!-- In layout -->
<head>
  <title>{{title}}</title>
  {{#if meta.description}}
    <meta name="description" content="{{meta.description}}">
  {{/if}}
</head>
<body>
  <nav>
    <a href="/" class="{{#eq nav.active 'home'}}active{{/eq}}">Home</a>
  </nav>
  
  {{#if user}}
    <span>Welcome, {{user.name}}</span>
  {{/if}}
  
  {{{content}}}
</body>
```

### Layout Configuration

Set default layout in config:

```ts
// app/config/views.ts
export default {
  defaultLayout: "layouts/main",  // Default layout for all pages
  cache: true,
  cachePath: "storage/views",
};
```

## See Also

- [Views](../views.md) - Template overview
- [Partials](./partials.md) - Reusable components
- [Helpers](./helpers.md) - Built-in helpers
