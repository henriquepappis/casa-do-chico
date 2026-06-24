import type { SocketStream } from "@fastify/websocket";
type WebSocket = SocketStream["socket"];

export type WsEvent =
  | { type: "new_order"; tableNumber: number; customerName: string; orderId: string }
  | { type: "mesa_opened"; tableNumber: number }
  | { type: "mesa_closed"; tableNumber: number }
  | { type: "mesa_updated"; tableNumber: number };

const clients = new Set<WebSocket>();

export function addClient(ws: WebSocket) {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
}

export function broadcast(event: WsEvent) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  }
}
