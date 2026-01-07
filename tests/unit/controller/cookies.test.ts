import { describe, expect, test } from "bun:test";
import { Controller } from "@core/controller";

class CookieController extends Controller {
  protected async handle(): Promise<Response> {
    this.setCookie("session", "abc", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 3600,
    });
    return this.text("ok");
  }
}

describe("controller cookies", () => {
  test("sets cookie options", async () => {
    const controller = new CookieController();
    const req = new Request("http://example.test");
    const res = await controller.run(req, {}, new URL(req.url).searchParams);

    const header = res.headers.get("set-cookie") ?? "";
    expect(header).toContain("session=abc");
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Max-Age=3600");
  });
});
