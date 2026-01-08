import { Controller } from "@yoeast/core";

export default class ThrowResponseGet extends Controller {
  protected async handle(): Promise<Response> {
    throw new Response("Forbidden", { status: 403 });
  }
}
