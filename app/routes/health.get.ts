/**
 * Extended health check with database info.
 * Overrides core's /health route.
 */
import { Controller, getWsRoutes, hasService, service, cache } from "@yoeast/core";
import type DatabaseService from "@app/services/database";

export default class HealthGet extends Controller {
  protected async handle(): Promise<Response> {
    const server = this.getServer();

    // Get database info if available
    let database = null;
    if (hasService("database")) {
      const db = service<DatabaseService>("database");
      database = db.getInfo();
    }

    // Get cache stats
    const cacheStats = cache.getStats();

    return this.json({
      status: "ok",
      uptimeMs: Math.round(process.uptime() * 1000),
      database,
      cache: {
        driver: cacheStats.driver,
        enabled: cacheStats.enabled,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        writes: cacheStats.writes,
        hitRate: cacheStats.hits + cacheStats.misses > 0 
          ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) 
          : 0,
        size: cacheStats.size,
        max: cacheStats.max,
      },
      wsRoutes: getWsRoutes(),
      metrics: server
        ? {
            hostname: server.hostname,
            port: server.port,
            pendingRequests: server.pendingRequests,
            pendingWebSockets: server.pendingWebSockets,
          }
        : null,
    });
  }
}
