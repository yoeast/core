import { CronJob } from "@yoeast/core";

/**
 * Example cron job - runs daily at 3am.
 * Create your own cron jobs by extending CronJob.
 */
export default class ExampleDailyCron extends CronJob {
  schedule = "0 3 * * *";

  async run(): Promise<void> {
    // Implement your cron logic here
  }
}
