---
description: Create a new user in the database
argument-hint: <email> <password> [name]
---

Create a new user with the provided credentials:

```bash
bun cli skill:run user-management --action=create --email=$1 --password=$2 --name="$3"
```
