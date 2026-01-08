# Views

> Handlebars templates for rendering HTML.

## TL;DR

```ts
// app/routes/home.get.ts
import { Controller } from "@yoeast/core";

export default class HomeController extends Controller {
  async handle() {
    return this.render("home", { 
      title: "Welcome",
      user: { name: "John" },
    });
  }
}
```

```html
<!-- app/views/pages/home.html -->
<h1>{{title}}</h1>
<p>Hello, {{user.name}}!</p>
```

## Quick Reference

### Directory Structure
```
app/views/
├── layouts/        # Layout templates
│   └── main.html   # Default layout
├── pages/          # Page templates
├── partials/       # Reusable partials
└── plugins/        # Custom helpers
```

### Template Syntax
| Syntax | Description |
|--------|-------------|
| `{{variable}}` | Output (escaped) |
| `{{{variable}}}` | Output (unescaped HTML) |
| `{{#if}}...{{/if}}` | Conditional |
| `{{#each}}...{{/each}}` | Loop |
| `{{> partial}}` | Include partial |
| `{{helper arg}}` | Call helper |

### Render Options
```ts
this.render(name, data?, { layout?, status?, ttl?, key?, noCache? })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `layout` | `string \| false` | `"layouts/main"` | Layout template |
| `status` | `number` | `200` | HTTP status code |
| `ttl` | `number` | - | Cache TTL (seconds) |

## Guide

### Basic Rendering

Render a page with data:

```ts
// app/routes/about.get.ts
export default class AboutController extends Controller {
  async handle() {
    return this.render("about", {
      title: "About Us",
      description: "We are a company...",
    });
  }
}
```

```html
<!-- app/views/pages/about.html -->
<h1>{{title}}</h1>
<p>{{description}}</p>
```

### Layouts

Templates are wrapped in a layout by default:

```html
<!-- app/views/layouts/main.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <header>{{> partials/nav}}</header>
  <main>
    {{{content}}}  <!-- Page content goes here -->
  </main>
  <footer>{{> partials/footer}}</footer>
</body>
</html>
```

Use a different layout:

```ts
return this.render("dashboard", data, { layout: "layouts/admin" });
```

No layout:

```ts
return this.render("email/welcome", data, { layout: false });
```

### Partials

Create reusable template fragments:

```html
<!-- app/views/partials/user-card.html -->
<div class="user-card">
  <img src="{{avatar}}" alt="{{name}}">
  <h3>{{name}}</h3>
  <p>{{email}}</p>
</div>
```

Include partials:

```html
{{> partials/user-card user}}

{{#each users}}
  {{> partials/user-card this}}
{{/each}}
```

### Conditionals

```html
{{#if user}}
  <p>Welcome, {{user.name}}!</p>
{{else}}
  <p>Please log in</p>
{{/if}}

{{#unless disabled}}
  <button>Submit</button>
{{/unless}}
```

### Loops

```html
{{#each items}}
  <li>{{this}}</li>
{{/each}}

{{#each users}}
  <div>
    <span>{{@index}}.</span>
    <span>{{name}} - {{email}}</span>
    {{#if @first}}(first){{/if}}
    {{#if @last}}(last){{/if}}
  </div>
{{/each}}
```

### HTML Escaping

Double braces escape HTML (safe):

```html
{{userInput}}
<!-- <script>alert('xss')</script> becomes &lt;script&gt;... -->
```

Triple braces output raw HTML (careful!):

```html
{{{richContent}}}
<!-- Outputs HTML as-is -->
```

### Custom Helpers

Create helpers in `app/views/plugins/`:

```ts
// app/views/plugins/format.ts
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Simple helper
  hbs.registerHelper("uppercase", (str: string) => {
    return str?.toUpperCase() ?? "";
  });

  // Helper with options
  hbs.registerHelper("formatDate", (date: Date, format: string) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: format === "short" ? "short" : "long",
    }).format(date);
  });

  // Block helper
  hbs.registerHelper("times", (n: number, options) => {
    let result = "";
    for (let i = 0; i < n; i++) {
      result += options.fn({ index: i });
    }
    return result;
  });
}
```

Use in templates:

```html
{{uppercase name}}

{{formatDate createdAt "short"}}

{{#times 3}}
  <p>Item {{index}}</p>
{{/times}}
```

### Built-in Helpers

Core includes many helpers:

```html
<!-- String helpers -->
{{lowercase name}}
{{uppercase name}}
{{capitalize name}}
{{truncate description 100}}

<!-- Array helpers -->
{{length items}}
{{first items}}
{{last items}}
{{join tags ", "}}

<!-- Comparison helpers -->
{{#eq status "active"}}Active{{/eq}}
{{#ne status "deleted"}}Not deleted{{/ne}}
{{#gt count 0}}Has items{{/gt}}
{{#lt count 100}}Under limit{{/lt}}

<!-- Logic helpers -->
{{#and isAdmin isVerified}}Admin access{{/and}}
{{#or isAdmin isModerator}}Moderator panel{{/or}}
{{#not isDisabled}}Enabled{{/not}}

<!-- JSON helper -->
<script>const data = {{{json user}}};</script>
```

## See Also

- [Layouts](./views/layouts.md) - Page layouts
- [Partials](./views/partials.md) - Reusable components
- [Helpers](./views/helpers.md) - Built-in and custom helpers
- [Controllers](./controllers.md) - Using `render()`
- [Resource Hints](./controllers/hints.md) - Preload helpers
