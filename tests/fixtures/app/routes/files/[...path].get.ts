import { Controller } from "@yoeast/core";

export default class FilesCatchAllGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({ path: this.getParam("path") });
  }
}
