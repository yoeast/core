# Built-in Helpers

> Handlebars helpers included in Core.

## TL;DR

```html
{{uppercase name}}
{{formatDate createdAt "short"}}
{{#eq status "active"}}✓ Active{{/eq}}
{{#each (take users 5)}}...{{/each}}
```

## Quick Reference

### String Helpers
| Helper | Example | Output |
|--------|---------|--------|
| `uppercase` | `{{uppercase "hello"}}` | `HELLO` |
| `lowercase` | `{{lowercase "HELLO"}}` | `hello` |
| `capitalize` | `{{capitalize "hello world"}}` | `Hello world` |
| `titleCase` | `{{titleCase "hello world"}}` | `Hello World` |
| `truncate` | `{{truncate text 50}}` | `First 50 chars...` |
| `slugify` | `{{slugify "Hello World"}}` | `hello-world` |
| `urlencode` | `{{urlencode str}}` | URL-encoded string |
| `pluralize` | `{{pluralize count "item"}}` | `items` or `item` |

### Array Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `length` | `{{length items}}` | Array length |
| `first` | `{{first items}}` | First element |
| `last` | `{{last items}}` | Last element |
| `nth` | `{{nth items 2}}` | Element at index |
| `take` | `{{#each (take items 5)}}` | First N elements |
| `skip` | `{{#each (skip items 2)}}` | Skip first N |
| `join` | `{{join tags ", "}}` | Join with delimiter |
| `reverse` | `{{#each (reverse items)}}` | Reverse order |
| `sort` | `{{#each (sort items)}}` | Sort array |
| `sort` | `{{#each (sort items "name")}}` | Sort by property |
| `slice` | `{{#each (slice items 0 5)}}` | Slice array |
| `includes` | `{{#if (includes items "x")}}` | Check if contains |
| `range` | `{{#each (range 1 5)}}` | Generate range |

### Comparison Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `eq` | `{{#if (eq a b)}}...{{/if}}` | Equal |
| `ne` | `{{#if (ne a b)}}...{{/if}}` | Not equal |
| `gt` | `{{#if (gt a b)}}...{{/if}}` | Greater than |
| `gte` | `{{#if (gte a b)}}...{{/if}}` | Greater or equal |
| `lt` | `{{#if (lt a b)}}...{{/if}}` | Less than |
| `lte` | `{{#if (lte a b)}}...{{/if}}` | Less or equal |

### Logic Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `and` | `{{#if (and a b)}}...{{/if}}` | Both true |
| `or` | `{{#if (or a b)}}...{{/if}}` | Either true |
| `not` | `{{#if (not a)}}...{{/if}}` | Negation |
| `default` | `{{default value "N/A"}}` | Default value |
| `coalesce` | `{{coalesce a b c}}` | First truthy |
| `isDefined` | `{{#if (isDefined x)}}` | Check if defined |
| `isEmpty` | `{{#if (isEmpty arr)}}` | Check if empty |
| `concat` | `{{concat "a" "b" "c"}}` | Concatenate values |

### Date Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `formatDate` | `{{formatDate date "short"}}` | Format date |
| `formatDateTime` | `{{formatDateTime date}}` | Date and time |
| `formatTime` | `{{formatTime date}}` | Time only |
| `timeAgo` | `{{timeAgo date}}` | Relative time |
| `year` | `{{year}}` | Current year |

### Number Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `formatNumber` | `{{formatNumber 1000}}` | `1,000` |
| `formatCurrency` | `{{formatCurrency 99.99 "USD"}}` | `$99.99` |
| `formatBytes` | `{{formatBytes 1024}}` | `1 KB` |
| `formatPercent` | `{{formatPercent 0.85}}` | `85%` |

### Math Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `add` | `{{add a b}}` | a + b |
| `subtract` | `{{subtract a b}}` | a - b |
| `multiply` | `{{multiply a b}}` | a * b |
| `divide` | `{{divide a b}}` | a / b |
| `mod` | `{{mod a b}}` | a % b |
| `abs` | `{{abs n}}` | Absolute value |
| `round` | `{{round n}}` | Round |
| `ceil` | `{{ceil n}}` | Round up |
| `floor` | `{{floor n}}` | Round down |
| `min` | `{{min a b c}}` | Minimum |
| `max` | `{{max a b c}}` | Maximum |
| `pow` | `{{pow a b}}` | a ^ b |
| `sqrt` | `{{sqrt n}}` | Square root |
| `clamp` | `{{clamp val min max}}` | Clamp value |

