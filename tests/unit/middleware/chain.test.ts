import { describe, expect, test } from "bun:test";
import { applyMiddleware, Middleware } from "@yoeast/core/middleware";

class First extends Middleware {
  override async handle(_req: Request, next: () => Promise<Response>): Promise<Response> {
    const res = await next();
    res.headers.set("X-First", "1");
    return res;
  }
}

class Second extends Middleware {
  override async handle(_req: Request, next: () => Promise<Response>): Promise<Response> {
    const res = await next();
    res.headers.set("X-Second", "1");
    return res;
  }
}

describe("middleware chain", () => {
  test("applies in order", async () => {
    const req = new Request("http://example.test");
    const res = await applyMiddleware([First, Second], req, async () => new Response("ok"));
    expect(res.headers.get("X-First")).toBe("1");
    expect(res.headers.get("X-Second")).toBe("1");
  });

  test("short-circuits when middleware returns early", async () => {
    let reached = false;

    class EarlyExit extends Middleware {
      override async handle(): Promise<Response> {
        return new Response("blocked", { status: 401 });
      }
    }

    const res = await applyMiddleware([EarlyExit, First], new Request("http://example.test"), async () => {
      reached = true;
      return new Response("ok");
    });

    expect(reached).toBe(false);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("blocked");
  });

  test("throws if next called twice", async () => {
    class DoubleNext extends Middleware {
      override async handle(_req: Request, next: () => Promise<Response>): Promise<Response> {
        await next();
        return next();
      }
    }

    const req = new Request("http://example.test");
    await expect(
      applyMiddleware([DoubleNext], req, async () => new Response("ok"))
    ).rejects.toThrow("next() called multiple times");
  });
});
