import { Controller, HttpError } from "@yoeast/core";

export default class ValidateSchemaGet extends Controller {
  protected override schema = {
    params: (input: unknown) => {
      const params = input as { id?: string };
      if (!params?.id) throw new HttpError(400, "Missing id");
      if (!/^\d+$/.test(params.id)) throw new HttpError(400, "Schema requires numeric id");
      return { id: Number(params.id) };
    },
  };

  protected async handle(): Promise<Response> {
    const params = this.getValidatedParams<{ id: number }>();
    return this.json({ id: params?.id });
  }
}
