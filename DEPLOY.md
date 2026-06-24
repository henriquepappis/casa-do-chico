# Deploy — Casa do Chico

Arquitetura de produção (100% gratuita):

| Parte | Onde | Custo |
|---|---|---|
| Banco de dados (Postgres) | **Neon** | grátis |
| API (Fastify) | **Render** (plano free) | grátis |
| Front cliente (`apps/web`) | **Cloudflare Pages** | grátis |
| Painel admin (`apps/admin`) | **Cloudflare Pages** | grátis |

> O front já está no Cloudflare. Este guia cobre banco + API + variáveis.

---

## 1. Banco de dados — Neon

1. Crie uma conta em https://neon.tech e um projeto (região mais próxima do Render, ex. US East).
2. Em **Connection string**, copie a URL no formato:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Guarde essa URL — é o `DATABASE_URL` da produção.

As migrations são aplicadas automaticamente no deploy do Render (`prisma migrate deploy`
roda no build). Você não precisa rodar nada manualmente no Neon.

---

## 2. API — Render

1. Em https://render.com, **New > Blueprint** e selecione este repositório.
   O Render lê o [`render.yaml`](render.yaml) e cria o serviço `casa-do-chico-api`.
2. Preencha as variáveis de ambiente (marcadas como "sync:false"):
   - `DATABASE_URL` → a URL do Neon do passo 1
   - `JWT_SECRET` → gere uma chave forte:
     ```bash
     openssl rand -base64 32
     ```
   - `FRONTEND_URL` → as origens dos dois fronts, **separadas por vírgula**:
     ```
     https://www.henriquepappis.com,https://admin.henriquepappis.com
     ```
     (ajuste para os domínios reais do web e do admin)
3. O deploy roda: `npm ci` → gera o Prisma Client → aplica migrations → compila → sobe.
4. A URL pública fica algo como `https://casa-do-chico-api.onrender.com`. Teste:
   ```bash
   curl https://casa-do-chico-api.onrender.com/health   # {"status":"ok"}
   ```

### Criar o primeiro usuário (dono) e o cardápio

Os seeds rodam uma única vez, a partir da sua máquina, apontando para o Neon:

```bash
# na raiz do projeto
DATABASE_URL="<URL_DO_NEON>" npm run db:seed -w @casa-do-chico/api -- dono "SUA_SENHA_FORTE"
DATABASE_URL="<URL_DO_NEON>" npm run db:seed-cardapio -w @casa-do-chico/api
```

Depois disso, novos usuários você cria pelo próprio painel admin (menu **Usuários**).

---

## 3. Fronts — Cloudflare Pages

São **dois** projetos no Pages (web e admin). Para cada um:

| Campo | `apps/web` | `apps/admin` |
|---|---|---|
| Build command | `npm ci && npm run build -w apps/web` | `npm ci && npm run build -w apps/admin` |
| Build output dir | `apps/web/dist` | `apps/admin/dist` |
| Root dir | (raiz do repo) | (raiz do repo) |

Variável de ambiente (build) em **ambos**:

```
VITE_API_URL = https://casa-do-chico-api.onrender.com
```

> Lembre de incluir o domínio final de cada Pages no `FRONTEND_URL` do Render (passo 2.2),
> senão o navegador bloqueia por CORS.

---

## 4. Cold start (importante no plano free do Render)

No plano free, a API "dorme" após ~15 min sem requisições e demora ~50s para acordar.
Para manter acordada no horário do restaurante, configure um ping gratuito ao `/health`:

- **UptimeRobot** (https://uptimerobot.com, grátis): monitor HTTP para
  `https://casa-do-chico-api.onrender.com/health` a cada 5 min.

Assim o cold start só acontece, no máximo, na primeira abertura do dia.

---

## Notas

- **Impressora térmica** (`escpos`): só funciona na rede local do restaurante. Rodando
  a API na nuvem, a impressão direta não alcança a impressora — isso exigiria um agente
  rodando localmente. Não bloqueia o resto do sistema.
- **Trocar de host depois** é simples: o banco (Neon) é independente. Para mover a API do
  Render para Railway/Fly, só recriar o serviço com as mesmas variáveis de ambiente.
- **Nunca** comite `.env` real. Apenas `.env.example` (com placeholders) vai pro git.
