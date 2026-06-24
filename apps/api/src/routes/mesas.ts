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

    // Preserva o histórico de vendas: mesa que já teve atendimento não é removida,
    // apenas desativada.
    const sessoes = await prisma.tableSession.count({ where: { tableId: mesa.id } });
    if (sessoes > 0) {
      return reply.code(409).send({
        error: "Mesa possui histórico de atendimento. Desative-a em vez de remover.",
      });
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
    if (mesa.status === "INATIVA") {
      return reply.code(409).send({ error: "Ative a mesa antes de abrir" });
    }

    const [sessao] = await prisma.$transaction([
      prisma.tableSession.create({ data: { tableId: mesa.id } }),
      prisma.table.update({ where: { id: mesa.id }, data: { status: "OCUPADA" } }),
    ]);

    broadcast({ type: "mesa_opened", tableNumber: number });
    return reply.code(201).send(sessao);
  });

  // Ativa a mesa (INATIVA -> LIVRE): passa a aceitar pedidos via QR
  app.patch("/mesas/:number/ativar", { preHandler: [app.authenticate] }, async (request, reply) => {
    const number = Number((request.params as { number: string }).number);
    const mesa = await prisma.table.findUnique({ where: { number } });

    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });
    if (mesa.status !== "INATIVA") {
      return reply.code(409).send({ error: "Mesa já está ativa" });
    }

    const atualizada = await prisma.table.update({
      where: { id: mesa.id },
      data: { status: "LIVRE" },
    });
    broadcast({ type: "mesa_updated", tableNumber: number });
    return atualizada;
  });

  // Desativa a mesa (LIVRE -> INATIVA): para de aceitar pedidos
  app.patch("/mesas/:number/desativar", { preHandler: [app.authenticate] }, async (request, reply) => {
    const number = Number((request.params as { number: string }).number);
    const mesa = await prisma.table.findUnique({ where: { number } });

    if (!mesa) return reply.code(404).send({ error: "Mesa não encontrada" });
    if (mesa.status === "OCUPADA") {
      return reply.code(409).send({ error: "Feche a mesa antes de desativar" });
    }
    if (mesa.status === "INATIVA") {
      return reply.code(409).send({ error: "Mesa já está inativa" });
    }

    const atualizada = await prisma.table.update({
      where: { id: mesa.id },
      data: { status: "INATIVA" },
    });
    broadcast({ type: "mesa_updated", tableNumber: number });
    return atualizada;
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

  // Transfere a sessão ativa de uma mesa para outra (garçom ou dono)
  app.post("/mesas/:number/transferir", { preHandler: [app.authenticate] }, async (request, reply) => {
    const origemNumero = Number((request.params as { number: string }).number);
    const { destino } = request.body as { destino?: number };

    if (!destino || typeof destino !== "number") {
      return reply.code(400).send({ error: "Mesa de destino é obrigatória" });
    }
    if (destino === origemNumero) {
      return reply.code(400).send({ error: "A mesa de destino deve ser diferente da origem" });
    }

    const origem = await prisma.table.findUnique({ where: { number: origemNumero } });
    if (!origem) return reply.code(404).send({ error: "Mesa de origem não encontrada" });
    if (origem.status !== "OCUPADA") {
      return reply.code(409).send({ error: "A mesa de origem não está ocupada" });
    }

    const mesaDestino = await prisma.table.findUnique({ where: { number: destino } });
    if (!mesaDestino) return reply.code(404).send({ error: "Mesa de destino não encontrada" });
    if (mesaDestino.status === "OCUPADA") {
      return reply.code(409).send({ error: `A Mesa ${destino} já está ocupada` });
    }

    const sessao = await prisma.tableSession.findFirst({
      where: { tableId: origem.id, closedAt: null },
    });
    if (!sessao) return reply.code(409).send({ error: "Nenhuma sessão ativa para transferir" });

    // Reaponta a sessão (e seus pedidos) para a mesa de destino.
    await prisma.$transaction([
      prisma.tableSession.update({ where: { id: sessao.id }, data: { tableId: mesaDestino.id } }),
      prisma.table.update({ where: { id: origem.id }, data: { status: "LIVRE" } }),
      prisma.table.update({ where: { id: mesaDestino.id }, data: { status: "OCUPADA" } }),
    ]);

    broadcast({ type: "mesa_updated", tableNumber: origemNumero });
    broadcast({ type: "mesa_opened", tableNumber: destino });
    return reply.code(200).send({ origem: origemNumero, destino });
  });
}
