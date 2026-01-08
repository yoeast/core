import { QueueJob } from "@yoeast/core";

/**
 * Example queue job.
 * Create your own queue jobs by extending QueueJob.
 */
export default class ExampleJob extends QueueJob {
  name = "example";

  async process(_payload: unknown): Promise<void> {
    // Implement your job logic here
  }
}
