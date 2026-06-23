import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

const username = process.argv[2] ?? "dono";
const password = process.argv[3] ?? "senha123";

const existing = await prisma.user.findUnique({ where: { username } });
if (existing) {
  console.log(`Usuário "${username}" já existe.`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
const user = await prisma.user.create({
  data: { username, passwordHash, role: "DONO" },
});

console.log(`Usuário criado: ${user.username} (${user.role})`);
await prisma.$disconnect();
