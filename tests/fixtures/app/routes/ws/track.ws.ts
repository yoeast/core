import { WebSocketController } from "@core";
import { incrementClose } from "../../utils/ws-state";

export default class TrackWs extends WebSocketController {
  override open(): void {}
  
  override close(): void {
    incrementClose();
  }
}
