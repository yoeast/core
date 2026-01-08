import { Controller, HttpError } from "@yoeast/core";

export default class ValidatePost extends Controller {
  protected override schema = {
    body: (input: unknown) => {
      if (!input || typeof input !== "object") throw new HttpError(400, "Invalid body");
      const name = (input as { name?: string }).name;
      if (!name) throw new HttpError(400, "Missing name");
      return { name };
    },
  };

  protected async handle(): Promise<Response> {
    const body = this.getValidatedBody<{ name: string }>();
    return this.json({ ok: true, name: body?.name });
  }
}
