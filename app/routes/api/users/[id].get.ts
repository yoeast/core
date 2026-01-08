/**
 * Get user by ID endpoint.
 * 
 * GET /api/users/:id
 */
import { z } from "zod";
import { ApiController } from "@yoeast/core";
import { User } from "@app/models/User";

export default class GetUserController extends ApiController {
  static override input = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
  });

  static override responses = {
    200: z.object({
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    }),
    404: z.object({
      error: z.literal("NotFound"),
      message: z.string(),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { id } = this.input as z.infer<typeof GetUserController.input>;
    
    const user = await User.findById(id);

    if (!user) {
      return this.response(404, { 
        error: "NotFound" as const, 
        message: "User not found" 
      });
    }

    return this.response(200, {
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  }
}
