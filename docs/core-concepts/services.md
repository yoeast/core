# Services

> Singleton services with lifecycle hooks for managing external resources.

## TL;DR

```ts
// app/services/database.ts
import { Service } from "@yoeast/core";
import mongoose from "mongoose";

export default class DatabaseService extends Service {
  async boot() {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Database connected");
  }

  async shutdown() {
    await mongoose.disconnect();
  }
}
```

```ts
// Usage anywhere
import { service } from "@yoeast/core";
import type DatabaseService from "@app/services/database";

const db = service<DatabaseService>("database");
```

## Quick Reference

### Service Class
| Method | Required | Called When |
|--------|----------|-------------|
| `boot()` | Yes | Server starts |
| `shutdown()` | No | Server stops |

### Helper Functions
| Function | Returns | Description |
|----------|---------|-------------|
| `service<T>(name)` | `T` | Get service by name |
| `hasService(name)` | `boolean` | Check if service exists |
| `getServiceNames()` | `string[]` | List all services |

## Guide

### Creating a Service

Create a file in `app/services/`:

```ts
// app/services/redis.ts
import { Service } from "@yoeast/core";
import Redis from "ioredis";

export default class RedisService extends Service {
  client!: Redis;

  async boot() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
    });
  }

  async shutdown() {
    await this.client.quit();
  }

  // Custom methods
  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }
}
```

### Using a Service

Access services anywhere in your application:

```ts
import { service } from "@yoeast/core";
import type RedisService from "@app/services/redis";

// In a controller
export default class CacheController extends Controller {
  async handle() {
    const redis = service<RedisService>("redis");
    
    const cached = await redis.get("mykey");
    if (cached) {
      return this.json({ data: cached, cached: true });
    }
    
    const data = await expensiveOperation();
    await redis.set("mykey", JSON.stringify(data), 300);
    
    return this.json({ data, cached: false });
  }
}
```

### Service Naming

Service name comes from the filename (without extension):

```
app/services/
├── database.ts     → service("database")
├── redis.ts        → service("redis")
├── email.ts        → service("email")
└── analytics.ts    → service("analytics")
```

### Boot Order

Services boot in filesystem order (alphabetically). If you need specific ordering, prefix with numbers:

```
app/services/
├── 01-database.ts   → boots first
├── 02-cache.ts      → boots second
└── 03-search.ts     → boots third
```

> **Note:** Exact boot order depends on how the filesystem returns files. Use numeric prefixes for guaranteed ordering.

### Checking Service Availability

```ts
import { hasService, getServiceNames } from "@yoeast/core";

if (hasService("redis")) {
  const redis = service<RedisService>("redis");
  // Use redis...
}

// List all services
const names = getServiceNames();
// ["database", "redis", "email"]
```

### Error Handling

If `boot()` throws, the server won't start:

```ts
async boot() {
  try {
    await this.connect();
  } catch (error) {
    console.error("Failed to connect:", error);
    throw error; // Server startup will fail
  }
}
```

### Graceful Shutdown

`shutdown()` is called in reverse order when the server stops:

```ts
async shutdown() {
  // Close connections
  await this.client.close();
  
  // Clear intervals
  clearInterval(this.heartbeat);
  
  // Flush buffers
  await this.flush();
}
```

### Example: Email Service

```ts
// app/services/email.ts
import { Service } from "@yoeast/core";
import nodemailer from "nodemailer";

export default class EmailService extends Service {
  private transporter!: nodemailer.Transporter;

  async boot() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    // Verify connection
    await this.transporter.verify();
  }

  async send(to: string, subject: string, html: string) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async shutdown() {
    this.transporter.close();
  }
}
```

### Example: External API Service

```ts
// app/services/stripe.ts
import { Service } from "@yoeast/core";
import Stripe from "stripe";

export default class StripeService extends Service {
  client!: Stripe;

  async boot() {
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });
  }

  async createPaymentIntent(amount: number, currency = "usd") {
    return this.client.paymentIntents.create({
      amount,
      currency,
    });
  }

  async getCustomer(id: string) {
    return this.client.customers.retrieve(id);
  }
}
```

## See Also

- [Database Service](./services/database.md) - MongoDB/Mongoose setup
- [Configuration](../getting-started/configuration.md) - Environment variables
- [Controllers](./controllers.md) - Using services in controllers
