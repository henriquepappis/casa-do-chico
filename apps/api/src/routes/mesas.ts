import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { broadcast } from "../lib/ws.js";

export async function mesasRoutes(app: FastifyInstance) {
  // Lista todas as mesas com sessão ativa (se houver)
  app.get("/mesas", { preHandler: [app.authenticate] }, async () => {
    const mesas = await prisma.table.findMany({
      orderBy: { number: "asc" },
      include: {
        sessions: {
          where: { closedAt: null },
          take: 1,
          include: {
            orders: {
              include: { items: true },
            },
          },
        },
      },
    });

    return mesas.map((mesa) => {
      const sessao = mesa.sessions[0] ?? null;
      return {
        id: mesa.id,
        number: mesa.number,
        status: mesa.status,
        sessao: sessao
          ? {
              id: sessao.id,
              openedAt: sessao.openedAt,
              orders: sessao.orders,
              total: sessao.orders.flatMap((o) => o.items).reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              ),
            }
          : null,
      };
    });
  });

  // Retorna uma mesa pelo número (sem auth — usada pelo frontend do cliente)
  app.get("/mesas/:number", async (request, reply) => {
    const number = Number((request.params as { number: string }).number);
    const mesa = await prisma.table.findUnique({
      where: { number },
      include: {
        sessions: {
          where: { closedAt: null },
          take: 1,
        },
      },
    });

    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });

    return {
      id: mesa.id,
      number: mesa.number,
      status: mesa.status,
      sessao: mesa.sessions[0] ?? null,
    };
  });

  // Cria uma nova mesa (só DONO)
  app.post("/mesas", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { role: string };
    if (user.role !== "DONO") {
      return reply.code(403).send({ error: "Apenas o dono pode criar mesas" });
    }

    const { number } = request.body as { number: number };
    if (!number || typeof number !== "number") {
      return reply.code(400).send({ error: "Número da mesa é obrigatório" });
    }

    const existing = await prisma.table.findUnique({ where: { number } });
    if (existing) {
      return reply.code(409).send({ error: `Mesa ${number} já existe` });
    }

    const mesa = await prisma.table.create({ data: { number } });
    return reply.code(201).send(mesa);
  });

  // Remove uma mesa (só DONO, somente se estiver LIVRE)
  app.delete("/mesas/:number", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { role: string };
    if (user.role !== "DONO") {
      return reply.code(403).send({ error: "Apenas o dono pode remover mesas" });
    }

    const number = Number((request.params as { number: string }).number);
    const mesa = await prisma.table.findUnique({ where: { number } });

    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });
    if (mesa.status === "OCUPADA") {
      return reply.code(409).send({ error: "Mesa está ocupada, feche a sessão antes de remover" });
    }

    await prisma.table.delete({ where: { number } });
    return reply.code(204).send();
  });

  // Abre uma sessão na mesa
  app.post("/mesas/:number/abrir", { preHandler: [app.authenticate] }, async (request, reply) => {
    const number = Number((request.params as { number: string }).number);
    const mesa = await prisma.table.findUnique({ where: { number } });

    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });
    if (mesa.status === "OCUPADA") {
      return reply.code(409).send({ error: "Mesa já está ocupada" });
    }

    const [sessao] = await prisma.$transaction([
      prisma.tableSession.create({ data: { tableId: mesa.id } }),
      prisma.table.update({ where: { id: mesa.id }, data: { status: "OCUPADA" } }),
    ]);

    broadcast({ type: "mesa_opened", tableNumber: number });
    return reply.code(201).send(sessao);
  });

  // Fecha a sessão ativa da mesa
  app.post("/mesas/:number/fechar", { preHandler: [app.authenticate] }, async (request, reply) => {
    const number = Number((request.params as { number: string }).number);
    const mesa = await prisma.table.findUnique({ where: { number } });

    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });
    if (mesa.status === "LIVRE") {
      return reply.code(409).send({ error: "Mesa já está livre" });
    }

    const sessao = await prisma.tableSession.findFirst({
      where: { tableId: mesa.id, closedAt: null },
    });

    if (!sessao) return reply.code(404).send({ error: "Nenhuma sessão ativa encontrada" });

    const [sessaoFechada] = await prisma.$transaction([
      prisma.tableSession.update({
        where: { id: sessao.id },
        data: { closedAt: new Date() },
      }),
      prisma.table.update({ where: { id: mesa.id }, data: { status: "LIVRE" } }),
    ]);

    broadcast({ type: "mesa_closed", tableNumber: number });
    return sessaoFechada;
  });
}
