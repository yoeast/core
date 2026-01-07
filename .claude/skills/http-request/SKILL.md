---
name: http-request
description: Make HTTP requests to external APIs and services via CLI
---

# HTTP Request

Make HTTP requests to external APIs and services.

## Usage

```bash
bun cli skill:run http-request --url=<url> [options]
```

## Examples

### GET request
```bash
bun cli skill:run http-request --url=https://api.example.com/users
```

### POST with JSON body
```bash
bun cli skill:run http-request --url=https://api.example.com/users --method=POST --body='{"name":"John"}'
```

### With headers
```bash
bun cli skill:run http-request --url=https://api.example.com/users --headers='{"Authorization":"Bearer token123"}'
```

### With query parameters
```bash
bun cli skill:run http-request --url=https://api.example.com/search --query='{"q":"search term","limit":"10"}'
```

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | yes | The URL to request |
| method | string | no | HTTP method (default: GET) |
| body | JSON string | no | Request body (for POST/PUT/PATCH) |
| headers | JSON string | no | Additional headers to send |
| query | JSON string | no | Query parameters to append to URL |
| timeout | number | no | Request timeout in ms (default: 30000) |

## Outputs

Returns JSON with:
- `success`: boolean
- `status`: HTTP status code
- `statusText`: HTTP status text
- `headers`: Response headers
- `body`: Response body (parsed as JSON if possible)
- `error`: Error message (on failure)
