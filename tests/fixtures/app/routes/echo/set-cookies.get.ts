import { Controller } from "@core";

export default class EchoSetCookiesGet extends Controller {
  protected async handle(): Promise<Response> {
    this.setCookie("a", "1");
    this.setCookie("b", "2", { httpOnly: true });
    return this.text("ok");
  }
}
