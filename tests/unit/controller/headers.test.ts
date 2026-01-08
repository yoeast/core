import { describe, expect, test } from "bun:test";
import { Controller } from "@yoeast/core/controller";

class HeaderController extends Controller {
  protected async handle(): Promise<Response> {
    this.setHeader("X-One", "1");
    this.setHeaders({ "X-Two": "2", "X-Three": "3" });
    return this.text("ok");
  }
}

describe("controller headers", () => {
  test("sets single and multiple headers", async () => {
    const controller = new HeaderController();
    const req = new Request("http://example.test");
    const res = await controller.run(req, {}, new URL(req.url).searchParams);

    expect(res.headers.get("X-One")).toBe("1");
    expect(res.headers.get("X-Two")).toBe("2");
    expect(res.headers.get("X-Three")).toBe("3");
  });
});
