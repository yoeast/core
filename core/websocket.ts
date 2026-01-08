import type { RouteParams } from "./types";
import type { ServerWebSocket } from "bun";

export abstract class WebSocketController {
  private req!: Request;
  private params: RouteParams = {};
  private query: URLSearchParams = new URLSearchParams();

  _init(req: Request, params: RouteParams, query: URLSearchParams): void {
    this.req = req;
    this.params = params;
    this.query = query;
  }

  protected getRequest(): Request {
    return this.req;
  }

  protected getParams(): RouteParams {
    return { ...this.params };
  }

  protected getQuery(): URLSearchParams {
    return new URLSearchParams(this.query);
  }

  abstract open(ws: ServerWebSocket<unknown>): void | Promise<void>;
  message?(ws: ServerWebSocket<unknown>, message: string | Uint8Array): void | Promise<void>;
  close?(ws: ServerWebSocket<unknown>, code: number, reason: string): void | Promise<void>;
}

export type WebSocketControllerConstructor = new () => WebSocketController;
