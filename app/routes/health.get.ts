import { Controller, getWsRoutes, hasService, service } from "@core";
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

    return this.json({
      status: "ok",
      uptimeMs: Math.round(process.uptime() * 1000),
      database,
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
