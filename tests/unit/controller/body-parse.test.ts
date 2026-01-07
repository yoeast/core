import { describe, expect, test } from "bun:test";
import { Controller } from "@core/controller";

describe("controller body parsing", () => {
  test("supports safeParse schema", async () => {
    class SafeParseController extends Controller {
      protected async handle(): Promise<Response> {
        const body = await this.getBodyJson({
          safeParse: (input: unknown) => {
            if (typeof input !== "object" || !input) {
              return { success: false, error: new Error("invalid") };
            }
            const value = (input as { ok?: boolean }).ok;
            if (value !== true) {
              return { success: false, error: new Error("invalid") };
            }
            return { success: true, data: { ok: true } };
          },
        });
        return this.json(body);
      }
    }

    const controller = new SafeParseController();
    const req = new Request("http://example.test", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await controller.run(req, {}, new URL(req.url).searchParams);
    expect(await res.json()).toEqual({ ok: true });
  });
});

  test("throws HttpError on invalid json payload", async () => {
    class InvalidJsonController extends Controller {
      protected async handle(): Promise<Response> {
        await this.getBodyJson();
        return this.text("ok");
      }
    }

    const controller = new InvalidJsonController();
    const req = new Request("http://example.test", {
      method: "POST",
      body: "{bad-json}",
      headers: { "Content-Type": "application/json" },
    });

    const { HttpError } = await import("@core/errors");
    await expect(controller.run(req, {}, new URL(req.url).searchParams)).rejects.toBeInstanceOf(
      HttpError
    );
  });
