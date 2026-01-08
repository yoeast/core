import { Command } from "../command";
import { loadApp } from "../../loader";
import { color, COLORS } from "../console-io";

export default class RoutesListCommand extends Command {
  static override signature = "routes:list {--json}";
  static override description = "List all registered routes";

  async handle(): Promise<number> {
    const json = this.option("json") as boolean | undefined;
    const rootDir = process.cwd();

    this.io.info("Loading routes...");
    const app = await loadApp(rootDir);

    const routes = [
      // HTTP routes
      ...app.routes.map(r => ({
        method: r.method,
        path: r.path,
        type: "HTTP" as const,
        controller: r.Controller.name,
      })),
      // WebSocket routes
      ...app.wsRoutes.map(r => ({
        method: "WS",
        path: r.path,
        type: "WebSocket" as const,
        controller: r.Controller.name,
      })),
      // SSE routes
      ...app.sseRoutes.map(r => ({
        method: "SSE",
        path: r.path,
        type: "SSE" as const,
        controller: r.Controller.name,
      })),
    ];

    // Sort by path then method
    routes.sort((a, b) => {
      if (a.path !== b.path) return a.path.localeCompare(b.path);
      return a.method.localeCompare(b.method);
    });

    if (json) {
      console.log(JSON.stringify(routes, null, 2));
      return 0;
    }

    if (routes.length === 0) {
      this.io.warning("No routes found");
      return 0;
    }

    this.io.newLine();
    this.io.writeln(`Found ${routes.length} routes:`);
    this.io.newLine();

    // Calculate column widths
    const methodWidth = Math.max(7, ...routes.map(r => r.method.length));
    const pathWidth = Math.max(20, ...routes.map(r => r.path.length));
    const typeWidth = Math.max(10, ...routes.map(r => r.type.length));

    // Print header
    const header = [
      "Method".padEnd(methodWidth),
      "Path".padEnd(pathWidth),
      "Type".padEnd(typeWidth),
      "Controller",
    ].join("  ");
    
    this.io.writeln(color(header, COLORS.dim));
    this.io.writeln(color("─".repeat(header.length + 20), COLORS.dim));

    // Method colors
    const methodColors: Record<string, string> = {
      GET: COLORS.green,
      POST: COLORS.blue,
      PUT: COLORS.yellow,
      PATCH: COLORS.yellow,
      DELETE: COLORS.red,
      HEAD: COLORS.dim,
      OPTIONS: COLORS.dim,
      WS: COLORS.magenta,
      SSE: COLORS.cyan,
    };

    // Print routes
    for (const route of routes) {
      const methodColor = methodColors[route.method] || COLORS.white;
      const methodStr = color(route.method.padEnd(methodWidth), methodColor);
      const pathStr = route.path.padEnd(pathWidth);
      const typeStr = color(route.type.padEnd(typeWidth), COLORS.dim);
      const controllerStr = color(route.controller, COLORS.dim);

      this.io.writeln(`${methodStr}  ${pathStr}  ${typeStr}  ${controllerStr}`);
    }

    this.io.newLine();

    // Summary
    const httpCount = app.routes.length;
    const wsCount = app.wsRoutes.length;
    const sseCount = app.sseRoutes.length;

    const summary: string[] = [];
    if (httpCount > 0) summary.push(`${httpCount} HTTP`);
    if (wsCount > 0) summary.push(`${wsCount} WebSocket`);
    if (sseCount > 0) summary.push(`${sseCount} SSE`);

    this.io.info(`Total: ${summary.join(", ")}`);

    return 0;
  }
}
