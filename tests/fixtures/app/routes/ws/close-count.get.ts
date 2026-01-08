import { Controller } from "@yoeast/core";
import { getCloseCount, resetClose } from "../../utils/ws-state";

export default class CloseCountGet extends Controller {
  protected async handle(): Promise<Response> {
    if (this.getQueryParam("reset") === "1") {
      resetClose();
    }
    return this.json({ closeCount: getCloseCount() });
  }
}
