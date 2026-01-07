import { Controller, HttpError } from "@core";

export default class EchoJsonPost extends Controller {
  protected async handle(): Promise<Response> {
    const body = await this.getBodyJson((input) => {
      if (!input || typeof input !== "object") {
        throw new HttpError(400, "Invalid JSON");
      }
      const value = (input as { message?: string }).message;
      if (!value) {
        throw new HttpError(400, "Missing message");
      }
      return { message: value };
    });

    return this.json(body);
  }
}
