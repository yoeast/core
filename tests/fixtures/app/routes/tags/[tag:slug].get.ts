import { Controller } from "@core";

export default class TagSlugGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({ tag: this.getParam("tag") });
  }
}
