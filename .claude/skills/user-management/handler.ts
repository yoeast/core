/**
 * User Management Skill
 * 
 * CRUD operations for users in the database.
 */

import { User } from "@app/models/User";

interface Input {
  action: "create" | "find" | "update" | "delete";
  email?: string;
  password?: string;
  name?: string;
  id?: string;
  limit?: number;
}

interface Output {
  success: boolean;
  user?: unknown;
  users?: unknown[];
  message?: string;
  error?: string;
}

export async function execute(input: Input): Promise<Output> {
  const { action } = input;

  switch (action) {
    case "create":
      return createUser(input);
    case "find":
      return findUsers(input);
    case "update":
      return updateUser(input);
    case "delete":
      return deleteUser(input);
    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

async function createUser(input: Input): Promise<Output> {
  const { email, password, name } = input;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    return { success: false, error: "User with this email already exists" };
  }

  // Hash password (simple hash for now - use bcrypt in production)
  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
  });

  return {
    success: true,
    user: { id: user._id, email: user.email, name: user.name },
    message: "User created successfully",
  };
}

async function findUsers(input: Input): Promise<Output> {
  const { email, limit = 10 } = input;

  if (email) {
    const user = await User.findOne({ email }).select("-password").lean();
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return { success: true, user };
  }

  const users = await User.find().select("-password").limit(limit).lean();
  return { success: true, users, message: `Found ${users.length} user(s)` };
}

async function updateUser(input: Input): Promise<Output> {
  const { id, email, password, name } = input;

  if (!id) {
    return { success: false, error: "User ID is required" };
  }

  const updates: Record<string, unknown> = {};
  if (email) updates.email = email;
  if (name) updates.name = name;
  if (password) updates.password = await hashPassword(password);

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  const user = await User.findByIdAndUpdate(id, updates, { new: true })
    .select("-password")
    .lean();

  if (!user) {
    return { success: false, error: "User not found" };
  }

  return { success: true, user, message: "User updated successfully" };
}

async function deleteUser(input: Input): Promise<Output> {
  const { id } = input;

  if (!id) {
    return { success: false, error: "User ID is required" };
  }

  const result = await User.findByIdAndDelete(id);

  if (!result) {
    return { success: false, error: "User not found" };
  }

  return { success: true, message: "User deleted successfully" };
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
