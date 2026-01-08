/**
 * Create user API endpoint - demonstrates input validation.
 */
import { z } from "zod";
import { ApiController } from "@yoeast/core";

export default class CreateUserController extends ApiController {
  static override input = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
  });

  static override responses = {
    200: z.object({
      success: z.literal(true),
      user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string().nullable(),
      }),
    }),
  };

  protected override async handle(): Promise<Response> {
    const { email, name } = this.input as z.infer<typeof CreateUserController.input>;
    
    return this.response(200, {
      success: true as const,
      user: {
        id: "user_123",
        email,
        name: name ?? null,
      },
    });
  }
}
