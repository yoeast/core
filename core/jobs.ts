export abstract class CronJob {
  abstract schedule: string;
  abstract run(): Promise<void>;
}

export type CronJobConstructor = new () => CronJob;

export abstract class QueueJob {
  abstract name: string;
  abstract process(payload: unknown): Promise<void>;
}

export type QueueJobConstructor = new () => QueueJob;
