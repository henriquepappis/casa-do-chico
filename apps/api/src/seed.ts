import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Uso: npm run db:seed -w @casa-do-chico/api -- <usuario> "<senha>"');
  process.exit(1);
}
if (password.length < 6) {
  console.error("A senha deve ter pelo menos 6 caracteres.");
  process.exit(1);
}

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
