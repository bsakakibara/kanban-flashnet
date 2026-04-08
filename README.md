# Kanban Flash Net

Projeto desenvolvido como parte do processo seletivo para a vaga de Frontend Developer na Flash Net.

O objetivo era consumir uma API REST já existente e construir um sistema Kanban colaborativo com controle de permissões por usuário, histórico de interações imutável e regras de negócio refletidas corretamente na interface.

---

## Design

As telas foram projetadas no Figma antes do início da implementação, cobrindo todos os fluxos principais: login, lista de boards, board kanban, modal de movimentação obrigatória, detalhe do card com histórico e feed de atividade. O design inclui estados de loading (skeleton), erro, vazio e sucesso, além do layout responsivo para desktop e mobile.

🔗 **Figma:** [(https://www.figma.com/design/RYEBzrl3zgWNhuBsanx2Me/Kanban-Teste?node-id=1-3&t=9DfCJw8RDIVte0lT-1)]

---

## Tecnologias

| Biblioteca | Uso no projeto |
|---|---|
| Next.js 14 (App Router) | Framework principal com roteamento e renderização |
| TypeScript | Tipagem estática em todo o projeto |
| Zustand | Estado global de autenticação do usuário |
| TanStack Query | Cache, sincronização e invalidação de dados da API |
| Axios | Cliente HTTP com interceptor para refresh automático do token |
| @dnd-kit | Drag and drop dos cards entre colunas |
| lucide-react | Ícones da interface |
| js-cookie | Armazenamento seguro dos tokens JWT nos cookies |

---

## Pré-requisitos

- Node.js 18 ou superior
- npm

---

## Como rodar localmente

**1. Clone o repositório**

```bash
git clone https://github.com/bsakakibara/kanban-flashnet.git
cd kanban-flashnet
```

**2. Instale as dependências**

```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=https://bruno.flashnetbrasil.com.br/api/v1
```

**4. Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Usuários para teste

| Usuário | Senha | Papel | Status |
|---|---|---|---|
| admin | Admin@123 | admin — acessa todos os boards | ativo |
| alice | Teste@123 | editor no Projeto Alpha | ativo |
| bob | Teste@123 | editor no Projeto Alpha | ativo |
| carol | Teste@123 | viewer no Projeto Alpha | ativo |
| dave | Teste@123 | — | **inativo** |

> Tentar logar com `dave` retorna 403 — a interface exibe a mensagem de conta inativa conforme a regra RN-03.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/               # Tela de login com tratamento de erros
│   └── (app)/
│       ├── boards/              # Lista de boards do usuário
│       └── boards/[id]/         # Board Kanban com drag and drop
│           └── activity/        # Feed de atividade do board
│
├── components/
│   ├── kanban/
│   │   ├── KanbanCard.tsx       # Card arrastável com prioridade, tags e assignee
│   │   └── KanbanColumn.tsx     # Coluna com SortableContext e indicador de WIP
│   ├── modals/
│   │   ├── CardDetailModal.tsx  # Detalhe do card, histórico e comentários
│   │   └── CreateCardModal.tsx  # Formulário para criar novo card
│   ├── ui/
│   │   └── Avatar.tsx           # Avatar reutilizável com iniciais e cor por usuário
│   └── layout/
│       └── Providers.tsx        # Providers globais: QueryClient e outros wrappers
│
├── hooks/
│   ├── useAuth.ts               # Verifica token, busca usuário e redireciona se não autenticado
│   └── useBoard.ts              # Lógica de drag and drop, detecção de coluna destino e WIP limit
│
├── services/
│   ├── auth.ts                  # login, logout, refresh token, me
│   ├── boards.ts                # listar boards, buscar board por id, feed de atividade
│   └── cards.ts                 # criar, buscar, mover, comentar, arquivar, histórico
│
├── store/
│   └── auth.ts                  # Estado global com Zustand: usuário logado e flag de autenticação
│
├── types/
│   └── index.ts                 # Interfaces TypeScript: User, Board, Column, Card, CardHistory, etc.
│
└── lib/
    └── api.ts                   # Instância do Axios com baseURL e interceptor de refresh automático
```

---

## Serviços

**`auth.ts`** — login com username e senha, logout, renovação do access token via refresh token e busca dos dados do usuário logado (`/auth/me`).

**`boards.ts`** — listagem de boards que o usuário tem acesso, busca de um board específico com colunas e cards aninhados, e feed de atividade do board.

**`cards.ts`** — criação de card em uma coluna, busca de detalhes de um card, movimentação entre colunas com observação obrigatória, adição de comentários, arquivamento e busca do histórico completo de interações.

---

## Hooks

**`useAuth`** — encapsula a verificação de token e o carregamento do usuário. Usado nas três páginas protegidas (boards, board e atividade) para eliminar código duplicado.

**`useBoard`** — concentra toda a lógica do board: query dos dados, drag start/end com detecção correta de coluna destino, verificação de WIP limit antes de abrir o modal, e a mutation de mover card.

---

## Componentes

**`KanbanCard`** — card arrastável via dnd-kit. Distingue drag de clique simples pelo delta do mouse, evitando que o modal de detalhe abra durante um arrasto. Exibe título, tags, prioridade com ícone e avatar do responsável.

**`KanbanColumn`** — coluna do kanban com SortableContext para ordenação. Suporta modo desktop (largura fixa, scroll vertical) e modo mobile (largura 100%, sem altura máxima). Exibe alertas visuais de WIP limit quando a coluna está quase cheia ou no limite.

**`CardDetailModal`** — modal com duas abas: Detalhes (descrição, metadados, campo de comentário, botão de arquivar) e Histórico (interações em ordem cronológica inversa, com distinção visual entre comentários e movimentações).

**`CreateCardModal`** — formulário para criar card com título obrigatório, descrição, seletor de prioridade, tags com adição por Enter e campo de data limite.

**`Avatar`** — círculo com iniciais do usuário, cor derivada do primeiro caractere do username. Usado na sidebar, nos cards e no feed de atividade.

**`Providers`** — wrapper que envolve a aplicação com o `QueryClientProvider` do TanStack Query e outros providers globais necessários.

---

## Funcionalidades implementadas

### Autenticação
- Login com username e senha (RF-01)
- Refresh token automático via interceptor do Axios sem interrupção do fluxo (RF-02)
- Logout com limpeza de cookies
- Erro 401 para credenciais inválidas e 403 para usuário inativo (dave)

### Boards
- Listagem somente dos boards que o usuário tem acesso (RF-03)
- Cards com nome, permissão, contagem de membros e cards

### Board Kanban
- Colunas com cards aninhados (RF-04)
- Drag and drop entre colunas com @dnd-kit (RF-05)
- Modal de observação obrigatória ao mover — mínimo 10 caracteres (RF-06 / RF-07)
- Indicador visual de WIP: contador muda de cinza para laranja (quase no limite) e vermelho (atingido) (RF-13)
- Bloqueio de movimentação para coluna com WIP limit atingido com mensagem clara (RF-14)
- Viewers não conseguem mover, criar nem arquivar cards (RF-12)

### Cards
- Detalhe do card com todos os campos ao clicar (RF-08)
- Histórico completo em ordem cronológica inversa (RF-09)
- Comentários disponíveis para viewers e editors (RF-10)
- Criar card com título, descrição, prioridade, tags e data limite
- Arquivar card

### Feed de atividade
- Linha do tempo de todas as ações do board (RF-11)

### Responsividade
- Desktop: sidebar + colunas com scroll horizontal
- Mobile: topbar compacta + navegação por abas entre colunas + FAB para adicionar card (RNF-05)

---

## Build para produção

```bash
npm run build
npm start
```