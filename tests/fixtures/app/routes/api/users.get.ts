/**
 * Resource-scoped API endpoint.
 */
import { z } from "zod";
import { ApiController } from "@yoeast/core";

export default class UsersResourceController extends ApiController {
  protected override apiProtected = true;
  protected override apiResource = "users:read";

  static override responses = {
    200: z.object({
      message: z.string(),
      users: z.array(z.object({
        id: z.number(),
        name: z.string(),
      })),
    }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, {
      message: "Users resource endpoint",
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
    });
  }
}
