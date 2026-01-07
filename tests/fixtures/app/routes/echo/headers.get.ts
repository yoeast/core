import { Controller } from "@core";

export default class EchoHeadersGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      header: this.getHeader("x-test") ?? null,
      all: Object.fromEntries(this.getHeaders()),
    });
  }
}
