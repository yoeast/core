import { Controller } from "@yoeast/core";

export default class EchoHeadersGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      header: this.getHeader("x-test") ?? null,
      all: Object.fromEntries(this.getHeaders()),
    });
  }
}
