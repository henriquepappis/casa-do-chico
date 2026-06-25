# Casa do Chico — Contexto do Projeto

> Documento de contexto para retomar o projeto em qualquer máquina. O Claude Code
> carrega este arquivo automaticamente. Para passos de deploy detalhados, ver [DEPLOY.md](DEPLOY.md).

## O que é

Sistema para um bar (**Casa do Chico**) com **autoatendimento por QR-code**:
o cliente lê o QR da mesa, vê o cardápio e faz pedidos pelo celular; a equipe
acompanha tudo por um painel administrativo em tempo real. Pagamento é feito
**fora do app** (no PDV do dono) — o app não processa pagamento.

## Arquitetura (monorepo npm workspaces)

```
casa-do-chico/
├── apps/
│   ├── web/     → app do cliente (cardápio + pedidos por QR)  — React + Vite + Tailwind
│   ├── admin/   → painel da equipe/dono                        — React + Vite + Tailwind v4
│   └── api/     → backend                                      — Fastify + Prisma + Postgres
├── packages/
│   └── types/   → tipos compartilhados (@casa-do-chico/types, só source)
├── render.yaml  → blueprint de deploy da API no Render
└── DEPLOY.md    → guia de deploy (Neon + Render + Cloudflare Pages)
```

Scripts na raiz: `npm run dev:web | dev:admin | dev:api` e `build:web | build:api`.

## Stack

- **API**: Fastify 4, Prisma 5 (Postgres), `@fastify/jwt`, `@fastify/websocket`,
  `@fastify/cors`, `@fastify/rate-limit`, `bcrypt`. ESM (`"type": "module"`), TypeScript.
- **Web** (cliente): React 19, Vite, Tailwind, PWA (workbox/service worker), WebSocket.
- **Admin**: React 19, Vite, **Tailwind v4** (`@tailwindcss/vite`), componentes shadcn-style
  stub em `src/components/ui`. Navegação por estado (sem router). Alias `@/` → `src/`.
- Gráficos no admin são **CSS/SVG puro** (sem lib de chart).

## Modelo de domínio e regras de negócio

### Ciclo de vida da mesa (status `INATIVA | LIVRE | OCUPADA`)
- **INATIVA**: mesa criada, **não aceita pedido**. É o status padrão ao criar.
- **LIVRE**: em operação; o cliente pode ler o QR e pedir. O **1º pedido abre a
  sessão automaticamente** e move para OCUPADA.
- **OCUPADA**: sessão ativa, pedidos rolando.
- Transições (equipe, no painel): **ativar** (INATIVA→LIVRE), **desativar**
  (LIVRE→INATIVA), **fechar** (OCUPADA→LIVRE, encerra a sessão), **transferir**
  (move a sessão de uma OCUPADA para outra não-ocupada; origem vira LIVRE).
- `abrir` manual (LIVRE→OCUPADA) existe como opção secundária (garçom lança no balcão).
- **Deletar mesa**: só se nunca teve sessão (preserva histórico de vendas).

### Comanda única por cliente
Um cliente é identificado por `clientId` (UUID no localStorage do device). Ele
**não pode pedir em duas mesas ao mesmo tempo**: se já tem pedido numa sessão
aberta na Mesa X e tenta acessar a Mesa Y, é bloqueado.
- Backend: guard no `POST /pedidos` + `GET /clientes/:clientId/comanda`.
- Frontend: `BlockedScreen` ("Sua comanda está na Mesa X" + voltar).
- Libera automaticamente quando o garçom fecha a Mesa X.
- Limitação: é por device (limpar o navegador escapa) — resolve table-hopping
  acidental, não fraude.

### Cardápio, usuários, relatórios
- **Cardápio**: CRUD no painel (página Cardápio, só DONO). Itens têm categoria
  (`bebidas|petiscos|refeicoes|sobremesas`), preço, imagem (URL), selo, ativo.
  O cliente só vê itens ativos.
- **Usuários**: gestão no painel (só DONO). Papéis `DONO | GARCOM`. Proteções:
  não remover a si mesmo nem o último DONO; senha mín. 6 (bcrypt).
- **Relatórios** (só DONO): período flexível (hoje/7d/mês/custom), tendência
  diária, horários de pico (por hora e dia da semana), curva ABC de produtos,
  lista de sessões fechadas. `GET /relatorio?from&to&tz`.
