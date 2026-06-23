import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

type AuthUser = { id: string; username: string; role: string };

function requireDono(request: any, reply: any): AuthUser | null {
  const user = request.user as AuthUser;
  if (user.role !== "DONO") {
    reply.code(403).send({ error: "Apenas o dono pode gerenciar usuários" });
    return null;
  }
  return user;
}

const ROLES = ["DONO", "GARCOM"] as const;

export async function usersRoutes(app: FastifyInstance) {
  // Lista todos os usuários (só DONO)
  app.get("/users", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    return prisma.user.findMany({
      orderBy: [{ role: "asc" }, { username: "asc" }],
      select: { id: true, username: true, role: true, createdAt: true },
    });
  });

  // Cria um novo usuário (só DONO)
  app.post("/users", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!requireDono(request, reply)) return;

    const body = request.body as { username?: string; password?: string; role?: string };
    const username = body.username?.trim();
    const password = body.password ?? "";
    const role = body.role ?? "GARCOM";

    if (!username || !password) {
      return reply.code(400).send({ error: "Usuário e senha são obrigatórios" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: "A senha deve ter pelo menos 6 caracteres" });
    }
    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      return reply.code(400).send({ error: "Função inválida" });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return reply.code(409).send({ error: `Usuário "${username}" já existe` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: role as (typeof ROLES)[number] },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return reply.code(201).send(user);
  });

  // Atualiza um usuário — reset de senha e/ou função (só DONO)
  app.patch("/users/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const dono = requireDono(request, reply);
    if (!dono) return;

    const { id } = request.params as { id: string };
    const body = request.body as { password?: string; role?: string };

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return reply.code(404).send({ error: "Usuário não encontrado" });

    const data: { passwordHash?: string; role?: (typeof ROLES)[number] } = {};

    if (body.password !== undefined) {
      if (body.password.length < 6) {
        return reply.code(400).send({ error: "A senha deve ter pelo menos 6 caracteres" });
      }
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    if (body.role !== undefined) {
      if (!ROLES.includes(body.role as (typeof ROLES)[number])) {
        return reply.code(400).send({ error: "Função inválida" });
      }
      // Impede rebaixar o último DONO
      if (target.role === "DONO" && body.role !== "DONO") {
        const donos = await prisma.user.count({ where: { role: "DONO" } });
        if (donos <= 1) {
          return reply.code(409).send({ error: "Não é possível rebaixar o único dono" });
        }
      }
      data.role = body.role as (typeof ROLES)[number];
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: "Nada para atualizar" });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });

    return user;
  });

  // Remove um usuário (só DONO)
  app.delete("/users/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const dono = requireDono(request, reply);
    if (!dono) return;

    const { id } = request.params as { id: string };

    if (id === dono.id) {
      return reply.code(409).send({ error: "Você não pode remover a si mesmo" });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return reply.code(404).send({ error: "Usuário não encontrado" });

    // Impede remover o último DONO
    if (target.role === "DONO") {
      const donos = await prisma.user.count({ where: { role: "DONO" } });
      if (donos <= 1) {
        return reply.code(409).send({ error: "Não é possível remover o único dono" });
      }
    }

    await prisma.user.delete({ where: { id } });
    return reply.code(204).send();
  });
}
