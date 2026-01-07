import { describe, expect, test } from "bun:test";
import { Controller } from "@core/controller";

class CoerceController extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      params: this.getParamsCoerced(),
      query: this.getQueryCoerced(),
    });
  }
}

describe("controller coercion helpers", () => {
  test("coerces numbers booleans and null", async () => {
    const controller = new CoerceController();
    const req = new Request("http://example.test?active=true&count=10&pi=3.14&name=bun&empty=null");
    const res = await controller.run(req, { id: "42" }, new URL(req.url).searchParams);
    const body = await res.json();

    expect(body).toEqual({
      params: { id: 42 },
      query: { active: true, count: 10, pi: 3.14, name: "bun", empty: null },
    });
  });
});
