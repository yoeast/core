---
name: code-quality
description: Run code quality checks (TypeScript, linting) and optionally fix issues
---

# Code Quality Skill

Run TypeScript and other code quality checks on the codebase. Use this skill to validate code changes before committing.

## Usage

```bash
# Check for errors
bun cli skill:run code-quality

# Check with detailed output
bun cli skill:run code-quality --verbose

# Run in quiet mode (only show errors)
bun cli skill:run code-quality --quiet
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `verbose` | boolean | No | Show detailed output |
| `quiet` | boolean | No | Only show errors |

## Output

Returns a JSON object with:

```json
{
  "success": true,
  "checks": {
    "typescript": {
      "passed": true,
      "errors": []
    }
  },
  "summary": "All checks passed"
}
```

## Error Output

```json
{
  "success": false,
  "checks": {
    "typescript": {
      "passed": false,
      "errors": [
        {
          "file": "app/routes/example.get.ts",
          "line": 5,
          "message": "Property 'foo' does not exist on type 'Controller'"
        }
      ]
    }
  },
  "summary": "1 check failed"
}
```

## When to Use

- Before committing code changes
- After making modifications to validate no errors introduced
- To check if the codebase is in a healthy state
- When TypeScript errors are suspected

## Examples

### Basic check
```bash
bun cli skill:run code-quality
```

### Quiet mode for CI
```bash
bun cli skill:run code-quality --quiet
```
