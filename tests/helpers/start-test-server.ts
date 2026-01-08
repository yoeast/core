import path from "node:path";
import { startServer } from "@yoeast/core/server";

export interface TestServer {
  baseUrl: string;
  stop: () => Promise<void> | void;
}

export async function startTestServer(): Promise<TestServer> {
  // Use tests/fixtures as the root dir for test routes
  const rootDir = path.resolve(import.meta.dir, "..", "fixtures");
  const port = await findOpenPort();
  const server = await startServer({ 
    rootDir, 
    port, 
    hostname: "127.0.0.1",
    development: true,
    silent: true,
  });

  return {
    baseUrl: `http://127.0.0.1:${server.port}`,
    stop: () => server.stop(true),
  };
}

async function findOpenPort(): Promise<number> {
  const base = 4000 + Math.floor(Math.random() * 2000);
  for (let i = 0; i < 25; i += 1) {
    const port = base + i;
    try {
      const server = Bun.serve({ port, fetch: () => new Response("ok") });
      server.stop(true);
      return port;
    } catch {
      // try next port
    }
  }
  throw new Error("Unable to find open port for tests");
}
