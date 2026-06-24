import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error('Uso: npm run db:set-senha -w @casa-do-chico/api -- <usuario> "<senha>"');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

// Atualiza a senha se o usuário existir; cria como DONO se não existir.
const user = await prisma.user.upsert({
  where: { username },
  update: { passwordHash },
  create: { username, passwordHash, role: "DONO" },
});

console.log(`Senha definida para "${user.username}" (${user.role}).`);
await prisma.$disconnect();
