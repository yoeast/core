import { Controller, HttpError } from "@core";

export default class ErrorGet extends Controller {
  protected async handle(): Promise<Response> {
    throw new HttpError(418, "Teapot", "E_TEAPOT");
  }
}
