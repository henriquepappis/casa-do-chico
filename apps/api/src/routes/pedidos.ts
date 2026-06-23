import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { printOrder } from "../lib/printer.js";
import { broadcast } from "../lib/ws.js";

export async function pedidosRoutes(app: FastifyInstance) {
  // Cliente envia pedido (sem auth) — limitado a 10 pedidos/minuto por IP
  app.post("/pedidos", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (request, reply) => {
    const { tableNumber, customerName, clientId, items } = request.body as {
      tableNumber: number;
      customerName: string;
      clientId: string;
      items: { menuItemId: string; name: string; price: number; quantity: number; observation?: string }[];
    };

    if (!tableNumber || !customerName?.trim() || !items?.length) {
      return reply.code(400).send({ error: "tableNumber, customerName e items são obrigatórios" });
    }

    const mesa = await prisma.table.findUnique({ where: { number: tableNumber } });
    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });
    if (mesa.status === "LIVRE") {
      return reply.code(409).send({ error: "Mesa não está com sessão aberta" });
    }

    const sessao = await prisma.tableSession.findFirst({
      where: { tableId: mesa.id, closedAt: null },
    });
    if (!sessao) return reply.code(404).send({ error: "Nenhuma sessão ativa na mesa" });

    const pedido = await prisma.order.create({
      data: {
        sessionId: sessao.id,
        customerName: customerName.trim(),
        clientId: clientId ?? "",
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            observation: item.observation ?? "",
          })),
        },
      },
      include: { items: true },
    });

    broadcast({ type: "new_order", tableNumber, customerName: customerName.trim(), orderId: pedido.id });

    printOrder({
      tableNumber,
      customerName: customerName.trim(),
      orderId: pedido.id,
      createdAt: pedido.createdAt,
      items: pedido.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        observation: i.observation,
      })),
    }).catch(() => {});

    return reply.code(201).send(pedido);
  });

  // Pedidos do cliente na sessão ativa (público — requer mesa + clientId + sessão aberta)
  app.get("/mesas/:number/meus-pedidos", async (request, reply) => {
    const number = Number((request.params as { number: string }).number);
    const { clientId } = request.query as { clientId?: string };
    if (!clientId) return reply.code(400).send({ error: "clientId obrigatório" });

    const mesa = await prisma.table.findUnique({ where: { number } });
    if (!mesa || mesa.status === "LIVRE") return reply.code(404).send({ error: "Mesa não encontrada ou sem sessão ativa" });

    const sessao = await prisma.tableSession.findFirst({
      where: { tableId: mesa.id, closedAt: null },
      include: {
        orders: {
          where: { clientId },
          orderBy: { createdAt: "asc" },
          include: { items: true },
        },
      },
    });

    if (!sessao) return reply.code(404).send({ error: "Nenhuma sessão ativa" });
    return sessao.orders;
  });

  // Lista pedidos da sessão ativa de uma mesa
  app.get("/mesas/:number/pedidos", { preHandler: [app.authenticate] }, async (request, reply) => {
    const number = Number((request.params as { number: string }).number);

    const mesa = await prisma.table.findUnique({ where: { number } });
    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });

    const sessao = await prisma.tableSession.findFirst({
      where: { tableId: mesa.id, closedAt: null },
      include: {
        orders: {
          orderBy: { createdAt: "asc" },
          include: { items: true },
        },
      },
    });

    if (!sessao) return reply.code(404).send({ error: "Nenhuma sessão ativa na mesa" });

    const total = sessao.orders
      .flatMap((o) => o.items)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { sessaoId: sessao.id, openedAt: sessao.openedAt, orders: sessao.orders, total };
  });
}
