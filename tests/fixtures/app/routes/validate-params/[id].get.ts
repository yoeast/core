import { Controller, HttpError } from "@yoeast/core";

export default class ValidateParamsGet extends Controller {
  protected override schema = {
    params: (input: unknown) => {
      const params = input as { id?: string };
      if (!params?.id) throw new HttpError(400, "Missing id");
      if (!/^\d+$/.test(params.id)) throw new HttpError(400, "Invalid id");
      return { id: Number(params.id) };
    },
    query: (input: unknown) => {
      const query = input as { tag?: string };
      if (!query?.tag) throw new HttpError(400, "Missing tag");
      return { tag: query.tag };
    },
  };

  protected async handle(): Promise<Response> {
    const params = this.getValidatedParams<{ id: number }>();
    const query = this.getValidatedQuery<{ tag: string }>();
    return this.json({ id: params?.id, tag: query?.tag });
  }
}
