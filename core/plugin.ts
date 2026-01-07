import type { RouteDefinition } from "./types";
import type { MiddlewareConstructor } from "./middleware";

export interface AppContext {
  routes: RouteDefinition[];
  middleware: MiddlewareConstructor[];
}

export abstract class Plugin {
  async init(_app: AppContext): Promise<void> {}
}

export type PluginConstructor = new () => Plugin;
