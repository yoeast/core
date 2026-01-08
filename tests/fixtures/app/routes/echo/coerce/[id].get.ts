import { Controller } from "@yoeast/core";

export default class EchoCoerceGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      params: this.getParamsCoerced(),
      query: this.getQueryCoerced(),
    });
  }
}
