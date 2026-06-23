import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.code(400).send({ error: "username e password são obrigatórios" });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }

    const token = app.jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      { expiresIn: "8h" }
    );

    return { token, user: { id: user.id, username: user.username, role: user.role } };
  });

  app.get(
    "/auth/me",
    { preHandler: [app.authenticate] },
    async (request) => {
      return request.user;
    }
  );
}