### JSON Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `json` | `{{{json data}}}` | JSON stringify |
| `jsonInline` | `{{{jsonInline data}}}` | Inline JSON |

### Type Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `isArray` | `{{#if (isArray x)}}` | Is array |
| `isObject` | `{{#if (isObject x)}}` | Is object |
| `isString` | `{{#if (isString x)}}` | Is string |
| `isNumber` | `{{#if (isNumber x)}}` | Is number |
| `isBoolean` | `{{#if (isBoolean x)}}` | Is boolean |

### Control Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `switch`/`case`/`defaultCase` | `{{#switch status}}{{#case "ok"}}...{{/case}}{{/switch}}` | Switch/case |
| `times` | `{{#times 3}}...{{/times}}` | Repeat N times |
| `repeat` | `{{#repeat items ", "}}...{{/repeat}}` | Repeat with separator |
| `ifEquals` | `{{#ifEquals a b}}...{{/ifEquals}}` | Block equality |
| `ifGt` | `{{#ifGt a b}}...{{/ifGt}}` | Block greater-than |
| `ifLt` | `{{#ifLt a b}}...{{/ifLt}}` | Block less-than |
| `ifNot` | `{{#ifNot a}}...{{/ifNot}}` | Block negation |

### Debug Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `log` | `{{log value}}` | Log to console |
| `debug` | `{{{debug value}}}` | Render debug block |
| `debugContext` | `{{{debugContext}}}` | Render full context |
| `breakpoint` | `{{breakpoint}}` | Log context breakpoint |

### Resource Hint Helpers
| Helper | Example | Description |
|--------|---------|-------------|
| `preload` | `{{preload "/app.css" as="style"}}` | Preload resource |
| `preconnect` | `{{preconnect "https://cdn.example.com"}}` | Preconnect |
| `prefetch` | `{{prefetch "/next"}}` | Prefetch |
| `dnsPrefetch` | `{{dnsPrefetch "https://api.example.com"}}` | DNS prefetch |
| `resourceHints` | `{{resourceHints hints}}` | Render hint list |

## Guide

### String Helpers

```html
<!-- Case conversion -->
<p>{{uppercase name}}</p>        <!-- JOHN DOE -->
<p>{{lowercase name}}</p>        <!-- john doe -->
<p>{{capitalize name}}</p>       <!-- John doe -->
<p>{{titleCase name}}</p>        <!-- John Doe -->

<!-- Truncate with ellipsis -->
<p>{{truncate description 100}}</p>

<!-- URL and slugs -->
<p>{{slugify "Hello World"}}</p>  <!-- hello-world -->
<p>{{urlencode text}}</p>

<!-- Pluralization -->
<p>{{pluralize count "item"}}</p>  <!-- "items" or "item" -->
<p>{{pluralize count "person" "people"}}</p>

<!-- Concatenation -->
<p>{{concat firstName " " lastName}}</p>
```

### Array Helpers

```html
<!-- Basic array info -->
<p>{{length items}} items</p>
<p>First: {{first items}}</p>
<p>Last: {{last items}}</p>
<p>Third: {{nth items 2}}</p>

<!-- Slicing -->
{{#each (take users 5)}}
  <div>{{name}}</div>
{{/each}}

{{#each (skip items 2)}}
  <div>{{this}}</div>
{{/each}}

{{#each (slice items 0 5)}}
  <div>{{this}}</div>
{{/each}}

<!-- Joining -->
<p>Tags: {{join tags ", "}}</p>

<!-- Sorting -->
{{#each (sort items)}}
  <li>{{this}}</li>
{{/each}}

{{#each (sort users "name")}}
  <div>{{name}}</div>
{{/each}}

<!-- Checking -->
{{#if (includes roles "admin")}}
  <span>Admin</span>
{{/if}}

<!-- Generate range -->
{{#each (range 1 10)}}
  <option value="{{this}}">{{this}}</option>
{{/each}}
```

### Comparison Helpers

```html
{{#if (eq status "active")}}
  <span class="badge badge-success">Active</span>
{{/if}}

{{#if (ne role "guest")}}
  <a href="/settings">Settings</a>
{{/if}}

{{#if (gt count 0)}}
  <p>You have {{count}} items</p>
{{else}}
  <p>No items yet</p>
{{/if}}

{{#if (gte score 90)}}
  <span>A</span>
{{else}}
  {{#if (gte score 80)}}
    <span>B</span>
  {{else}}
    <span>C</span>
  {{/if}}
{{/if}}
```

