import { Controller } from "@core";
import { getCloseCount, resetClose } from "../../services/ws-state";

export default class CloseCountGet extends Controller {
  protected async handle(): Promise<Response> {
    if (this.getQueryParam("reset") === "1") {
      resetClose();
    }
    return this.json({ closeCount: getCloseCount() });
  }
}
