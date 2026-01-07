import { Controller } from "@core";

export default class EchoTextPost extends Controller {
  protected async handle(): Promise<Response> {
    const text = await this.getBodyText();
    return this.json({ text });
  }
}
