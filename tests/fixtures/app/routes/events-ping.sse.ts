import { SseController } from "@core";

export default class EventsPingSse extends SseController {
  protected async *handle() {
    yield this.event({ event: "ping", data: "1" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    yield ": keep-alive\n\n";
  }
}
