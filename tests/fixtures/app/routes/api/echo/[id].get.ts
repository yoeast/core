/**
 * Echo endpoint - returns input for testing.
 */
import { z } from "zod";
import { ApiController } from "@yoeast/core";

export default class EchoInputController extends ApiController {
  static override responses = {
    200: z.object({
      input: z.any(),
    }),
  };

  protected override async handle(): Promise<Response> {
    return this.response(200, { input: this.input as Record<string, unknown> });
  }
}
