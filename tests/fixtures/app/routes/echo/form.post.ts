import { Controller } from "@core";

export default class EchoFormPost extends Controller {
  protected async handle(): Promise<Response> {
    const form = await this.getBodyForm();
    const value = form.get("name");
    return this.json({ name: value ?? null });
  }
}
