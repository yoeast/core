import { Controller } from "@yoeast/core";

export default class AutoGet extends Controller {
  protected async handle(): Promise<Response> {
    this.setHeader("X-Auto", "ok");
    return this.text("auto");
  }
}
