/**
 * Serve command - starts the HTTP server.
 */

import { Command } from "../command";
import { startServer } from "../../server";
import { setPlainMode } from "../../logger";

export default class ServeCommand extends Command {
  static override signature = `
    serve
    {--p|port= : Port to listen on}
    {--H|host= : Host to bind to}
    {--dev : Enable development mode}
    {--plain : Use plain nginx-style logs without colors}
  `;

  static override description = "Start the HTTP server";

  async handle(): Promise<number> {
    const port = this.option("port");
    const host = this.option("host");
    const dev = this.option("dev");
    const plain = this.option("plain") as boolean;

    if (plain) {
      setPlainMode(true);
    }

    if (!plain) {
      this.info("Starting server...");
    }

    try {
      await startServer({
        port: port ? parseInt(port as string, 10) : undefined,
        hostname: host as string | undefined,
        development: dev as boolean,
      });

      // Keep running
      await new Promise(() => {});
      return 0;
    } catch (error) {
      this.error(`Failed to start server: ${error}`);
      return 1;
    }
  }
}
