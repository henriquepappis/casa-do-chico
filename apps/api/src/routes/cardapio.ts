import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function cardapioRoutes(app: FastifyInstance) {
  app.get("/cardapio", async () => {
    return prisma.menuItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    });
  });
}
