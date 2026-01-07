import { Controller } from "@core";
import { User } from "@app/models/User";

export default class UsersController extends Controller {
  async handle() {
    const users = await User.find().limit(10).lean();
    return this.json({ users, count: await User.countDocuments() });
  }
}
