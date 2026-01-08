# Database Service

> MongoDB connection with Mongoose.

## TL;DR

```ts
// app/services/database.ts
import { Service } from "@yoeast/core";
import mongoose from "mongoose";

export default class DatabaseService extends Service {
  async boot() {
    await mongoose.connect(process.env.MONGODB_URI ?? "mongodb://localhost:27017/myapp");
  }

  async shutdown() {
    await mongoose.disconnect();
  }
}
```

## Quick Reference

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/core` | MongoDB connection string |

### Mongoose Methods
| Method | Description |
|--------|-------------|
| `mongoose.connect(uri)` | Connect to MongoDB |
| `mongoose.disconnect()` | Close connection |
| `mongoose.connection.db` | Access raw MongoDB driver |

## Guide

### Basic Setup

Create the database service:

```ts
// app/services/database.ts
import { Service } from "@yoeast/core";
import mongoose from "mongoose";

export default class DatabaseService extends Service {
  async boot() {
    const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/app";
    
    await mongoose.connect(uri, {
      // Options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("Connected to MongoDB");
  }

  async shutdown() {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}
```

### Using with Docker Compose

```yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - ./storage/data/mongo:/data/db
```

```env
# .env
MONGODB_URI=mongodb://localhost:27017/myapp
```

### Creating Models

Models go in `app/models/`:

```ts
// app/models/User.ts
import { Schema, model, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

export const User = model<IUser>("User", userSchema);
```

### Using in Controllers

```ts
// app/routes/users.get.ts
import { Controller } from "@yoeast/core";
import { User } from "@app/models/User";

export default class ListUsersController extends Controller {
  async handle() {
    const page = parseInt(this.getQueryParam("page") ?? "1");
    const limit = 20;
    
    const users = await User.find()
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    return this.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}
```

### Connection Events

Handle connection events:

```ts
async boot() {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });

  await mongoose.connect(process.env.MONGODB_URI!);
}
```

### Raw MongoDB Access

Access the underlying MongoDB driver:

```ts
import mongoose from "mongoose";

// Get the raw database
const db = mongoose.connection.db;

// Use MongoDB driver directly
const result = await db.collection("users").aggregate([
  { $match: { role: "admin" } },
  { $group: { _id: null, count: { $sum: 1 } } },
]).toArray();
```

### Multiple Databases

Connect to multiple databases:

```ts
// app/services/databases.ts
import { Service } from "@yoeast/core";
import mongoose from "mongoose";

export default class DatabasesService extends Service {
  primary!: mongoose.Connection;
  analytics!: mongoose.Connection;

  async boot() {
    this.primary = mongoose.createConnection(process.env.PRIMARY_DB!);
    this.analytics = mongoose.createConnection(process.env.ANALYTICS_DB!);
    
    await Promise.all([
      this.primary.asPromise(),
      this.analytics.asPromise(),
    ]);
  }

  async shutdown() {
    await Promise.all([
      this.primary.close(),
      this.analytics.close(),
    ]);
  }
}
```

## See Also

- [Models](../models.md) - Mongoose model patterns
- [Migrations](../../guides/migrations.md) - Database migrations
- [Seeders](../../guides/seeders.md) - Database seeding
