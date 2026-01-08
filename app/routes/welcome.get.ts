import { Controller, cache, hasService, service } from "@core";
import type DatabaseService from "@app/services/database";

export default class WelcomeGet extends Controller {
  // Cache responses for 5 minutes
  protected override responseCacheTtl = 300;

  protected async handle(): Promise<Response> {
    // Get cache stats
    const cacheStats = cache.getStats();
    
    // Get database info if available
    let database = null;
    if (hasService("database")) {
      const db = service<DatabaseService>("database");
      database = db.getInfo();
    }

    return this.render("home", {
      title: "Welcome",
      features: [
        "File-based routing",
        "Laravel-style CLI",
        "WebSocket & SSE support",
        "Handlebars templating",
        "Static file serving",
        "Config management",
        "Multi-driver caching",
      ],
      cache: {
        driver: cacheStats.driver,
        enabled: cacheStats.enabled,
        hitRate: cacheStats.hits + cacheStats.misses > 0
          ? `${Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100)}%`
          : "0%",
      },
      database,
    });
  }
}
