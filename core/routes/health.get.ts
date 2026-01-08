/**
 * Health check endpoint.
 * 
 * GET /health
 * 
 * Returns server health status including uptime, cache stats, and metrics.
 * Apps can override this by creating their own app/routes/health.get.ts
 */
import { Controller, getWsRoutes, cache } from "@core";

export default class HealthController extends Controller {
  protected async handle(): Promise<Response> {
    const server = this.getServer();
    const cacheStats = cache.getStats();

    return this.json({
      status: "ok",
      uptimeMs: Math.round(process.uptime() * 1000),
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
