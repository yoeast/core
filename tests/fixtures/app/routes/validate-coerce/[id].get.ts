import { Controller, HttpError } from "@core";

export default class ValidateCoerceGet extends Controller {
  protected schemaCoerce = true;
  protected schema = {
    params: (input: unknown) => {
      const params = input as { id?: number };
      if (typeof params?.id !== "number") throw new HttpError(400, "Missing numeric id");
      return params;
    },
    query: (input: unknown) => {
      const query = input as { active?: boolean };
      if (typeof query?.active !== "boolean") throw new HttpError(400, "Missing active flag");
      return query;
    },
  };

  protected async handle(): Promise<Response> {
    const params = this.getValidatedParams<{ id: number }>();
    const query = this.getValidatedQuery<{ active: boolean }>();
    return this.json({ id: params?.id, active: query?.active });
  }
}
