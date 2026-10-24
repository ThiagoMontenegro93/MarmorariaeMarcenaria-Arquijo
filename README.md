# Arquijo Marmoraria e Marcenaria — Sistema (MVP Fase 2)

Sistema de móveis planejados ponta a ponta — do primeiro contato até o recebimento do valor — para a **Arquijo Marmoraria e Marcenaria** (R. Mupia, Rio de Janeiro - RJ, 21220-320 · +55 21 98450-3570 · Seg–Dom 08:00–20:00).

- **Motor de cálculo de chapas** (guilhotina 2D, serra, veio, sobras, estoque vs compra) e prévia de custo do orçamento
- **API** NestJS + Prisma + PostgreSQL: OS com 9 etapas, prioridade, prazo e atraso; financeiro; catálogo; B2B; dashboard; WhatsApp; auditoria
- **Site** Next.js 15 + React 19 + Tailwind: home, coleções, página para empresas com formulário, contato com Google Maps
- **Área interna** com login (cookie httpOnly) e menus por perfil: dashboard, Kanban de OS e detalhe (timeline, financeiro, WhatsApp), projetos com cut list e plano de corte em SVG, chapas, CRM B2B
- **PDFs** (orçamento, OS, proposta B2B, lista de compra) gerados na API com a marca e os contatos
- **PWA do marceneiro**: medição na obra com fotos, funciona offline e sincroniza ao voltar a rede

Documento de arquitetura completo (requisitos, segurança, LGPD, deploy, riscos, critérios de aceite): [`docs/arquitetura.md`](docs/arquitetura.md).

## Arquitetura

```mermaid
flowchart LR
  U[Cliente / equipe] --> W[apps/web<br/>Next.js 15 + Tailwind]
  W -- REST/JSON --> A[apps/api<br/>NestJS 11]
  A --> C[packages/calc<br/>motor puro de chapas]
  A -- Prisma --> P[(PostgreSQL 16)]
  A -- link wa.me / Business API (Fase 2) --> Z[WhatsApp]
  W -- links --> G[Google Maps]
```

```
arquijo/
├─ packages/calc/   motor de cálculo (TypeScript puro, sem dependências) + testes Vitest
├─ apps/api/        NestJS + Prisma (schema, migrações, seed) + testes das regras de negócio
├─ apps/web/        Next.js 15 (App Router) + React 19 + Tailwind
├─ docs/            arquitetura.md (documento NEXUS)
├─ docker-compose.yml · .env.example
```

## Stack

NestJS 11 (Express 5) · Prisma 5 · PostgreSQL 16 · Next.js 15.5 + React 19 · Tailwind 3 · Vitest. O prompt mestre indicava Next.js 14; a versão foi atualizada por segurança (vulnerabilidades críticas/altas no Next 14 e no NestJS 10).

## Requisitos

- Node.js 20+ (testado com 22) e npm 10+
- PostgreSQL 16 (local ou via Docker)
- Docker + Docker Compose (opcional, para subir tudo junto)

## Instalação e execução

### Opção A — Docker (tudo junto)

```bash
cp .env.example .env
# edite .env: troque DB_PASSWORD (em POSTGRES_PASSWORD e DATABASE_URL), SECRET_KEY_AQUI e defina SEED_ADMIN_SENHA
docker compose up -d --build
docker compose exec api npx prisma db seed     # carrega coleções, modelos, combos, chapas e o admin
```

- Site: http://localhost:3000 · API: http://localhost:3001 · Swagger: http://localhost:3001/docs

### Opção B — Local (desenvolvimento)

```bash
npm install                                   # instala todos os workspaces
cp apps/api/.env.example apps/api/.env        # ajuste DATABASE_URL e JWT_SECRET
cp apps/web/.env.example apps/web/.env.local

npm run build -w @arquijo/calc                # a API consome o motor compilado
cd apps/api
npx prisma migrate dev                        # cria o banco (migrações versionadas)
SEED_ADMIN_SENHA='SuaSenhaForte123' SEED_DEMO=true npx prisma db seed
npm run start:dev                             # API em :3001
# em outro terminal, na raiz:
npm run dev:web                               # site em :3000
```

