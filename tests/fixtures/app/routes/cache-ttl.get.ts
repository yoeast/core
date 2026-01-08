import { Controller } from "@yoeast/core";

export default class CacheTtlGet extends Controller {
  // Cache for 2 seconds
  protected override responseCacheTtl = 2;

  protected async handle(): Promise<Response> {
    return this.json({ ok: true, time: Date.now() });
  }
}
