# Casa do Chico - Painel Administrativo | Design Brainstorm

## Três Abordagens Estilísticas

### 1. **Minimalismo Corporativo Austero**
Tema escuro puro com tons de cinza neutro, tipografia sans-serif limpa, grids rigorosos. Foco total em funcionalidade e legibilidade. Acento único em vermelho para ações críticas.
**Probabilidade:** 0.08

### 2. **Sofisticação Quente (ESCOLHIDO)**
Tema escuro profundo com tons de marrom/terracota que remetem à identidade visual do restaurante. Tipografia com contraste entre display elegante e body legível. Acentos em vermelho vibrante (ocupado), verde suave (livre) e âmbar (financeiro). Microinterações fluidas.
**Probabilidade:** 0.72

### 3. **Minimalismo Moderno Frio**
Tema escuro com azuis e cinzas frios, tipografia geométrica, componentes com bordas afiadas. Aesthetic tech-forward, mas desconectado da identidade do restaurante.
**Probabilidade:** 0.06

---

## Design Philosophy: Sofisticação Quente

### Design Movement
**Neoclassicismo Digital** — Elegância clássica reinterpretada através de interfaces modernas. Inspiração em design de interiores premium de restaurantes, com paleta quente e proporções generosas.

### Core Principles
1. **Hierarquia Clara**: Tipografia e espaçamento definem fluxo visual sem necessidade de cores agressivas
2. **Paleta Quente Profunda**: Marrom escuro (#1a1410) como base, com acentos em vermelho, verde e âmbar que comunicam status
3. **Espaçamento Generoso**: Padding e gaps amplos criam sensação de sofisticação, não de aperto
4. **Movimento Sutil**: Transições suaves (200-250ms) em hover/focus, nunca jarring

### Color Philosophy
- **Background Base**: `#0f0d0a` (marrom quase preto) — profundo, acolhedor, rememorando madeira escura
- **Card/Surface**: `#1a1410` (marrom escuro) — elevação sutil, não branco/cinza genérico
- **Text Primary**: `#f5f1ed` (bege muito claro) — contraste perfeito, quente
- **Accent Red**: `#dc2626` (vermelho vibrante) — mesas ocupadas, ações destrutivas
- **Accent Green**: `#16a34a` (verde natural) — mesas livres, status positivo
- **Accent Amber**: `#d97706` (âmbar quente) — total em aberto, atenção neutra
- **Border/Divider**: `rgba(255,255,255,0.08)` (branco muito transparente) — sutil, não cinza

### Layout Paradigm
- **Sidebar Assimétrico**: Largura fixa (280px desktop), drawer mobile com hambúrguer
- **Conteúdo Fluido**: Não centralizado, alinhado à esquerda com máximo de 1200px
- **Duas Colunas (Detalhe)**: Esquerda scrollável, direita sticky — padrão de SPA profissional

### Signature Elements
1. **Tipografia em Duas Camadas**: Display elegante (Playfair Display) para títulos, body limpo (Inter) para conteúdo
2. **Cards com Borda Sutil**: Borda de 1px em rgba(255,255,255,0.1), não sombra pesada
3. **Badges de Status Coloridas**: Pequenas pílulas com cor de fundo + ícone, ex: "Ocupada" em vermelho

### Interaction Philosophy
- Hover em cards de mesa: elevação suave + borda mais visível
- Click em mesa: transição suave para detalhe (fade + slide)
- Confirmação de "Fechar Mesa": inline confirmation com 2 botões, não modal
- Feedback visual em botões: scale(0.97) + cor mais clara no active

### Animation
- **Entrada de Cards**: Fade + slide-up em 200ms, staggered por 40ms
- **Transição de Página**: Fade suave (150ms) entre rotas
- **Hover de Botão**: Scale 1.02 em 150ms ease-out
- **Confirmação Inline**: Expand/collapse em 200ms
- **Respeitar prefers-reduced-motion**: Desabilitar animações se usuário preferir

### Typography System
- **Display/Títulos**: Playfair Display 700, 32-48px (títulos de página)
- **Subtítulos**: Inter 600, 16-18px, cor muted
- **Body**: Inter 400, 14-16px
- **Labels/Badges**: Inter 500, 12-14px
- **Números (Valores)**: Inter 700, 20-28px (para totalizadores)

### Brand Essence
**Posicionamento**: Painel administrativo premium que reflete a sofisticação do restaurante Casa do Chico, oferecendo controle operacional com elegância.
**Personalidade**: Profissional, Confiável, Acolhedor

### Brand Voice
- Headlines: Diretas, sem fluff. Ex: "Mesas Ocupadas" (não "Veja suas mesas ocupadas")
- CTAs: Ação clara. Ex: "Fechar Mesa" (não "Processar Encerramento")
- Microcopy: Tom consultivo. Ex: "Confirme para fechar a mesa" (não "Tem certeza?")

### Wordmark & Logo
Usar o logo fornecido (Casa do Chico) em versão simplificada no header: apenas a casa + chamas em branco/bege, sem texto. Favicon: versão pequena do símbolo.

### Signature Brand Color
**Vermelho Casa do Chico**: `#dc2626` — cor primária para ações críticas, status ocupado, e destaque visual em todo o painel.

---

## Implementação
Todos os componentes seguirão esta filosofia:
- Paleta quente profunda (marrom + acentos)
- Tipografia em duas camadas (Playfair + Inter)
- Espaçamento generoso
- Microinterações suaves
- Badges e cards como elementos visuais principais
