import { Controller } from "@core";

export default class DocsCatchAllGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({ slug: this.getParam("slug") });
  }
}
