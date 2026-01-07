import { WebSocketController } from "@core";

export default class ChatWs extends WebSocketController {
  async open(ws: ServerWebSocket): Promise<void> {
    ws.send("connected");
  }

  async message(ws: ServerWebSocket, message: string | Uint8Array): Promise<void> {
    ws.send(message);
  }
}