Acesse `http://localhost:3000/login`. Usuários do seed (todos com a senha de `SEED_ADMIN_SENHA`):

| E-mail | Perfil | Vê |
|---|---|---|
| `admin@arquijo.com.br` | ADMIN | tudo |
| `gestor@arquijo.com.br` (demo) | GESTOR | tudo, inclusive dashboard |
| `comercial@arquijo.com.br` (demo) | COMERCIAL | OS, projetos, chapas, leads, medição |
| `marceneiro@arquijo.com.br` (demo) | MARCENEIRO | OS, projetos, chapas, medição |

Na API direta: `POST /auth/login` → use o `accessToken` como `Bearer` (botão *Authorize* no Swagger em `:3001/docs`).

No celular, abra `/app/medicao` uma vez com rede: o service worker guarda a tela e ela passa a abrir offline (medições ficam no aparelho até sincronizar).

## Testes e verificação

```bash
npm test                                      # motor (20) + API (40, inclui PDFs e uploads) + web (19) — Vitest
npm run test -w @arquijo/calc                 # só o motor (inclui exemplo do PDF e 50 peças < 2s)
npm run typecheck -w @arquijo/api             # TypeScript estrito da API
cd apps/api && npx prisma validate && npx prisma generate
npm run build                                 # calc + api (nest build) + web (next build)
npm audit --omit=dev                          # dependências de produção (esperado: 0)
```

Testes ponta a ponta (Playwright já instalado no ambiente; navegadores não são baixados pelo projeto). Precisam de banco recém-semeado, API em `:3001` e web em `:3000` (`npm run start -w @arquijo/api` e `npm run start -w @arquijo/web` após o build, com `COOKIE_SECURE=false` em HTTP local):

```bash
cd apps/api && SEED_ADMIN_SENHA='SenhaLocal123' SEED_DEMO=true npx prisma migrate reset --force && cd ../..
npm run e2e        # e2e/telas.cjs (login, dashboard, Kanban, pagamento, cálculo, PDF, perfis, logout)
                   # e2e/medicao-offline.cjs (SW, offline, IndexedDB, foto, sincronização)
```

Os roteiros usam a senha `SenhaLocal123` (variável `E2E_SENHA` para trocar) e alteram dados (movem a OS-101): rode o reset antes de repetir.

Fluxo manual sugerido (Swagger): login → `GET /projetos` (projeto demo) → `POST /projetos/{id}/calcular` → `POST /ordens-servico` com `projetoId` → `PATCH /ordens-servico/{id}/avancar` → `POST /pagamentos/plano-padrao/{id}` → `PATCH /pagamentos/{id}/confirmar` → `GET /dashboard`.

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `DATABASE_URL` | api | Conexão PostgreSQL (`postgresql://usuario:DB_PASSWORD@host:5432/arquijo`) |
| `JWT_SECRET` | api | Segredo do JWT. Em produção: ≥ 32 caracteres, sem placeholder (a API recusa subir) |
| `JWT_EXPIRES_IN` | api | Validade do token (padrão `8h`) |
| `CORS_ORIGINS` | api | Origens permitidas, separadas por vírgula |
| `PORT` | api | Porta (padrão 3001) |
| `WHATSAPP_PROVIDER` | api | `link` (wa.me, padrão) ou `business_api` (Fase 2) |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | api | Credenciais da WhatsApp Business API (Fase 2) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_SENHA` | seed | Primeiro administrador (senha obrigatória em produção) |
| `SEED_DEMO` | seed | `true` cria usuários gestor/comercial/marceneiro, clientes, projeto com a cut list do PDF, 3 OS, pagamentos e 1 lead |
| `STORAGE_PROVIDER` | api | `local` (padrão, disco) ou `s3` (interface pronta, implementação pendente) |
| `UPLOAD_DIR` | api | Pasta das fotos no modo local (padrão `./uploads`; no Compose, volume `arquivos_api`) |
| `S3_BUCKET` | api | Bucket para o modo `s3` |
| `COOKIE_SECURE` | web | `true`/`false` força o atributo Secure do cookie de sessão (padrão: `true` em produção) |
| `NEXT_PUBLIC_API_URL` | web | URL da API vista pelo navegador |
| `API_URL_INTERNA` | web | URL da API vista pelo servidor Next (no Compose: `http://api:3001`) |
| `POSTGRES_USER/PASSWORD/DB` | compose | Credenciais do container PostgreSQL |

