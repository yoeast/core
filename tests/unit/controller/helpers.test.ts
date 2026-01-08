import { describe, expect, test } from "bun:test";
import { Controller } from "@yoeast/core/controller";

class TestController extends Controller {
  protected async handle(): Promise<Response> {
    const name = this.getQueryParam("name") ?? "world";
    const id = this.getParam("id");
    this.setHeader("X-Test", "yes");
    this.setCookie("session", "abc", { httpOnly: true });
    return this.json({ hello: name, id });
  }
}

describe("controller helpers", () => {
  test("reads params and query, writes headers", async () => {
    const controller = new TestController();
    const req = new Request("http://example.test/users/42?name=bun");

    const res = await controller.run(req, { id: "42" }, new URL(req.url).searchParams);

    expect(res.headers.get("X-Test")).toBe("yes");
    expect(res.headers.get("set-cookie")).toContain("session=abc");
    const body = await res.json();
    expect(body).toEqual({ hello: "bun", id: "42" });
  });

  test("body json helper with schema", async () => {
    class BodyController extends Controller {
      protected async handle(): Promise<Response> {
        const body = await this.getBodyJson((input) => {
          if (!input || typeof input !== "object") throw new Error("invalid");
          const value = (input as { name?: string }).name;
          if (!value) throw new Error("missing");
          return { name: value };
        });
        return this.json(body);
      }
    }

    const controller = new BodyController();
    const req = new Request("http://example.test", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await controller.run(req, {}, new URL(req.url).searchParams);
    expect(await res.json()).toEqual({ name: "test" });
  });
});
