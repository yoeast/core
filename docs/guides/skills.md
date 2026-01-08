# Skills

> AI-invokable capabilities for automation.

## TL;DR

```ts
// .claude/skills/greeting/handler.ts
interface Input {
  name: string;
  formal?: boolean;
}

interface Output {
  message: string;
}

export async function execute(input: Input): Promise<Output> {
  const greeting = input.formal ? "Good day" : "Hello";
  return { message: `${greeting}, ${input.name}!` };
}
```

```bash
bun cli skill:run greeting --name=John --formal=true
```

## Quick Reference

### File Structure
```
.claude/skills/
└── skill-name/
    ├── SKILL.md      # Documentation
    └── handler.ts    # Implementation
```

### CLI Commands
| Command | Description |
|---------|-------------|
| `skill:list` | List available skills |
| `skill:run <name>` | Run a skill |


## Guide

### Creating a Skill

Skills live in `.claude/skills/<name>/`:

```ts
// .claude/skills/email-sender/handler.ts
interface Input {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

interface Output {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function execute(input: Input): Promise<Output> {
  try {
    const { to, subject, body, template } = input;
    
    // Send email logic...
    const messageId = await sendEmail(to, subject, body);
    
    return { success: true, messageId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Documenting Skills

Create `SKILL.md` for AI agents:

```markdown
# Email Sender

Send emails via the configured email service.

## Usage

\`\`\`bash
bun cli skill:run email-sender --to=user@example.com --subject="Hello" --body="Hi there!"
\`\`\`

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email |
| `subject` | string | Yes | Email subject |
| `body` | string | Yes | Email body |
| `template` | string | No | Template name |

## Output

\`\`\`json
{
  "success": true,
  "messageId": "abc123"
}
\`\`\`

## Examples

Send a welcome email:
\`\`\`bash
bun cli skill:run email-sender \
  --to=new-user@example.com \
  --subject="Welcome!" \
  --body="Welcome to our platform."
\`\`\`
```

### Running Skills

Via CLI:
```bash
# List skills
bun cli skill:list

# Run with options
bun cli skill:run greeting --name=John --formal=true

# JSON input
bun cli skill:run my-skill --payload='{"role":"admin"}'
```

### Skill with Database Access

```ts
// .claude/skills/user-stats/handler.ts
import mongoose from "mongoose";
import { User } from "@app/models/User";

interface Input {
  period?: "day" | "week" | "month";
}

interface Output {
  total: number;
  newUsers: number;
  activeUsers: number;
}

export async function execute(input: Input): Promise<Output> {
  const period = input.period ?? "day";
  
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period];
  
  const since = new Date(Date.now() - periodMs);
  
  const [total, newUsers, activeUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ lastLogin: { $gte: since } }),
  ]);
  
  return { total, newUsers, activeUsers };
}
```

### Error Handling

Return errors in output:

```ts
export async function execute(input: Input): Promise<Output> {
  if (!input.email) {
    return { 
      success: false, 
      error: "Email is required",
    };
  }
  
  try {
    // ... operation
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Best Practices

1. **Document thoroughly** - AI agents rely on SKILL.md
2. **Return structured output** - Always include `success` field
3. **Handle errors gracefully** - Return error details, don't throw
4. **Use typed interfaces** - Clear Input/Output types
5. **Keep focused** - One skill = one capability
6. **Idempotent operations** - Safe to run multiple times

## See Also

- [CLI](./cli.md) - Command-line interface
- [Configuration](./config.md) - Environment setup
