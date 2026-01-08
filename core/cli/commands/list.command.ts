/**
 * List command - shows all available commands.
 */

import { Command } from "../command";

export default class ListCommand extends Command {
  static override signature = "list";
  static override description = "List all available commands";

  async handle(): Promise<number> {
    // The runner handles this specially, but we need the class
    // to be loadable. This won't actually run.
    return 0;
  }
}
