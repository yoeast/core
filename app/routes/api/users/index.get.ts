/**
 * List all users endpoint.
 * 
 * GET /api/users
 */
import { z } from "zod";
import { ApiController } from "@yoeast/core";
import { User } from "@app/models/User";

const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  createdAt: z.string(),
});

export default class ListUsersController extends ApiController {
  static override input = z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    skip: z.coerce.number().min(0).default(0),
  });

  static override responses = {
    200: z.object({
      users: z.array(UserSchema),
      pagination: z.object({
        total: z.number(),
        limit: z.number(),
        skip: z.number(),
        hasMore: z.boolean(),
      }),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { limit, skip } = this.input as z.infer<typeof ListUsersController.input>;
    
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    return this.response(200, {
      users: users.map((user) => ({
        id: String(user._id),
        email: user.email,
        name: user.name ?? null,
        createdAt: user.createdAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + users.length < total,
      },
    });
  }
}
