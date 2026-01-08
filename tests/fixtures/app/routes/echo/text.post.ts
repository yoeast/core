import { Controller } from "@yoeast/core";

export default class EchoTextPost extends Controller {
  protected async handle(): Promise<Response> {
    const text = await this.getBodyText();
    return this.json({ text });
  }
}
