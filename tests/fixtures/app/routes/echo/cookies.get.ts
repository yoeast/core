import { Controller } from "@core";

export default class EchoCookiesGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      session: this.getCookie("session") ?? null,
      all: this.getCookies(),
    });
  }
}
