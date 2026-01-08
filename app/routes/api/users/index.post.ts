/**
 * Create user endpoint.
 * 
 * POST /api/users
 */
import { z } from "zod";
import { ApiController } from "@core";
import { User } from "@app/models/User";

export default class CreateUserController extends ApiController {
  static override input = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1).max(100).optional(),
  });

  static override responses = {
    201: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().nullable(),
        createdAt: z.string(),
      }),
    }),
    409: z.object({
      error: z.literal("Conflict"),
      message: z.string(),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { email, password, name } = this.input as z.infer<typeof CreateUserController.input>;
    
    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return this.response(409, {
        error: "Conflict" as const,
        message: "A user with this email already exists",
      });
    }

    // Create the user (in production, hash the password!)
    const user = await User.create({
      email,
      password, // TODO: Hash password with bcrypt
      name,
    });

    return this.response(201, {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name ?? null,
        createdAt: user.createdAt.toISOString(),
      },
    });
  }
}
