import { Command } from "../command";
import { cache } from "../../cache";

export default class CacheClearCommand extends Command {
  static override signature = "cache:clear {--tags=} {--force}";
  static override description = "Clear the application cache";

  async handle(): Promise<number> {
    const tags = this.option("tags") as string | undefined;
    const force = this.option("force") as boolean | undefined;

    // Get cache info
    const info = cache.getInfo();
    
    if (!info.enabled) {
      this.io.warning("Cache is disabled");
      return 1;
    }

    if (tags && typeof tags === "string") {
      // Clear by tags - no confirmation needed
      const tagList = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      
      if (tagList.length === 0) {
        this.io.error("No valid tags provided");
        return 1;
      }

      this.io.info(`Clearing cache entries with tags: ${tagList.join(", ")}`);
      
      const count = await cache.flushTags(tagList);
      
      this.io.success(`Cleared ${count} cache entries`);
      return 0;
    }

    // Full cache clear - needs confirmation unless --force
    if (!force) {
      this.io.newLine();
      this.io.warning("⚠️  This will clear the ENTIRE cache!");
      this.io.info(`   Driver: ${info.driver}`);
      this.io.info(`   Prefix: ${info.prefix}`);
      this.io.newLine();
      
      const confirmed = await this.io.confirm("Are you sure you want to clear all cached data?", false);
      
      if (!confirmed) {
        this.io.info("Cache clear cancelled");
        return 0;
      }
    }

    // Get stats before clearing
    const statsBefore = cache.getStats();
    const sizeBefore = "size" in statsBefore ? statsBefore.size : undefined;

    await cache.clear();

    this.io.newLine();
    this.io.success("Cache cleared successfully!");
    
    if (sizeBefore !== undefined) {
      this.io.info(`   Cleared ${sizeBefore} entries`);
    }
    
    this.io.info(`   Driver: ${info.driver}`);
    
    return 0;
  }
}
