import { WebSocketController } from "@core";
import { incrementClose } from "../../services/ws-state";

export default class TrackWs extends WebSocketController {
  close(): void {
    incrementClose();
  }
}
