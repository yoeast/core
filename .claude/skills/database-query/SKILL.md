---
name: database-query
description: Execute MongoDB queries against any collection in the database via CLI
---

# Database Query

Execute MongoDB queries against any collection in the database.

## Usage

```bash
bun cli skill:run database-query --collection=<name> [options]
```

## Examples

### List documents
```bash
bun cli skill:run database-query --collection=users --limit=5
```

### Filter documents
```bash
bun cli skill:run database-query --collection=users --filter='{"email":"test@example.com"}'
```

### Select specific fields
```bash
bun cli skill:run database-query --collection=users --fields=email,name
```

### Sort results
```bash
bun cli skill:run database-query --collection=users --sort=createdAt:desc
```

### Count documents
```bash
bun cli skill:run database-query --collection=users --count
```

### Aggregate pipeline
```bash
bun cli skill:run database-query --collection=users --aggregate='[{"$group":{"_id":"$status","count":{"$sum":1}}}]'
```

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collection | string | yes | Collection name to query |
| filter | JSON string | no | MongoDB filter query |
| fields | string | no | Comma-separated field names to include |
| sort | string | no | Sort field:direction (e.g., createdAt:desc) |
| limit | number | no | Max documents to return (default: 10) |
| skip | number | no | Documents to skip (for pagination) |
| count | boolean | no | Return count instead of documents |
| aggregate | JSON string | no | Aggregation pipeline (overrides other options) |

## Outputs

Returns JSON with:
- `success`: boolean
- `documents`: Array of documents (for find)
- `count`: Number of matching documents
- `total`: Total documents matching filter
- `error`: Error message (on failure)
