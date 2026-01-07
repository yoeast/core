import { Controller } from "@core";

export default class UserPostGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      userId: this.getParam("userId"),
      postId: this.getParam("postId"),
    });
  }
}
