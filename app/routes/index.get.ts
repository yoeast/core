import { Controller, cache, hasService, service } from "@core";
import type DatabaseService from "@app/services/database";

export default class IndexGet extends Controller {
  protected async handle(): Promise<Response> {
    // Get cache stats
    const cacheStats = cache.getStats();
    
    // Get database info if available
    let database = null;
    if (hasService("database")) {
      const db = service<DatabaseService>("database");
      database = db.getInfo();
    }

    return this.json({
      ok: true,
      name: "Core",
      description: "A modern, AI-friendly web framework built on Bun",
      uptime: Math.round(process.uptime()),
      cache: {
        driver: cacheStats.driver,
        enabled: cacheStats.enabled,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hits + cacheStats.misses > 0
          ? `${Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)}%`
          : "0%",
      },
      database: database ? {
        name: database.name,
        connected: true,
      } : null,
    });
  }
}
