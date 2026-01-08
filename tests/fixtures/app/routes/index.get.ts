import { Controller } from "@yoeast/core";

export default class IndexGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({ ok: true, route: "/" });
  }
}
