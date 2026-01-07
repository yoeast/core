---
description: Query the database
argument-hint: <collection> [filter-json]
---

Query a MongoDB collection:

```bash
bun cli skill:run database-query --collection=$1 --filter='$2' --limit=10
```

Examples:
- `/db:query users` - List all users
- `/db:query users {"email":"test@example.com"}` - Find by email
