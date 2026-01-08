import { Controller } from "@yoeast/core";

export default class UsersIdGet extends Controller {
  protected async handle(): Promise<Response> {
    const id = this.getParam("id");
    return this.json({ id });
  }
}
