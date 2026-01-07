/**
 * Server logger - nginx-style access and error logging.
 */

import { color, COLORS } from "./cli/console-io";

let plainMode = false;

export function setPlainMode(enabled: boolean): void {
  plainMode = enabled;
}

const STATUS_COLORS: Record<string, string> = {
  "2": COLORS.green,
  "3": COLORS.cyan,
  "4": COLORS.yellow,
  "5": COLORS.red,
};

function getStatusColor(status: number): string {
  const firstDigit = String(status)[0];
  return STATUS_COLORS[firstDigit] || COLORS.white;
}

function formatMethod(method: string): string {
  const padded = method.padEnd(7);
  if (plainMode) return padded;
  
  const methodColors: Record<string, string> = {
    GET: COLORS.green,
    POST: COLORS.blue,
    PUT: COLORS.yellow,
    PATCH: COLORS.yellow,
    DELETE: COLORS.red,
    HEAD: COLORS.dim,
    OPTIONS: COLORS.dim,
  };
  return color(padded, methodColors[method] || COLORS.white);
}

function formatStatus(status: number): string {
  if (plainMode) return String(status);
  return color(String(status), getStatusColor(status));
}

function formatDuration(ms: number): string {
  const str = `${ms}ms`.padStart(7);
  if (plainMode) return str;
  
  if (ms < 100) {
    return color(str, COLORS.green);
  } else if (ms < 500) {
    return color(str, COLORS.yellow);
  } else {
    return color(str, COLORS.red);
  }
}

function formatTimestamp(): string {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);
  if (plainMode) return time;
  return color(time, COLORS.dim);
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}

/**
 * Log an HTTP request in nginx-style format.
 */
export function logRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  options: {
    contentLength?: number | null;
    ip?: string;
    userAgent?: string;
  } = {}
): void {
  const { contentLength = null, ip = "-", userAgent } = options;
  
  const timestamp = formatTimestamp();
  const methodStr = formatMethod(method);
  const statusStr = formatStatus(status);
  const duration = formatDuration(durationMs);
  const size = formatSize(contentLength);
  
  if (plainMode) {
    // Plain nginx-style: IP - - [timestamp] "METHOD /path" STATUS SIZE "USER_AGENT"
    const ua = userAgent ? `"${userAgent}"` : "-";
    console.log(`${ip} - - [${timestamp}] "${method} ${path}" ${status} ${size} ${ua}`);
  } else {
    const ipStr = color(ip.padEnd(15), COLORS.dim);
    let line = `${timestamp} ${ipStr} ${methodStr} ${path} ${statusStr} ${duration} ${size}`;
    
    if (userAgent) {
      line += `  ${color(userAgent, COLORS.dim)}`;
    }
    
    console.log(line);
  }
}

/**
 * Log an error.
 */
export function logError(message: string, error?: Error): void {
  const timestamp = formatTimestamp();
  if (plainMode) {
    console.error(`${timestamp} ERROR ${message}`);
    if (error?.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(`${timestamp} ${color("ERROR", COLORS.red, COLORS.bold)} ${message}`);
    if (error?.stack) {
      console.error(color(error.stack, COLORS.dim));
    }
  }
}

/**
 * Print server startup banner.
 */
export function printStartupBanner(options: {
  hostname: string;
  port: number;
  routes: number;
  wsRoutes: number;
  sseRoutes: number;
  middleware: number;
  development: boolean;
  database?: { host?: string; port?: number; name?: string };
}): void {
  const { hostname, port, routes, wsRoutes, sseRoutes, middleware, development, database } = options;
  const url = `http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`;

  if (plainMode) {
    console.log(`Server started at ${url}`);
    console.log(`Environment: ${development ? "development" : "production"}`);
    console.log(`Routes: ${routes} HTTP, ${wsRoutes} WebSocket, ${sseRoutes} SSE`);
    console.log(`Middleware: ${middleware}`);
    if (database) {
      console.log(`Database: ${database.name} @ ${database.host}:${database.port}`);
    }
    return;
  }

  console.log();
  
  const rows: [string, string][] = [
    ["URL", color(url, COLORS.cyan, COLORS.bold)],
    ["Environment", development ? color("development", COLORS.yellow) : color("production", COLORS.green)],
    ["", ""],
    ["HTTP Routes", color(String(routes), COLORS.white)],
    ["WebSocket Routes", color(String(wsRoutes), COLORS.white)],
    ["SSE Routes", color(String(sseRoutes), COLORS.white)],
    ["Middleware", color(String(middleware), COLORS.white)],
  ];

  if (database) {
    rows.push(["", ""]);
    rows.push(["Database", color(`${database.name}`, COLORS.cyan) + color(` @ ${database.host}:${database.port}`, COLORS.dim)]);
  }

  for (const [label, value] of rows) {
    if (label === "") {
      console.log();
      continue;
    }
    console.log(`  ${color(label.padEnd(18), COLORS.dim)}${value}`);
  }

  console.log();
  console.log(color("  Ready to accept connections", COLORS.green));
  console.log();
}
