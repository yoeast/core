import { Middleware, logRequest } from "@yoeast/core";

export default class LoggingMiddleware extends Middleware {
  override async handle(req: Request, next: () => Promise<Response>): Promise<Response> {
    const start = Date.now();
    const res = await next();
    const ms = Date.now() - start;
    
    const url = new URL(req.url);
    const contentLength = res.headers.get("content-length");
    const userAgent = req.headers.get("user-agent") || undefined;
    
    // Get IP: check proxy headers first, then server-injected IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || req.headers.get("cf-connecting-ip")
      || (req as unknown as { __clientIP?: string }).__clientIP
      || "-";
    
    logRequest(req.method, url.pathname, res.status, ms, {
      contentLength: contentLength ? parseInt(contentLength, 10) : null,
      ip,
      userAgent,
    });
    
    return res;
  }
}
