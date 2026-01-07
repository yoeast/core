import type { RouteParams } from "./types";

export interface SseEvent {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
}

export abstract class SseController {
  private req!: Request;
  private params: RouteParams = {};
  private query: URLSearchParams = new URLSearchParams();

  protected getRequest(): Request {
    return this.req;
  }

  protected getParams(): RouteParams {
    return { ...this.params };
  }

  protected getQuery(): URLSearchParams {
    return new URLSearchParams(this.query);
  }

  protected event(event: SseEvent): string {
    return formatEvent(event);
  }

  protected streamFrom(events: AsyncIterable<SseEvent | string>): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const evt of events) {
            const chunk = typeof evt === "string" ? evt : formatEvent(evt);
            controller.enqueue(encoder.encode(chunk));
          }
        } finally {
          controller.close();
        }
      },
    });
  }

  async run(req: Request, params: RouteParams, query: URLSearchParams): Promise<Response> {
    this.req = req;
    this.params = params;
    this.query = query;
    
    const body = await this.handle();
    const stream = body instanceof ReadableStream ? body : this.streamFrom(body);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  protected abstract handle(): AsyncIterable<SseEvent | string> | ReadableStream<Uint8Array>;
}

export type SseControllerConstructor = new () => SseController;

function formatEvent(event: SseEvent): string {
  let out = "";
  if (event.id) out += `id: ${event.id}\n`;
  if (event.event) out += `event: ${event.event}\n`;
  if (event.retry !== undefined) out += `retry: ${event.retry}\n`;
  const lines = event.data.split("\n");
  for (const line of lines) {
    out += `data: ${line}\n`;
  }
  return out + "\n";
}
