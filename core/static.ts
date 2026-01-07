/**
 * Static file server - serves files from public/ directory.
 */

import path from "node:path";
import { config } from "./config";

// Common MIME types
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",

  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",

  // Fonts
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",

  // Media
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",

  // Documents
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".tar": "application/x-tar",

  // Other
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export interface StaticFileOptions {
  rootDir: string;
  maxAge?: number;
}

let staticDir: string | null = null;
let staticMaxAge: number = 86400;

/**
 * Initialize static file serving.
 */
export function initStatic(rootDir: string): void {
  const staticPath = config<string>("static.path", "public");
  staticDir = path.join(rootDir, staticPath);
  staticMaxAge = config<number>("static.maxAge", 86400);
}

/**
 * Try to serve a static file. Returns null if file doesn't exist.
 */
export async function serveStatic(pathname: string): Promise<Response | null> {
  if (!staticDir) return null;

  // Security: prevent directory traversal
  const normalizedPath = path.normalize(pathname);
  if (normalizedPath.includes("..")) {
    return null;
  }

  // Remove leading slash and resolve full path
  const relativePath = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;
  const filePath = path.join(staticDir, relativePath);

  // Ensure file is within static directory
  if (!filePath.startsWith(staticDir)) {
    return null;
  }

  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      return null;
    }

    // Get file stats for caching
    const stat = await file.stat();
    
    // Skip directories
    if (stat.isDirectory()) {
      return null;
    }

    const mtime = stat.mtime;
    const etag = `"${stat.size}-${mtime.getTime()}"`;
    const lastModified = mtime.toUTCString();
    const mimeType = getMimeType(filePath);

    const headers = new Headers({
      "Content-Type": mimeType,
      "Content-Length": String(stat.size),
      "ETag": etag,
      "Last-Modified": lastModified,
      "Cache-Control": `public, max-age=${staticMaxAge}`,
    });

    return new Response(file, {
      status: 200,
      headers,
    });
  } catch {
    return null;
  }
}

/**
 * Check if request matches a static file and return 304 if not modified.
 */
export async function serveStaticWithCache(
  req: Request,
  pathname: string
): Promise<Response | null> {
  if (!staticDir) return null;

  // Security: prevent directory traversal
  const normalizedPath = path.normalize(pathname);
  if (normalizedPath.includes("..")) {
    return null;
  }

  const relativePath = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;
  const filePath = path.join(staticDir, relativePath);

  if (!filePath.startsWith(staticDir)) {
    return null;
  }

  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      return null;
    }

    const stat = await file.stat();
    
    if (stat.isDirectory()) {
      return null;
    }

    const mtime = stat.mtime;
    const etag = `"${stat.size}-${mtime.getTime()}"`;
    const lastModified = mtime.toUTCString();

    // Check If-None-Match
    const ifNoneMatch = req.headers.get("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag },
      });
    }

    // Check If-Modified-Since
    const ifModifiedSince = req.headers.get("If-Modified-Since");
    if (ifModifiedSince) {
      const ifModifiedDate = new Date(ifModifiedSince);
      if (mtime <= ifModifiedDate) {
        return new Response(null, {
          status: 304,
          headers: { ETag: etag, "Last-Modified": lastModified },
        });
      }
    }

    const mimeType = getMimeType(filePath);

    const headers = new Headers({
      "Content-Type": mimeType,
      "Content-Length": String(stat.size),
      "ETag": etag,
      "Last-Modified": lastModified,
      "Cache-Control": `public, max-age=${staticMaxAge}`,
    });

    return new Response(file, {
      status: 200,
      headers,
    });
  } catch {
    return null;
  }
}
