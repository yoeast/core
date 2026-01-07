/**
 * skill:list command - list available skills.
 */

import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { Command } from "../command";

export default class SkillListCommand extends Command {
  static signature = "skill:list";
  static description = "List available skills";

  async handle(): Promise<number> {
    const rootDir = process.cwd();
    const skillsDir = path.join(rootDir, ".claude", "skills");

    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });
      const skills: Array<{ name: string; description: string }> = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillPath = path.join(skillsDir, entry.name);
        const manifestPath = path.join(skillPath, "SKILL.md");
        const handlerPath = path.join(skillPath, "handler.ts");

        // Check if handler exists
        try {
          await readFile(handlerPath);
        } catch {
          continue; // Skip skills without handler
        }

        // Try to read description from SKILL.md
        let description = "";
        try {
          const manifest = await readFile(manifestPath, "utf-8");
          // Get first non-empty line after the title
          const lines = manifest.split("\n");
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]?.trim();
            if (line && !line.startsWith("#")) {
              description = line;
              break;
            }
          }
        } catch {
          description = "(no description)";
        }

        skills.push({ name: entry.name, description });
      }

      if (skills.length === 0) {
        this.io.info("No skills found in .skills/ directory");
        return 0;
      }

      this.io.info(`Found ${skills.length} skill(s):\n`);

      const rows = skills.map((s) => [s.name, s.description]);
      this.io.table(["Skill", "Description"], rows);

      this.io.newLine();
      this.io.comment("Run a skill: bun cli skill:run <skill-name> [--options]");

      return 0;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.io.info("No .skills/ directory found");
        return 0;
      }
      throw error;
    }
  }
}
