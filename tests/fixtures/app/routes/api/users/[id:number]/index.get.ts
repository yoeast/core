import { Controller } from "@core";

export default class ApiUserIdGet extends Controller {
  protected async handle(): Promise<Response> {
    const id = this.getParam("id");
    return this.json({ id, type: "number" });
  }
}