### Logic Helpers

```html
{{#if (and isAdmin isVerified)}}
  <a href="/admin">Admin Panel</a>
{{/if}}

{{#if (or isAdmin isModerator)}}
  <a href="/moderation">Moderation</a>
{{/if}}

{{#if (not isDisabled)}}
  <button>Submit</button>
{{/if}}

<!-- Default values -->
<p>Name: {{default name "Anonymous"}}</p>
<img src="{{default avatar "/images/default-avatar.png"}}">

<!-- Coalesce (first truthy value) -->
<p>{{coalesce nickname name email "Unknown"}}</p>

<!-- Check if defined -->
{{#if (isDefined user)}}
  <p>User exists</p>
{{/if}}
```

### Date Helpers

```html
<!-- Format dates -->
<p>{{formatDate createdAt "short"}}</p>    <!-- 1/15/24 -->
<p>{{formatDate createdAt "medium"}}</p>   <!-- Jan 15, 2024 -->
<p>{{formatDate createdAt "long"}}</p>     <!-- January 15, 2024 -->

<!-- Date and time -->
<p>{{formatDateTime createdAt}}</p>
<p>{{formatTime createdAt}}</p>

<!-- Relative time -->
<p>Posted {{timeAgo createdAt}}</p>        <!-- 2 hours ago -->
<p>Last login: {{timeAgo lastLogin}}</p>   <!-- 3 days ago -->

<!-- Current year -->
<footer>&copy; {{year}} My Company</footer>
```

### Number Helpers

```html
<p>{{formatNumber 1234567}}</p>           <!-- 1,234,567 -->
<p>{{formatCurrency price "USD"}}</p>     <!-- $99.99 -->
<p>{{formatBytes fileSize}}</p>           <!-- 1.5 MB -->
<p>{{formatPercent ratio}}</p>            <!-- 85% -->
```

### Math Helpers

```html
{{add a b}}           <!-- a + b -->
{{subtract a b}}      <!-- a - b -->
{{multiply a b}}      <!-- a * b -->
{{divide a b}}        <!-- a / b -->
{{mod a b}}           <!-- a % b -->
{{abs n}}             <!-- |n| -->
{{round n}}           <!-- Round to integer -->
{{ceil n}}            <!-- Round up -->
{{floor n}}           <!-- Round down -->
{{min a b c}}         <!-- Minimum value -->
{{max a b c}}         <!-- Maximum value -->
{{pow a b}}           <!-- a ^ b -->
{{sqrt n}}            <!-- Square root -->
{{clamp val 0 100}}   <!-- Clamp between 0 and 100 -->
```

### JSON Helpers

```html
<!-- JSON for JavaScript -->
<script>
  const user = {{{json user}}};
  const config = {{{json settings}}};
</script>

<!-- Inline JSON (no pretty print) -->
<div data-config='{{{jsonInline config}}}'></div>
```

### Resource Hint Helpers

```html
<!-- Preload resources -->
{{preload "/css/app.css" as="style"}}
{{preload "/fonts/custom.woff2" as="font" crossorigin=true}}

<!-- Preconnect to origins -->
{{preconnect "https://api.example.com"}}

<!-- DNS prefetch -->
{{dnsPrefetch "https://analytics.example.com"}}

<!-- Prefetch resources -->
{{prefetch "/next-page.js" as="script"}}

<!-- Render hints passed from controller -->
{{resourceHints hints}}
```

## Creating Custom Helpers

```ts
// app/views/plugins/custom.ts
import type Handlebars from "handlebars";

export function register(hbs: typeof Handlebars): void {
  // Inline helper
  hbs.registerHelper("currency", (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  });

  // Block helper
  hbs.registerHelper("ifCan", function(permission, options) {
    const user = options.data.root.user;
    if (user?.permissions?.includes(permission)) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
}
```

Usage:

```html
<p>Total: {{currency total "EUR"}}</p>

{{#ifCan "edit"}}
  <button>Edit</button>
{{/ifCan}}
```

## See Also

- [Views](../views.md) - Template overview
- [Controllers](../controllers.md) - Using `render()`
