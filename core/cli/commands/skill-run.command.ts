/**
 * skill:run command - execute a skill by name.
 */

import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { Command } from "../command";

export default class SkillRunCommand extends Command {
  static override signature = "skill:run {skill}";
  static override description = "Execute a skill with --options passed to the skill handler";

  // Override to allow pass-through of unknown options
  static override allowUnknownOptions = true;

  async handle(): Promise<number> {
    const skillName = this.argument("skill", "") as string;

    if (!skillName) {
      this.io.error("Skill name is required");
      return 1;
    }

    // Get raw options (all --key=value pairs)
    const input = this.getAllOptions();

    // Find skill directory
    const rootDir = process.cwd();
    const skillDir = path.join(rootDir, ".claude", "skills", skillName);
    const handlerPath = path.join(skillDir, "handler.ts");

    // Check if skill exists
    try {
      await readFile(handlerPath);
    } catch {
      this.io.error(`Skill not found: ${skillName}`);
      this.io.comment(`Expected handler at: ${handlerPath}`);
      return 1;
    }

    // Load and execute skill
    try {
      const mod = await import(pathToFileURL(handlerPath).href);
      
      if (typeof mod.execute !== "function") {
        this.io.error(`Skill ${skillName} does not export an execute function`);
        return 1;
      }

      const result = await mod.execute(input);
      
      // Output result as JSON
      this.io.writeln(JSON.stringify(result, null, 2));
      
      return result.success ? 0 : 1;
    } catch (error) {
      this.io.error(`Failed to execute skill: ${error}`);
      return 1;
    }
  }
}