Nunca versione `.env`. Os arquivos `.env.example` contêm apenas placeholders (`SECRET_KEY_AQUI`, `DB_PASSWORD`, `TOKEN_AQUI`, `API_KEY_AQUI`).

## Erros comuns

| Sintoma | Solução |
|---|---|
| `Cannot find module '@arquijo/calc'` na API | Rode `npm run build -w @arquijo/calc` (os scripts `build`/`typecheck` da API já fazem isso) |
| `Can't reach database server` | PostgreSQL parado ou `DATABASE_URL` errada |
| API não sobe: "Configuração inválida" | Falta `DATABASE_URL`/`JWT_SECRET`, ou placeholder em produção |
| 422 ao calcular | Peça maior que a chapa (ou veio impede girar) — a mensagem diz qual |
| 429 | Rate limit (login 5/min, lead 5/10 min) — aguarde |
| Site mostra catálogo mesmo com a API fora | Comportamento esperado: fallback estático |
| Login volta para `/login` em HTTP local de produção | Defina `COOKIE_SECURE=false` (o navegador descarta cookie Secure fora de HTTPS) |
| 403 "Origem não permitida" em `/api/*` | A requisição veio de outra origem (proteção CSRF); acesse pelo mesmo domínio do site |
| Medição fica "pendente" | Sem rede ou sessão expirada: ela continua no aparelho; entre de novo e ela sincroniza |

## Roadmap

**Fase 1 — MVP (este repositório):** motor de chapas e custo; API completa (auth/RBAC, chapas, projetos + cálculo, OS com etapas/atraso/Gantt, pagamentos, catálogo, B2B, dashboard, WhatsApp link, auditoria); banco com migrações e seed; site público.

**Fase 2 — feito neste repositório:** dependências atualizadas por segurança; login com cookie httpOnly e telas internas (dashboard, Kanban/detalhe de OS, projetos com plano de corte SVG, chapas, CRM B2B); PDFs RF24; PWA offline de medição com fotos; testes ponta a ponta com Playwright.

**Fase 2 — pendente:** tela de Gantt; armazenamento S3 real (hoje disco local); WhatsApp Business API com envio automático; mapa Google embarcado; fotos reais das obras da R. Mupia; domínio próprio; CSV/relatório financeiro.

**Fase 3 — escala:** otimizador de corte com múltiplas heurísticas e reaproveitamento de retalhos, portal B2B com login, teste de carga para 100+ projetos simultâneos, avaliações Google no dashboard.

## Riscos

- **Dependências**: a stack do PDF previa Next.js 14; por segurança foi atualizada para **Next.js 15.5 + React 19** e **NestJS 11 (Express 5)**, com `overrides` no `package.json` raiz para dependências transitivas. `npm audit --omit=dev` = 0 vulnerabilidades em out/2026. Mantenha Dependabot/Renovate e rode o audit no CI.
- **Heurística de corte**: guilhotina com *best short side fit* é rápida e correta, mas não garante o mínimo absoluto de chapas.
- **WhatsApp Business API** depende de aprovação da Meta e templates; o MVP funciona só com links `wa.me`.
- **Fotos de medição** ficam em disco local (volume Docker) até o S3 ser implementado: faça backup do volume.
- **Ferramentas de desenvolvimento**: `npm audit` completo aponta vitest 2/esbuild/tailwind 3 (só dev, não vão para produção); a correção exige vitest 5 e Tailwind 4.
- **LGPD**: consentimento, anonimização e auditoria implementados; falta política de privacidade publicada, exportação de dados do titular e retenção automática.

Detalhes e mitigação: [`docs/arquitetura.md`](docs/arquitetura.md#12-riscos-e-mitigação).
