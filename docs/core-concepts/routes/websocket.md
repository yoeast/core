# WebSocket Routes

> Real-time bidirectional communication.

## TL;DR

```ts
// app/routes/chat.ws.ts
import { WebSocketController } from "@yoeast/core";
import type { ServerWebSocket } from "bun";

export default class ChatController extends WebSocketController {
  open(ws: ServerWebSocket<unknown>) {
    ws.send("Welcome!");
  }

  message(ws: ServerWebSocket<unknown>, message: string | Uint8Array) {
    ws.send(`Echo: ${message}`);
  }

  close(ws: ServerWebSocket<unknown>, code: number, reason: string) {
    console.log(`Disconnected: ${code} ${reason}`);
  }
}
```

## Quick Reference

### File Extension
| Extension | Type |
|-----------|------|
| `.ws.ts` | WebSocket route |

### Lifecycle Methods
| Method | Signature | Required |
|--------|-----------|----------|
| `open(ws)` | `ServerWebSocket<unknown>` | Yes |
| `message(ws, data)` | `ServerWebSocket, string \| Uint8Array` | No |
| `close(ws, code, reason)` | `ServerWebSocket, number, string` | No |

### Controller Methods
| Method | Description |
|--------|-------------|
| `getRequest()` | Get the upgrade Request |
| `getParams()` | Get route parameters |
| `getQuery()` | Get query string as URLSearchParams |

### WebSocket Methods
| Method | Description |
|--------|-------------|
| `ws.send(data)` | Send to client |
| `ws.close()` | Close connection |
| `ws.subscribe(topic)` | Join a pub/sub topic |
| `ws.unsubscribe(topic)` | Leave a topic |
| `ws.publish(topic, data)` | Broadcast to topic |

## Guide

### Basic WebSocket

Create a `.ws.ts` file:

```ts
// app/routes/echo.ws.ts
import { WebSocketController } from "@yoeast/core";
import type { ServerWebSocket } from "bun";

export default class EchoController extends WebSocketController {
  open(ws: ServerWebSocket<unknown>) {
    console.log("Client connected");
  }

  message(ws: ServerWebSocket<unknown>, message: string | Uint8Array) {
    // Echo back the message
    ws.send(message);
  }
}
```

### Connection Lifecycle

Handle all connection events:

```ts
export default class ChatController extends WebSocketController {
  open(ws: ServerWebSocket<unknown>) {
    console.log("Client connected");
    ws.send(JSON.stringify({ type: "connected" }));
  }

  message(ws: ServerWebSocket<unknown>, message: string | Uint8Array) {
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    console.log("Received:", text);
    
    ws.send(JSON.stringify({ type: "received", data: text }));
  }

  close(ws: ServerWebSocket<unknown>, code: number, reason: string) {
    console.log(`Client disconnected: ${code} - ${reason}`);
  }
}
```

### Pub/Sub Topics

Bun's built-in pub/sub for broadcasting:

```ts
export default class RoomController extends WebSocketController {
  open(ws: ServerWebSocket<unknown>) {
    ws.subscribe("general");
    ws.send("Joined #general");
    ws.publish("general", "A new user joined!");
  }

  message(ws: ServerWebSocket<unknown>, message: string | Uint8Array) {
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    ws.publish("general", text);
  }

  close(ws: ServerWebSocket<unknown>, code: number, reason: string) {
    ws.publish("general", "A user left");
    ws.unsubscribe("general");
  }
}
```

### Dynamic Rooms

Use URL parameters for room names:

```ts
// app/routes/rooms/[room].ws.ts
import { WebSocketController } from "@yoeast/core";

export default class RoomController extends WebSocketController {
  open(ws: ServerWebSocket<unknown>) {
    const room = this.getParams().room;
    ws.subscribe(room);
    ws.publish(room, `User joined ${room}`);
  }

  message(ws: ServerWebSocket<unknown>, message: string | Uint8Array) {
    const room = this.getParams().room;
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    ws.publish(room, text);
  }
}
```

### JSON Messages

Handle structured data:

```ts
interface ChatMessage {
  type: "message" | "typing" | "leave";
  content?: string;
  user?: string;
}

export default class ChatController extends WebSocketController {
  message(ws: ServerWebSocket<unknown>, raw: string | Uint8Array) {
    try {
      const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
      const msg: ChatMessage = JSON.parse(text);
      
      switch (msg.type) {
        case "message":
          ws.publish("chat", JSON.stringify({
            type: "message",
            user: msg.user,
            content: msg.content,
            time: Date.now(),
          }));
          break;
          
        case "typing":
          ws.publish("chat", JSON.stringify({
            type: "typing",
            user: msg.user,
          }));
          break;
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: "Invalid JSON" }));
    }
  }
}
```

### Binary Data

Handle binary messages:

```ts
message(ws: ServerWebSocket<unknown>, data: string | Uint8Array) {
  if (typeof data !== "string") {
    // Binary data (Uint8Array)
    console.log("Binary message, bytes:", data.length);
    // Process bytes...
  } else {
    // Text data
    console.log("Text:", data);
  }
}
```

### Client Example

Connect from browser:

```js
const ws = new WebSocket("ws://localhost:3000/chat");

ws.onopen = () => {
  console.log("Connected");
  ws.send("Hello!");
};

ws.onmessage = (event) => {
  console.log("Received:", event.data);
};

ws.onclose = (event) => {
  console.log("Disconnected:", event.code, event.reason);
};

ws.onerror = (error) => {
  console.error("Error:", error);
};
```

### Connection State

Store per-connection data using Bun's ws.data:

```ts
interface UserData {
  username: string;
  joinedAt: number;
}

export default class ChatController extends WebSocketController {
  open(ws: ServerWebSocket<UserData>) {
    ws.data = {
      username: `User${Math.random().toString(36).slice(2, 6)}`,
      joinedAt: Date.now(),
    };
    ws.subscribe("chat");
  }

  message(ws: ServerWebSocket<UserData>, message: string | Uint8Array) {
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    ws.publish("chat", JSON.stringify({
      user: ws.data.username,
      message: text,
    }));
  }
}
```

## See Also

- [Routing](../routing.md) - File-based routing
- [SSE Routes](./sse.md) - Server-Sent Events
