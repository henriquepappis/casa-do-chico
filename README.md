# 🍺 Casa do Chico — Cardápio Digital

Aplicação mobile-first de cardápio digital para o bar & restaurante **Casa do Chico**. Projetada para ser acessada via QR code na mesa, permitindo que o cliente navegue pelo cardápio, monte o pedido e acompanhe o consumo da mesa — tudo sem precisar chamar o garçom para anotar.

---

## Funcionalidades

- **Identificação por mesa** — cliente informa o nome ao escanear o QR da mesa
- **Cardápio por categoria** — Bebidas, Petiscos, Refeições e Sobremesas
- **Carrinho interativo** — controle de quantidade (`− qty +`), observações por item e resumo do pedido
- **Envio para a cozinha** — pedido confirmado com um toque
- **Minha Conta** — histórico de tudo que foi pedido na mesa com status em tempo real (Preparando / Pronto / Entregue)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Linguagem | TypeScript |
| Build | [Vite](https://vite.dev/) |
| Estilo | [Tailwind CSS v4](https://tailwindcss.com/) |
| Ícones | [Lucide React](https://lucide.dev/) |
| Toasts | [Sonner](https://sonner.emilkowal.ski/) |

> Estado 100% client-side via React Context. Sem backend ou banco de dados por enquanto.

---

## Pré-requisitos

- Node.js 18+
- npm 9+

---

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone git@github.com:henriquepappis/casa-do-chico-front.git
cd casa-do-chico-front

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no navegador.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Lint com ESLint |

---

## Estrutura do projeto

```
src/
├── AppContext.tsx     # Estado global (Context API) — carrinho, pedidos, navegação
├── App.tsx            # Roteamento de telas via estado
├── LoginScreen.tsx    # Tela 1 — Identificação do cliente na mesa
├── MenuScreen.tsx     # Tela 2 — Cardápio com categorias e controles de quantidade
├── CartScreen.tsx     # Tela 3 — Revisão e envio do pedido
└── ReceiptScreen.tsx  # Tela 4 — Minha Conta / histórico da mesa
```

---

## Design

Estilo **rústico nordestino**, pensado para funcionar bem em dispositivos móveis.

| Token | Valor |
|---|---|
| Vermelho principal | `#C0392B` |
| Marrom escuro | `#3D0C0C` |
| Creme de fundo | `#FDF6EC` |
| Marrom médio | `#7B3F2A` |
| Fonte de título | Playfair Display |
| Fonte de texto | Lato |

A viewport máxima é **480px**, simulando um celular centralizado no desktop.

---

## Roadmap

- [ ] Integração com backend / API REST
- [ ] Status dos pedidos em tempo real (WebSocket)
- [ ] QR code dinâmico por mesa
- [ ] Painel administrativo para a cozinha
- [ ] Persistência de sessão por mesa

---

## Licença

Projeto privado — todos os direitos reservados a **Casa do Chico Bar & Restaurante**.
