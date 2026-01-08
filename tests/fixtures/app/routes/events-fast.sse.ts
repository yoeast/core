import { SseController } from "@yoeast/core";

export default class EventsFastSse extends SseController {
  protected async *handle() {
    yield this.event({ event: "one", data: "first" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    yield this.event({ event: "two", data: "second" });
  }
}
