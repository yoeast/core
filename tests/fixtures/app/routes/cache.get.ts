import { Controller } from "@core";

export default class CacheGet extends Controller {
  protected async handle(): Promise<Response> {
    const key = this.getQueryParam("key") ?? "default";
    return this.cacheJson(`cache:${key}`, { key, time: 123 });
  }
}
