import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

type AuthUser = { id: string; username: string; role: string };

function requireDono(request: any, reply: any): AuthUser | null {
  const user = request.user as AuthUser;
  if (user.role !== "DONO") {
    reply.code(403).send({ error: "Apenas o dono pode gerenciar o cardápio" });
    return null;
  }
  return user;
}

const CATEGORIES = ["bebidas", "petiscos", "refeicoes", "sobremesas"] as const;
type Category = (typeof CATEGORIES)[number];

export async function cardapioRoutes(app: FastifyInstance) {
  // Público: só itens ativos (consumido pelo cardápio do cliente)
  app.get("/cardapio", async () => {
    return prisma.menuItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    });
  });

  // Gestão (DONO): todos os itens, inclusive inativos
  app.get("/cardapio/all", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;
    return prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { position: "asc" }],
    });
  });

  // Criar item (DONO)
  app.post("/cardapio", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    const body = request.body as {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      image?: string;
      badge?: string;
      position?: number;
      active?: boolean;
    };

    const name = body.name?.trim();
    const category = body.category as Category;

    if (!name) return reply.code(400).send({ error: "Nome é obrigatório" });
    if (typeof body.price !== "number" || body.price < 0) {
      return reply.code(400).send({ error: "Preço inválido" });
    }
    if (!CATEGORIES.includes(category)) {
      return reply.code(400).send({ error: "Categoria inválida" });
    }

    const item = await prisma.menuItem.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description: body.description?.trim() ?? "",
        price: body.price,
        category,
        image: body.image?.trim() ?? "",
        badge: body.badge?.trim() || null,
        position: body.position ?? 0,
        active: body.active ?? true,
      },
    });

    return reply.code(201).send(item);
  });

  // Atualizar item (DONO) — parcial
  app.patch("/cardapio/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      image?: string;
      badge?: string | null;
      position?: number;
      active?: boolean;
    };

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Item não encontrado" });

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (!body.name.trim()) return reply.code(400).send({ error: "Nome não pode ser vazio" });
      data.name = body.name.trim();
    }
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) {
        return reply.code(400).send({ error: "Preço inválido" });
      }
      data.price = body.price;
    }
    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category as Category)) {
        return reply.code(400).send({ error: "Categoria inválida" });
      }
      data.category = body.category;
    }
    if (body.image !== undefined) data.image = body.image.trim();
    if (body.badge !== undefined) data.badge = body.badge?.trim() || null;
    if (body.position !== undefined) data.position = body.position;
    if (body.active !== undefined) data.active = body.active;

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: "Nada para atualizar" });
    }

    const item = await prisma.menuItem.update({ where: { id }, data });
    return item;
  });

  // Remover item (DONO)
  app.delete("/cardapio/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Item não encontrado" });

    await prisma.menuItem.delete({ where: { id } });
    return reply.code(204).send();
  });
}