- **Visão Geral** (home do DONO, só DONO): KPIs do dia ao vivo (faturamento
  fechado + em aberto, ticket médio, pedidos na última hora), status das mesas,
  comparativo com ontem, tendência 7 dias. `GET /dashboard?tz`. Atualiza via WebSocket.
- **Sem ciclo de status de pedido** (PREPARANDO→PRONTO→ENTREGUE existe no enum
  mas **não é usado** — decisão de produto; o bar não trabalha assim).

## Modelo de dados (Prisma — `apps/api/prisma/schema.prisma`)

- `Table` (number único, status `TableStatus`) → tem várias `TableSession`.
- `TableSession` (openedAt, closedAt) → tem vários `Order`. Sessão aberta = `closedAt null`.
  **Transferir mesa = reapontar `tableId` da sessão** (pedidos vão junto).
- `Order` (customerName, clientId, status `OrderStatus`) → tem vários `OrderItem`.
- `OrderItem` (snapshot: name, price, quantity, observation, menuItemId).
- `MenuItem` (id, name, description, price, category `MenuCategory`, image, badge, active, position).
- `User` (username único, passwordHash, role `UserRole`).
- Enums: `TableStatus {LIVRE, OCUPADA, INATIVA}`, `OrderStatus {PREPARANDO, PRONTO, ENTREGUE}`,
  `MenuCategory {bebidas, petiscos, refeicoes, sobremesas}`, `UserRole {DONO, GARCOM}`.

## Rotas da API (`apps/api/src/routes`)

Auth via JWT (`Authorization: Bearer`). "DONO" = checagem de papel no handler.

- `POST /auth/login`, `GET /auth/me`
- `GET /mesas` (auth), `GET /mesas/:number` (público, p/ cliente)
- `POST /mesas` (DONO), `DELETE /mesas/:number` (DONO)
- `POST /mesas/:n/abrir|fechar` (auth), `PATCH /mesas/:n/ativar|desativar` (auth),
  `POST /mesas/:n/transferir` (auth)
- `POST /pedidos` (público, rate-limited) — abre sessão no 1º pedido, barra INATIVA,
  barra comanda em outra mesa
- `GET /clientes/:clientId/comanda` (público), `GET /mesas/:n/meus-pedidos` (público),
  `GET /mesas/:n/pedidos` (auth)
- `GET /cardapio` (público, só ativos), `GET /cardapio/all` (DONO),
  `POST /cardapio` (DONO), `PATCH|DELETE /cardapio/:id` (DONO)
- `GET /users` (DONO), `POST /users` (DONO), `PATCH|DELETE /users/:id` (DONO)
- `GET /relatorio?from&to&tz` (DONO), `GET /dashboard?tz` (DONO)
- `GET /ws` (WebSocket), `GET /health`

WebSocket: `broadcast()` em `lib/ws.ts`. Eventos: `new_order`, `mesa_opened`,
`mesa_closed`, `mesa_updated`. Painel e app do cliente recarregam ao receber.

## Frontend

### Admin (`apps/admin/src`)
- Navegação por estado em `App.tsx` (sem router). `NavItem`/`View`. Dono cai na
  **Visão Geral**; garçom vai pras **Mesas** (e não vê menus de gestão).
- Páginas: `VisaoGeralPage`, `MesasPage`, `MesaDetailPage`, `CardapioPage`,
  `RelatorioPage`, `UsuariosPage`, `LoginPage`.
- `DashboardLayout` = sidebar + conteúdo; itens com `donoOnly`.
- `lib/api.ts` = cliente HTTP (token em `localStorage` `admin_token`/`admin_user`),
  `lib/auth.ts` = getUser/getToken/saveAuth/clearAuth, `lib/useWebSocket.ts`.
- Tema dark via `class="dark"` no `<html>` (`index.html`) + Tailwind v4.

### Web/cliente (`apps/web/src`)
- `clientId` (UUID localStorage), `customerName` salvo, `tableNumber` lido da URL `?mesa=`.
- Telas: `LoginScreen` (nome), `MenuScreen`, `CartScreen`, `ReceiptScreen`,
  `BlockedScreen` (comanda em outra mesa). Roteamento por `screen` no `AppContext`.
- `lib/api.ts`, `lib/useWebSocket.ts`, `lib/profanity.ts`. PWA com banner offline.

