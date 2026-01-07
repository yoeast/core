import { describe, expect, test } from "bun:test";
import { Controller } from "@core/controller";

class ResponseController extends Controller {
  protected async handle(): Promise<Response> {
    this.setHeader("X-Foo", "bar");
    return this.status(201).json({ ok: true });
  }
}

class RedirectController extends Controller {
  protected async handle(): Promise<Response> {
    return this.redirect("/login", 307);
  }
}

describe("controller response helpers", () => {
  test("sets status and content-type for json", async () => {
    const controller = new ResponseController();
    const req = new Request("http://example.test");
    const res = await controller.run(req, {}, new URL(req.url).searchParams);

    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("X-Foo")).toBe("bar");
    expect(await res.json()).toEqual({ ok: true });
  });

  test("redirect helper sets location", async () => {
    const controller = new RedirectController();
    const req = new Request("http://example.test");
    const res = await controller.run(req, {}, new URL(req.url).searchParams);

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("/login");
  });
});
