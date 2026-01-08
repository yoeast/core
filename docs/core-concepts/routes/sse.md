# Server-Sent Events (SSE)

> Stream real-time updates to clients.

## TL;DR

```ts
// app/routes/events.sse.ts
import { SseController } from "@core";

export default class EventsController extends SseController {
  async *handle() {
    yield this.event({ event: "connected", data: JSON.stringify({ time: Date.now() }) });
    
    for (let i = 0; i < 10; i++) {
      yield this.event({ event: "tick", data: JSON.stringify({ count: i }) });
      await Bun.sleep(1000);
    }
  }
}
```

## Quick Reference

### File Extension
| Extension | Type |
|-----------|------|
| `.sse.ts` | SSE route |

### Controller Methods
| Method | Description |
|--------|-------------|
| `handle()` | Returns `AsyncIterable<SseEvent \| string>` or `ReadableStream` |
| `event(evt)` | Format an SSE event string |
| `streamFrom(iterable)` | Convert async iterable to ReadableStream |
| `getRequest()` | Get the Request object |
| `getParams()` | Get route parameters |
| `getQuery()` | Get query string as URLSearchParams |

### SseEvent Interface
```ts
interface SseEvent {
  data: string;      // Required: event data
  event?: string;    // Event name
  id?: string;       // Event ID
  retry?: number;    // Reconnection time (ms)
}
```

## Guide

### Basic SSE Stream

Create a `.sse.ts` file with an async generator:

```ts
// app/routes/time.sse.ts
import { SseController, type SseEvent } from "@core";

export default class TimeController extends SseController {
  async *handle(): AsyncGenerator<SseEvent> {
    while (true) {
      yield this.event({
        event: "time",
        data: JSON.stringify({
          timestamp: Date.now(),
          iso: new Date().toISOString(),
        }),
      });
      await Bun.sleep(1000);
    }
  }
}
```

### Event Types

Send different event types:

```ts
async *handle() {
  // Named events
  yield this.event({ event: "user:joined", data: JSON.stringify({ id: 123 }) });
  yield this.event({ event: "message", data: JSON.stringify({ text: "Hello!" }) });
  
  // Default event (no name, just data)
  yield this.event({ data: "plain message" });
  
  // With event ID (for resuming)
  yield this.event({ id: "msg-1", event: "update", data: "..." });
}
```

### Using streamFrom()

Convert any async iterable to a stream:

```ts
async handle() {
  return this.streamFrom(this.generateEvents());
}

private async *generateEvents() {
  for (let i = 0; i < 100; i++) {
    yield this.event({ data: String(i) });
    await Bun.sleep(100);
  }
}
```

### Database Polling

Stream database changes:

```ts
// app/routes/notifications.sse.ts
import { SseController, type SseEvent } from "@core";
import { Notification } from "@app/models/Notification";

export default class NotificationsController extends SseController {
  async *handle(): AsyncGenerator<SseEvent> {
    const userId = this.getQuery().get("userId");
    let lastCheck = new Date();
    
    yield this.event({ event: "connected", data: JSON.stringify({ userId }) });
    
    while (true) {
      const notifications = await Notification.find({
        userId,
        createdAt: { $gt: lastCheck },
      });
      
      for (const n of notifications) {
        yield this.event({
          event: "notification",
          data: JSON.stringify({
            id: n.id,
            title: n.title,
            message: n.message,
          }),
        });
      }
      
      lastCheck = new Date();
      await Bun.sleep(2000);
    }
  }
}
```

### Progress Updates

Stream progress for long operations:

```ts
// app/routes/import.sse.ts
export default class ImportController extends SseController {
  async *handle(): AsyncGenerator<SseEvent> {
    const items = await getItemsToImport();
    const total = items.length;
    
    yield this.event({ event: "started", data: JSON.stringify({ total }) });
    
    for (let i = 0; i < items.length; i++) {
      await processItem(items[i]);
      
      yield this.event({
        event: "progress",
        data: JSON.stringify({
          current: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
        }),
      });
    }
    
    yield this.event({ event: "completed", data: JSON.stringify({ total }) });
  }
}
```

### Client Example

Connect from browser:

```js
const events = new EventSource("/events?userId=123");

events.onopen = () => {
  console.log("Connected to SSE");
};

// Listen for specific events
events.addEventListener("tick", (e) => {
  const data = JSON.parse(e.data);
  console.log("Tick:", data.count);
});

events.addEventListener("notification", (e) => {
  const data = JSON.parse(e.data);
  showNotification(data);
});

// Default message event
events.onmessage = (e) => {
  console.log("Message:", e.data);
};

events.onerror = (e) => {
  console.error("SSE error:", e);
};

// Close connection
// events.close();
```

### With Route Parameters

```ts
// app/routes/stream/[channel].sse.ts
export default class ChannelController extends SseController {
  async *handle() {
    const channel = this.getParams().channel;
    const format = this.getQuery().get("format") ?? "json";
    
    yield this.event({ event: "subscribed", data: JSON.stringify({ channel, format }) });
    
    // Stream channel updates...
  }
}
```

## SSE vs WebSocket

| Feature | SSE | WebSocket |
|---------|-----|-----------|
| Direction | Server → Client only | Bidirectional |
| Protocol | HTTP | WS |
| Reconnection | Automatic | Manual |
| Binary data | No | Yes |
| Complexity | Simple | More complex |

Use SSE when you only need server-to-client streaming. Use WebSocket when you need bidirectional communication.

## See Also

- [Routing](../routing.md) - File-based routing
- [WebSocket Routes](./websocket.md) - Bidirectional real-time
