---
name: user-management
description: Manage users in the database - create, update, delete, and find users via CLI
---

# User Management

Manage users in the database - create, update, delete, and find users.

## Usage

```bash
bun cli skill:run user-management --action=<action> [options]
```

## Actions

### create
Create a new user.

```bash
bun cli skill:run user-management --action=create --email=user@example.com --password=secret123 --name="John Doe"
```

**Required:** `--email`, `--password`
**Optional:** `--name`

### find
Find users by email or list all.

```bash
bun cli skill:run user-management --action=find --email=user@example.com
bun cli skill:run user-management --action=find --limit=10
```

**Optional:** `--email`, `--limit` (default: 10)

### update
Update an existing user.

```bash
bun cli skill:run user-management --action=update --id=<user_id> --name="New Name"
```

**Required:** `--id`
**Optional:** `--email`, `--name`, `--password`

### delete
Delete a user by ID.

```bash
bun cli skill:run user-management --action=delete --id=<user_id>
```

**Required:** `--id`

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | yes | One of: create, find, update, delete |
| email | string | create: yes | User's email address |
| password | string | create: yes | User's password (will be hashed) |
| name | string | no | User's display name |
| id | string | update/delete: yes | User's MongoDB ObjectId |
| limit | number | no | Max results for find (default: 10) |

## Outputs

Returns JSON with:
- `success`: boolean
- `user`: User object (for create/find single)
- `users`: Array of users (for find multiple)
- `message`: Status message
- `error`: Error message (on failure)
