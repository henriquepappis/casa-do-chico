import { prisma } from "./lib/prisma.js";

const items = [
  // BEBIDAS
  {
    id: "beb-01", name: "Cerveja Gelada",
    description: "Long neck 355ml trincando de gelada",
    price: 9.9, category: "bebidas" as const,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80",
    badge: "Mais Pedido", position: 1,
  },
  {
    id: "beb-02", name: "Caipirinha da Casa",
    description: "Cachaça artesanal, limão, açúcar e bastante gelo",
    price: 18.0, category: "bebidas" as const,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80",
    position: 2,
  },
  {
    id: "beb-03", name: "Suco Natural",
    description: "Suco da fruta de 400ml — Caju, manga, goiaba ou maracujá",
    price: 12.0, category: "bebidas" as const,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80",
    position: 3,
  },
  {
    id: "beb-04", name: "Refrigerante Zero",
    description: "Lata 350ml trincando — Coca-Cola Zero, Guaraná Antárctica",
    price: 7.0, category: "bebidas" as const,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
    position: 4,
  },
  // PETISCOS
  {
    id: "pet-01", name: "Tábua de Petiscos",
    description: "Macaxeira crocante frita, queijo coalho assado na chapa e coxinhas artesanais (serve 2 pessoas)",
    price: 42.9, category: "petiscos" as const,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
    badge: "Mais Pedido", position: 1,
  },
  {
    id: "pet-02", name: "Macaxeira Frita",
    description: "Porção de macaxeira frita bem crocante salpicada com manteiga de garrafa",
    price: 22.0, category: "petiscos" as const,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
    position: 2,
  },
  {
    id: "pet-03", name: "Queijo Coalho Grelhado",
    description: "Espetinhos de queijo coalho dourados na chapa com fio de mel de engenho legítimo",
    price: 24.0, category: "petiscos" as const,
    image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&q=80",
    position: 3,
  },
  {
    id: "pet-04", name: "Coxinha de Catupiry",
    description: "Coxinhas fritas na hora com recheio cremoso de frango desfiado e catupiry legítimo (6 unidades)",
    price: 28.0, category: "petiscos" as const,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
    position: 4,
  },
  // REFEIÇÕES
  {
    id: "ref-01", name: "Picanha Inteira na Chapa",
    description: "Picanha fatiada grelhada (300g), acompanhada de batatas fritas douradas, farofa caseira e vinagrete",
    price: 79.9, category: "refeicoes" as const,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    badge: "Destaque", position: 1,
  },
  {
    id: "ref-02", name: "Carne do Sol Acetrinada",
    description: "Autêntica carne do sol desfiada na manteiga de garrafa puxada na cebola roxa, acompanha fritas",
    price: 65.9, category: "refeicoes" as const,
    image: "https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=400&q=80",
    badge: "Mais Pedido", position: 2,
  },
  {
    id: "ref-03", name: "Baião de Dois Especial",
    description: "Arroz cozido no caldo de feijão verde, queijo coalho em cubos, linguiça defumada e bacon",
    price: 45.0, category: "refeicoes" as const,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    position: 3,
  },
  // SOBREMESAS
  {
    id: "sob-01", name: "Bolo de Rolo Pernambucano",
    description: "Fatia generosa do tradicional bolo de rolo artesanal com recheio denso de goiabada cascão",
    price: 16.0, category: "sobremesas" as const,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
    badge: "Novo", position: 1,
  },
  {
    id: "sob-02", name: "Cartola Tradicional",
    description: "Banana prata frita na chapa, coberta com queijo coalho derretido, açúcar refinado e canela em pó",
    price: 22.0, category: "sobremesas" as const,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
    position: 2,
  },
];

for (const item of items) {
  await prisma.menuItem.upsert({
    where: { id: item.id },
    update: item,
    create: item,
  });
  console.log(`✓ ${item.name}`);
}

console.log(`\n${items.length} itens do cardápio sincronizados.`);
await prisma.$disconnect();
