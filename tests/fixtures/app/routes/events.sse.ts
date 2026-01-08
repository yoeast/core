import { SseController } from "@yoeast/core";

export default class EventsSse extends SseController {
  protected async *handle() {
    yield this.event({ event: "hello", data: "world" });

    // Wait 5 seconds before sending the next event
    await new Promise((resolve) => setTimeout(resolve, 5000));

    yield this.event({ event: "time", data: new Date().toISOString() });
  }
}
