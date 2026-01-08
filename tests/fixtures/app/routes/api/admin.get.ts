/**
 * Admin-only API endpoint - requires admin scope.
 */
import { z } from "zod";
import { ApiController, type ApiScope } from "@yoeast/core";

export default class AdminApiController extends ApiController {
  protected override apiProtected = true;
  protected override apiScopes: ApiScope[] = ["admin"];

  static override responses = {
    200: z.object({
      message: z.string(),
      clientId: z.string().optional(),
    }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, {
      message: "Admin API endpoint",
      clientId: this.getClientId(),
    });
  }
}
