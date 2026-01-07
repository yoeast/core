import { Controller } from "@core";

export default class CacheTtlGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.cacheJson("cache:ttl", { ok: true, time: Date.now() }, 50);
  }
}
