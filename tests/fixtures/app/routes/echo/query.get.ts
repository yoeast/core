import { Controller } from "@core";

export default class EchoQueryGet extends Controller {
  protected async handle(): Promise<Response> {
    const query = Object.fromEntries(this.getQuery());
    return this.json({ query });
  }
}
