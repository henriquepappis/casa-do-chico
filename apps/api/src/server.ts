import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import jwtPlugin from "./plugins/jwt.js";
import { authRoutes } from "./routes/auth.js";
import { usersRoutes } from "./routes/users.js";
import { mesasRoutes } from "./routes/mesas.js";
import { pedidosRoutes } from "./routes/pedidos.js";
import { wsRoutes } from "./routes/ws.js";
import { cardapioRoutes } from "./routes/cardapio.js";
import { relatorioRoutes } from "./routes/relatorio.js";

const app = Fastify({ logger: true });

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : true;

await app.register(cors, { origin: allowedOrigins });
await app.register(rateLimit, {
  global: false,
});
await app.register(websocket);
await app.register(jwtPlugin);

app.get("/health", async () => ({ status: "ok" }));
await app.register(authRoutes);
await app.register(usersRoutes);
await app.register(mesasRoutes);
await app.register(pedidosRoutes);
await app.register(wsRoutes);
await app.register(cardapioRoutes);
await app.register(relatorioRoutes);

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
