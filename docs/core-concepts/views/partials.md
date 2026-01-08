# Partials

> Reusable template fragments.

## TL;DR

```html
<!-- app/views/partials/user-card.html -->
<div class="user-card">
  <img src="{{avatar}}" alt="{{name}}">
  <h3>{{name}}</h3>
  <p>{{email}}</p>
</div>
```

```html
<!-- Include partial -->
{{> partials/user-card user}}

<!-- In a loop -->
{{#each users}}
  {{> partials/user-card this}}
{{/each}}
```

## Quick Reference

### Partial Location
```
app/views/partials/
├── nav.html
├── footer.html
├── user-card.html
└── forms/
    ├── input.html
    └── button.html
```

### Include Syntax
| Syntax | Description |
|--------|-------------|
| `{{> name}}` | Include with current context |
| `{{> name data}}` | Include with specific data |
| `{{> name key=value}}` | Include with hash params |

## Guide

### Basic Partials

Create a partial in `app/views/partials/`:

```html
<!-- app/views/partials/alert.html -->
<div class="alert alert-{{type}}">
  {{#if dismissible}}
    <button class="close">&times;</button>
  {{/if}}
  <p>{{message}}</p>
</div>
```

Include it in a page:

```html
{{> partials/alert type="success" message="Saved!" dismissible=true}}
```

### Context Passing

**Current context** - partial receives all current variables:

```html
<!-- page.html with { user: { name: "John" } } -->
{{> partials/greeting}}
<!-- greeting.html can access {{user.name}} -->
```

**Specific object** - pass an object as context:

```html
{{> partials/user-card user}}
<!-- user-card.html receives user's properties directly -->
<!-- Can use {{name}} instead of {{user.name}} -->
```

**Hash parameters** - pass named values:

```html
{{> partials/button text="Submit" type="primary" disabled=false}}
```

### Navigation Partial

```html
<!-- app/views/partials/nav.html -->
<nav class="main-nav">
  <a href="/" class="{{#eq currentPath '/'}}active{{/eq}}">Home</a>
  <a href="/about" class="{{#eq currentPath '/about'}}active{{/eq}}">About</a>
  <a href="/contact" class="{{#eq currentPath '/contact'}}active{{/eq}}">Contact</a>
  
  {{#if user}}
    <div class="user-menu">
      <span>{{user.name}}</span>
      <a href="/logout">Logout</a>
    </div>
  {{else}}
    <a href="/login">Login</a>
  {{/if}}
</nav>
```

### Form Components

Create reusable form elements:

```html
<!-- app/views/partials/forms/input.html -->
<div class="form-group {{#if error}}has-error{{/if}}">
  <label for="{{id}}">{{label}}</label>
  <input 
    type="{{default type 'text'}}"
    id="{{id}}"
    name="{{name}}"
    value="{{value}}"
    placeholder="{{placeholder}}"
    {{#if required}}required{{/if}}
    {{#if disabled}}disabled{{/if}}
  >
  {{#if error}}
    <span class="error-text">{{error}}</span>
  {{/if}}
  {{#if hint}}
    <span class="hint-text">{{hint}}</span>
  {{/if}}
</div>
```

Usage:

```html
<form method="POST">
  {{> partials/forms/input 
      id="email" 
      name="email" 
      label="Email Address" 
      type="email"
      required=true
      error=errors.email
  }}
  
  {{> partials/forms/input 
      id="password" 
      name="password" 
      label="Password" 
      type="password"
      required=true
      hint="Minimum 8 characters"
  }}
  
  {{> partials/forms/button text="Sign In" type="submit"}}
</form>
```

### Card Component

```html
<!-- app/views/partials/card.html -->
<div class="card {{#if featured}}card-featured{{/if}}">
  {{#if image}}
    <img src="{{image}}" class="card-image" alt="{{title}}">
  {{/if}}
  <div class="card-body">
    <h3 class="card-title">{{title}}</h3>
    {{#if subtitle}}
      <p class="card-subtitle">{{subtitle}}</p>
    {{/if}}
    <div class="card-content">
      {{{content}}}
    </div>
    {{#if actions}}
      <div class="card-actions">
        {{#each actions}}
          <a href="{{url}}" class="btn btn-{{default type 'secondary'}}">
            {{label}}
          </a>
        {{/each}}
      </div>
    {{/if}}
  </div>
</div>
```

### Lists with Partials

```html
<!-- app/views/partials/user-row.html -->
<tr>
  <td>{{name}}</td>
  <td>{{email}}</td>
  <td>{{formatDate createdAt "short"}}</td>
  <td>
    <a href="/users/{{id}}/edit">Edit</a>
    <a href="/users/{{id}}/delete" class="danger">Delete</a>
  </td>
</tr>
```

```html
<!-- In page -->
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Created</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {{#each users}}
      {{> partials/user-row this}}
    {{/each}}
    {{#unless users.length}}
      <tr>
        <td colspan="4">No users found</td>
      </tr>
    {{/unless}}
  </tbody>
</table>
```

### Nested Partials

Partials can include other partials:

```html
<!-- app/views/partials/comment.html -->
<div class="comment" id="comment-{{id}}">
  {{> partials/user-avatar user}}
  <div class="comment-body">
    <span class="comment-author">{{user.name}}</span>
    <span class="comment-date">{{timeAgo createdAt}}</span>
    <p>{{content}}</p>
  </div>
  {{#if replies.length}}
    <div class="comment-replies">
      {{#each replies}}
        {{> partials/comment this}}
      {{/each}}
    </div>
  {{/if}}
</div>
```

### Inline Partials (Handlebars Feature)

Define and use partials within a template:

```html
{{#*inline "item"}}
  <li class="{{#if active}}active{{/if}}">
    {{label}}
  </li>
{{/inline}}

<ul>
  {{#each items}}
    {{> item this}}
  {{/each}}
</ul>
```

### Dynamic Partial Names

Use a helper to select partials dynamically:

```html
{{!-- Using a variable for partial name --}}
{{> (lookup . "partialName") data}}
```

Or create a helper:

```ts
// app/views/plugins/dynamic.ts
hbs.registerHelper("dynamicPartial", function(name, options) {
  const partial = hbs.partials[name];
  if (partial) {
    return new hbs.SafeString(partial(this));
  }
  return "";
});
```

### Organizing Partials

For larger applications, organize by feature:

```
app/views/partials/
├── common/
│   ├── nav.html
│   ├── footer.html
│   └── pagination.html
├── forms/
│   ├── input.html
│   ├── select.html
│   └── button.html
├── users/
│   ├── card.html
│   ├── avatar.html
│   └── list-item.html
└── posts/
    ├── card.html
    ├── preview.html
    └── meta.html
```

Include with full path:

```html
{{> partials/users/card user}}
{{> partials/forms/input id="email"}}
```

## See Also

- [Views](../views.md) - Template overview
- [Layouts](./layouts.md) - Page layouts
- [Helpers](./helpers.md) - Built-in helpers
