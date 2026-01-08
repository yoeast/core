import { WebSocketController } from "@core";
import type { ServerWebSocket } from "bun";

export default class ChatWs extends WebSocketController {
  override async open(ws: ServerWebSocket<unknown>): Promise<void> {
    ws.send("connected");
  }

  override async message(ws: ServerWebSocket<unknown>, message: string | Uint8Array): Promise<void> {
    ws.send(message);
  }
}
