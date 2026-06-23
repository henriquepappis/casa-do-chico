import { FastifyInstance } from "fastify";
import { addClient } from "../lib/ws.js";

export async function wsRoutes(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket: import("@fastify/websocket").SocketStream) => {
    addClient(socket.socket);
  });
}
