import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
});

// Rotas
app.get("/health", async () => ({ status: "ok" }));

// TODO: registrar rotas de mesas, pedidos, auth

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
