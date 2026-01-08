import { Controller } from "@yoeast/core";

export default class CacheGet extends Controller {
  // Enable response caching with 1 hour TTL
  protected override responseCacheTtl = 3600;

  protected async handle(): Promise<Response> {
    const key = this.getQueryParam("key") ?? "default";
    // Use custom cache key based on query param
    return this.json({ key, time: 123 }, { key: `cache:${key}` });
  }
}
