import { useEffect, useRef } from "react";

const WS_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
  .replace(/^http/, "ws") + "/ws";

export type WsEvent =
  | { type: "new_order"; tableNumber: number }
  | { type: "mesa_opened"; tableNumber: number }
  | { type: "mesa_closed"; tableNumber: number };

export function useWebSocket(onEvent: (event: WsEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let ws: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let destroyed = false;

    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as WsEvent;
          onEventRef.current(event);
        } catch {}
      };

      ws.onclose = () => {
        if (!destroyed) retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimeout);
      ws?.close();
    };
  }, []);
}
