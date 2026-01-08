/**
 * Protected API endpoint - requires valid API token.
 */
import { z } from "zod";
import { ApiController } from "@core";

export default class ProtectedApiController extends ApiController {
  protected override apiProtected = true;

  static override responses = {
    200: z.object({
      message: z.string(),
      authenticated: z.boolean(),
      clientId: z.string().optional(),
      scopes: z.array(z.string()),
    }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, {
      message: "Protected API endpoint",
      authenticated: this.isAuthenticated(),
      clientId: this.getClientId(),
      scopes: this.getApiContext().scopes,
    });
  }
}
