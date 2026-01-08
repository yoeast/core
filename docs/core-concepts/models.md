# Models

> Mongoose models for MongoDB.

## TL;DR

```ts
// app/models/User.ts
import { Schema, model, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
```

## Quick Reference

### File Location
```
app/models/*.ts
```

### Common Schema Types
| Type | Mongoose | TypeScript |
|------|----------|------------|
| String | `String` | `string` |
| Number | `Number` | `number` |
| Boolean | `Boolean` | `boolean` |
| Date | `Date` | `Date` |
| ObjectId | `Schema.Types.ObjectId` | `Types.ObjectId` |
| Array | `[Type]` | `Type[]` |
| Object | `Object` or nested schema | `Record<string, any>` |

### Schema Options
| Option | Description |
|--------|-------------|
| `required` | Field is mandatory |
| `unique` | Create unique index |
| `default` | Default value |
| `enum` | Allowed values |
| `min/max` | Number limits |
| `minlength/maxlength` | String length limits |
| `match` | Regex pattern |
| `index` | Create index |

## Guide

### Basic Model

```ts
// app/models/Post.ts
import { Schema, model, type Document, type Types } from "mongoose";

export interface IPost extends Document {
  title: string;
  slug: string;
  content: string;
  authorId: Types.ObjectId;
  tags: string[];
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    published: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

// Indexes
postSchema.index({ slug: 1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ published: 1, publishedAt: -1 });

export const Post = model<IPost>("Post", postSchema);
```

### Using Models

```ts
import { User } from "@app/models/User";
import { Post } from "@app/models/Post";

// Create
const user = await User.create({
  email: "john@example.com",
  name: "John Doe",
});

// Find
const users = await User.find({ role: "admin" });
const user = await User.findById(id);
const user = await User.findOne({ email: "john@example.com" });

// Update
await User.findByIdAndUpdate(id, { name: "Jane" });
await User.updateMany({ role: "guest" }, { role: "user" });

// Delete
await User.findByIdAndDelete(id);
await User.deleteMany({ createdAt: { $lt: oldDate } });

// Count
const count = await User.countDocuments({ role: "admin" });
```

### Relationships

```ts
// Reference another model
const postSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: "User" },
});

// Populate references
const post = await Post.findById(id).populate("authorId");
console.log(post.authorId.name); // User's name

// Multiple populate
const post = await Post.findById(id)
  .populate("authorId")
  .populate("categoryId");
```

### Instance Methods

```ts
interface IUser extends Document {
  email: string;
  password: string;
  comparePassword(candidate: string): Promise<boolean>;
}

userSchema.methods.comparePassword = async function(candidate: string) {
  return await bcrypt.compare(candidate, this.password);
};

// Usage
const user = await User.findOne({ email });
const valid = await user.comparePassword(inputPassword);
```

### Static Methods

```ts
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = model<IUser, IUserModel>("User", userSchema);

// Usage
const user = await User.findByEmail("john@example.com");
```

### Virtual Properties

```ts
userSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Enable virtuals in JSON
userSchema.set("toJSON", { virtuals: true });

// Usage
const user = await User.findById(id);
console.log(user.fullName); // "John Doe"
```

### Middleware (Hooks)

```ts
// Pre-save
userSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Post-save
userSchema.post("save", function(doc) {
  console.log("User saved:", doc.email);
});

// Pre-remove
userSchema.pre("deleteOne", { document: true }, async function(next) {
  // Clean up related data
  await Post.deleteMany({ authorId: this._id });
  next();
});
```

### Query Building

```ts
// Chain methods
const users = await User.find()
  .where("role").equals("admin")
  .where("createdAt").gt(lastWeek)
  .select("email name")
  .sort("-createdAt")
  .limit(10)
  .skip(20)
  .lean();

// Lean for read-only (faster)
const users = await User.find().lean();
```

### Aggregation

```ts
const stats = await Post.aggregate([
  { $match: { published: true } },
  { $group: {
    _id: "$authorId",
    count: { $sum: 1 },
    avgLength: { $avg: { $strLenCP: "$content" } },
  }},
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

### Validation

```ts
const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: (v: string) => /^[\w-]+@[\w-]+\.\w+$/.test(v),
      message: "Invalid email format",
    },
  },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"],
    max: [150, "Age seems too high"],
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "moderator"],
      message: "{VALUE} is not a valid role",
    },
    default: "user",
  },
});
```

### Indexes

```ts
// In schema
const postSchema = new Schema({
  slug: { type: String, unique: true }, // Unique index
  authorId: { type: Schema.Types.ObjectId, index: true }, // Regular index
});

// Compound indexes
postSchema.index({ authorId: 1, createdAt: -1 });

// Text index for search
postSchema.index({ title: "text", content: "text" });

// TTL index (auto-delete)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

## See Also

- [Database Service](./services/database.md) - MongoDB connection
- [Migrations](../guides/migrations.md) - Database migrations
- [Seeders](../guides/seeders.md) - Database seeding
