import { Controller } from "@core";

export default class BinaryGet extends Controller {
  protected async handle(): Promise<Response> {
    const bytes = new Uint8Array([0, 1, 2, 255]);
    return this.stream(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
      "application/octet-stream"
    );
  }
}
