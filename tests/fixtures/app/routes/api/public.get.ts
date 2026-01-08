/**
 * Unprotected API endpoint - no authentication required.
 */
import { z } from "zod";
import { ApiController } from "@yoeast/core";

export default class PublicApiController extends ApiController {
  static override responses = {
    200: z.object({
      message: z.string(),
      authenticated: z.boolean(),
    }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, {
      message: "Public API endpoint",
      authenticated: this.isAuthenticated(),
    });
  }
}
