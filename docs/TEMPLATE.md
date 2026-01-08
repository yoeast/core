# Documentation Format Template

This template defines the standard format for Core framework documentation.

## Structure

Every doc should follow this structure:

```
# Feature Name

> One-line description of what this feature does.

## TL;DR

[Minimal working example - copy-paste ready]

## Quick Reference

[Table or bullet list of options/methods/config]

## Guide

[Step-by-step explanation with examples]

### Subsection 1
### Subsection 2

## API Reference

[Detailed types, parameters, return values]

## See Also

[Links to related docs]
```

## Guidelines

### TL;DR Section
- **Must be copy-paste ready** - a developer should be able to use the feature immediately
- Maximum 20 lines of code
- Include file path as comment
- No explanation text - just the code

### Quick Reference Section
- Use tables for options/config
- Use bullet lists for methods
- Include types and defaults
- Keep descriptions to one line

### Guide Section
- Start with the most common use case
- Progress from simple to complex
- Each example should be complete and runnable
- Explain the "why" not just the "how"

### API Reference Section
- Full TypeScript types
- All parameters documented
- Return values explained
- Edge cases noted

## Example

See `docs/guides/cors.md` for a reference implementation.