## Deploy e infraestrutura

| Parte | Onde | URL |
|---|---|---|
| Banco | **Neon** (Postgres, free) | (DATABASE_URL no Render) |
| API | **Render** (free) | https://casa-do-chico-api.onrender.com |
| Web (cardápio) | **Cloudflare Pages** (conectado ao git) | https://www.henriquepappis.com |
| Admin | **Cloudflare Pages** (deploy via Wrangler CLI) | https://casa-do-chico-admin.pages.dev (+ admin.henriquepappis.com) |

- **API (Render)**: blueprint `render.yaml`. **Auto-deploy no push pra `main`**.
  O build roda `prisma migrate deploy` antes de subir (migrations aplicam sozinhas).
  Env vars no painel: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (origens dos
  fronts separadas por vírgula, p/ CORS), `NODE_VERSION=22`. Plano free → **cold
  start ~50s** após inatividade (mitigar com ping no `/health`, ex. UptimeRobot).
- **Web**: Cloudflare Pages ligado ao git → **auto-deploy no push**. Precisa de
  `VITE_API_URL` setado no projeto.
- **Admin**: ⚠️ **NÃO é git-deploy** — a integração git do Cloudflare criava um
  Worker errado. O admin é publicado **manualmente via Wrangler**:
  ```bash
  VITE_API_URL=https://casa-do-chico-api.onrender.com npm run build -w apps/admin
  npx wrangler pages deploy apps/admin/dist --project-name casa-do-chico-admin --branch main --commit-dirty=true
  ```
  (precisa `npx wrangler login` uma vez). **Sempre republicar o admin manualmente
  após mexer no admin.**

## Rodar localmente

- Postgres local; `apps/api/.env` com `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/casadochico`,
  `JWT_SECRET`, etc. (ver `.env.example`). **Nunca commitar `.env` real.**
- API: `npm run dev:api` (tsx watch, porta 3000). Web: `npm run dev:web`. Admin: `npm run dev:admin` (porta 5174).
- Migrations: `npm run db:migrate -w @casa-do-chico/api` (dev) / `db:deploy` (prod).
- Criar/resetar dono: `DATABASE_URL=... npm run db:set-senha -w @casa-do-chico/api -- <usuario> "<senha>"`
  (upsert: cria como DONO se não existir, ou troca a senha). **Não há seeds** — o
  primeiro usuário é criado por aqui ou direto no banco; cardápio é gerenciado no painel.

## Decisões e armadilhas (gotchas)

- **Segredos**: `JWT_SECRET` e a URL do Neon só vivem em `.env`/painel do Render.
  O `.env.example` tem só placeholders.
- **Migration de enum no Postgres**: adicionar valor de enum e usá-lo (ex. default)
  na mesma migration falha. Fazer em **duas migrations** (já feito p/ INATIVA).
- **Fuso horário**: relatórios/dashboard recebem `tz` (= `getTimezoneOffset()` do
  cliente) p/ agrupar por **dia local** (Brasil UTC-3). Não agrupar por UTC.
- **CORS**: `FRONTEND_URL` no Render deve listar as origens dos dois fronts.
- **Impressora térmica** (`escpos` em `lib/printer.ts`): só funciona na rede local
  do bar; **não alcança da nuvem**. Exigiria um agente local — não implementado.
- **Sem pagamento no app** e **sem ciclo de status de pedido** (decisões de produto).

## Estado atual / futuro

- Pronto e em produção: app do cliente, ciclo de mesas, comanda única,
  transferência, cardápio, usuários, **Visão Geral** e **Relatórios**.
- O banco de **produção (Neon) ainda não foi limpo** de dados de teste (o ambiente
  local foi limpo). Quando quiser, preparar um comando p/ rodar contra o Neon.
- Domínio do admin vai mudar p/ `*.casadochico.com.br` quando for pra produção real
  (~previsto após o período de testes).
- Ideias futuras não priorizadas: pagamento, impressão via agente local, testes
  automatizados, métricas por garçom (exigiria registrar quem atende).

## Marcos (git, branch `main`)

Histórico recente reflete a evolução: painel admin + gestão de usuários →
preparo de deploy (Neon/Render/Cloudflare) → gestão de cardápio →
ciclo de vida das mesas + comanda única + transferência → Visão Geral + Relatórios.
Use `git log --oneline` para os detalhes.
