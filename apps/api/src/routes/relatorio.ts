import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

type AuthUser = { role: string };

function requireDono(request: any, reply: any): boolean {
  const user = request.user as AuthUser;
  if (user.role !== "DONO") {
    reply.code(403).send({ error: "Apenas o dono pode acessar o caixa" });
    return false;
  }
  return true;
}

export async function relatorioRoutes(app: FastifyInstance) {
  // Relatório de um período (sessões fechadas) — só DONO.
  // from/to são ISO timestamps; o cliente envia os limites do dia em hora local.
  app.get("/relatorio", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    const q = request.query as { from?: string; to?: string; tz?: string };
    const tz = Number(q.tz ?? 0) || 0;
    const inicio = q.from ? new Date(q.from) : new Date(new Date().setHours(0, 0, 0, 0));
    const fim = q.to ? new Date(q.to) : new Date();
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return reply.code(400).send({ error: "Datas inválidas" });
    }

    const shift = (d: Date) => new Date(d.getTime() - tz * 60000);
    const dayKey = (d: Date) => shift(d).toISOString().slice(0, 10);

    const sessoes = await prisma.tableSession.findMany({
      where: { closedAt: { not: null, gte: inicio, lte: fim } },
      include: { table: true, orders: { include: { items: true } } },
      orderBy: { closedAt: "desc" },
    });

    const itensMap = new Map<string, { name: string; quantidade: number; total: number }>();
    const porDiaMap = new Map<string, number>();
    const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: h, total: 0, pedidos: 0 }));
    const porDiaSemana = Array.from({ length: 7 }, (_, d) => ({ dow: d, total: 0, pedidos: 0 }));
    let totalVendido = 0;
    let totalPedidos = 0;

    const sessoesOut = sessoes.map((s) => {
      const allItems = s.orders.flatMap((o) => o.items);
      const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      totalVendido += total;
      totalPedidos += s.orders.length;
      if (s.closedAt) {
        const k = dayKey(s.closedAt);
        porDiaMap.set(k, (porDiaMap.get(k) ?? 0) + total);
      }
      for (const o of s.orders) {
        const ot = o.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const sh = shift(o.createdAt);
        porHora[sh.getUTCHours()].total += ot;
        porHora[sh.getUTCHours()].pedidos += 1;
        porDiaSemana[sh.getUTCDay()].total += ot;
        porDiaSemana[sh.getUTCDay()].pedidos += 1;
      }
      for (const i of allItems) {
        const cur = itensMap.get(i.name) ?? { name: i.name, quantidade: 0, total: 0 };
        cur.quantidade += i.quantity;
        cur.total += i.price * i.quantity;
        itensMap.set(i.name, cur);
      }
      const clientes = new Set(s.orders.map((o) => o.clientId).filter(Boolean)).size;
      return {
        id: s.id, tableNumber: s.table.number, openedAt: s.openedAt, closedAt: s.closedAt,
        total, pedidos: s.orders.length, clientes, orders: s.orders,
      };
    });

    // Tendência diária: lista ordenada de dias no período (máx 92 dias)
    const tendencia: { dia: string; total: number }[] = [];
    for (let t = inicio.getTime(), n = 0; t <= fim.getTime() && n < 92; t += 86400000, n++) {
      const key = dayKey(new Date(t));
      if (!tendencia.some((x) => x.dia === key)) tendencia.push({ dia: key, total: porDiaMap.get(key) ?? 0 });
    }

    // Curva ABC: itens por receita, com participação acumulada
    let acum = 0;
    const itens = [...itensMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((it) => {
        const share = totalVendido ? it.total / totalVendido : 0;
        acum += share;
        return { ...it, share, acumulado: acum, classe: acum <= 0.8 ? "A" : acum <= 0.95 ? "B" : "C" };
      });

    const mesasAtendidas = sessoes.length;
    return {
      resumo: {
        totalVendido,
        mesasAtendidas,
        totalPedidos,
        ticketMedio: mesasAtendidas ? totalVendido / mesasAtendidas : 0,
      },
      tendencia,
      porHora,
      porDiaSemana,
      itens,
      sessoes: sessoesOut,
    };
  });

  // Visão geral do dono: KPIs do dia + tendência 7 dias + comparativo com ontem.
  // tz = getTimezoneOffset() do cliente (minutos), para agrupar por dia local.
  app.get("/dashboard", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    const tz = Number((request.query as { tz?: string }).tz ?? 0) || 0;
    const now = new Date();
    const localKey = (d: Date) => new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
    const todayKey = localKey(now);
    const yesterdayKey = localKey(new Date(now.getTime() - 86400000));
    const totalDe = (orders: { items: { price: number; quantity: number }[] }[]) =>
      orders.flatMap((o) => o.items).reduce((a, i) => a + i.price * i.quantity, 0);

    // Mesas + sessões abertas (faturamento em aberto)
    const tables = await prisma.table.findMany({
      include: { sessions: { where: { closedAt: null }, include: { orders: { include: { items: true } } } } },
    });
    let ocupadas = 0, livres = 0, inativas = 0, emAberto = 0;
    for (const t of tables) {
      if (t.status === "OCUPADA") ocupadas++;
      else if (t.status === "LIVRE") livres++;
      else inativas++;
      if (t.sessions[0]) emAberto += totalDe(t.sessions[0].orders);
    }

    // Sessões fechadas dos últimos 8 dias (cobre tendência + ontem + hoje)
    const desde = new Date(now.getTime() - 8 * 86400000);
    const fechadas = await prisma.tableSession.findMany({
      where: { closedAt: { not: null, gte: desde } },
      include: { orders: { include: { items: true } } },
    });

    const porDia = new Map<string, number>();
    let fechadoHoje = 0, mesasHoje = 0, fechadoOntem = 0;
    for (const s of fechadas) {
      const key = localKey(s.closedAt!);
      const tot = totalDe(s.orders);
      porDia.set(key, (porDia.get(key) ?? 0) + tot);
      if (key === todayKey) { fechadoHoje += tot; mesasHoje++; }
      if (key === yesterdayKey) fechadoOntem += tot;
    }

    const tendencia: { dia: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = localKey(new Date(now.getTime() - i * 86400000));
      tendencia.push({ dia: key, total: porDia.get(key) ?? 0 });
    }

    const pedidosUltimaHora = await prisma.order.count({
      where: { createdAt: { gte: new Date(now.getTime() - 3600000) } },
    });

    return {
      hoje: {
        faturamento: fechadoHoje + emAberto,
        faturamentoFechado: fechadoHoje,
        emAberto,
        ticketMedio: mesasHoje ? fechadoHoje / mesasHoje : 0,
        mesasFechadas: mesasHoje,
        pedidosUltimaHora,
      },
      mesas: { ocupadas, livres, inativas },
      ontem: {
        faturamento: fechadoOntem,
        variacao: fechadoOntem > 0 ? ((fechadoHoje - fechadoOntem) / fechadoOntem) * 100 : null,
      },
      tendencia,
    };
  });
}
