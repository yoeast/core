import { Controller } from "@yoeast/core";

export default class EchoQueryGet extends Controller {
  protected async handle(): Promise<Response> {
    const query = Object.fromEntries(this.getQuery());
    return this.json({ query });
  }
}
