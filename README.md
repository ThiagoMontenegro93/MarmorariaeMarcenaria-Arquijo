# Arquijo Marmoraria e Marcenaria — Sistema (MVP Fase 1)

Sistema de móveis planejados ponta a ponta — do primeiro contato até o recebimento do valor — para a **Arquijo Marmoraria e Marcenaria** (R. Mupia, Rio de Janeiro - RJ, 21220-320 · +55 21 98450-3570 · Seg–Dom 08:00–20:00).

- **Motor de cálculo de chapas** (guilhotina 2D, serra, veio, sobras, estoque vs compra) e prévia de custo do orçamento
- **API** NestJS + Prisma + PostgreSQL: OS com 9 etapas, prioridade, prazo e atraso; financeiro; catálogo; B2B; dashboard; WhatsApp; auditoria
- **Site** Next.js 14 + Tailwind: home, coleções, página para empresas com formulário, contato com Google Maps e área interna (esqueleto)

Documento de arquitetura completo (requisitos, segurança, LGPD, deploy, riscos, critérios de aceite): [`docs/arquitetura.md`](docs/arquitetura.md).

## Arquitetura

```mermaid
flowchart LR
  U[Cliente / equipe] --> W[apps/web<br/>Next.js 14 + Tailwind]
  W -- REST/JSON --> A[apps/api<br/>NestJS]
  A --> C[packages/calc<br/>motor puro de chapas]
  A -- Prisma --> P[(PostgreSQL 16)]
  A -- link wa.me / Business API (Fase 2) --> Z[WhatsApp]
  W -- links --> G[Google Maps]
```

```
arquijo/
├─ packages/calc/   motor de cálculo (TypeScript puro, sem dependências) + testes Vitest
├─ apps/api/        NestJS + Prisma (schema, migrações, seed) + testes das regras de negócio
├─ apps/web/        Next.js 14 (App Router) + Tailwind
├─ docs/            arquitetura.md (documento NEXUS)
├─ docker-compose.yml · .env.example
```

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

Login: `POST /auth/login` com `admin@arquijo.com.br` e a senha do seed → use o `accessToken` como `Bearer` (botão *Authorize* no Swagger).

## Testes e verificação

```bash
npm test                                      # motor de cálculo + regras de negócio da API (Vitest)
npm run test -w @arquijo/calc                 # só o motor (inclui exemplo do PDF e 50 peças < 2s)
npm run typecheck -w @arquijo/api             # TypeScript estrito da API
cd apps/api && npx prisma validate && npx prisma generate
npm run build                                 # calc + api (nest build) + web (next build)
```

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
| `SEED_DEMO` | seed | `true` cria cliente/projeto de demonstração com a cut list do PDF |
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

## Roadmap

**Fase 1 — MVP (este repositório):** motor de chapas e custo; API completa (auth/RBAC, chapas, projetos + cálculo, OS com etapas/atraso/Gantt, pagamentos, catálogo, B2B, dashboard, WhatsApp link, auditoria); banco com migrações e seed; site público e esqueleto da área interna.
Pendências para fechar a fase: login e telas internas (Kanban, plano de corte em SVG, dashboard), atualização de dependências (ver Riscos).

**Fase 2 — conforme "Próximos passos" do prompt mestre:**
- Unir os artefatos num site único (domínio próprio) e adicionar fotos reais das obras da R. Mupia (upload S3)
- Cálculo de chapas integrado à OS também na interface (na API já é automático ao criar OS a partir de projeto)
- Divulgar `/empresas` para imobiliárias; proposta comercial B2B em PDF
- Conectar a WhatsApp Business API para envio automático das atualizações de OS
- PDFs/CSV (orçamento, OS, lista de compra, financeiro), PWA offline do marceneiro, mapa Google embarcado

**Fase 3 — escala:** otimizador de corte com múltiplas heurísticas e reaproveitamento de retalhos, portal B2B com login, teste de carga para 100+ projetos simultâneos, avaliações Google no dashboard.

## Riscos

- **Dependências com vulnerabilidades conhecidas**: `npm audit --omit=dev` aponta 13 avisos (1 crítico em `next` 14, vários em `@nestjs/*` 10). As correções exigem versões maiores (Next 15+/16, Nest 11+). O PDF pede Next 14; **atualizar antes de produção**.
- **Heurística de corte**: guilhotina com *best short side fit* é rápida e correta, mas não garante o mínimo absoluto de chapas.
- **WhatsApp Business API** depende de aprovação da Meta e templates; o MVP funciona só com links `wa.me`.
- **Área interna web** ainda é esqueleto: a operação completa hoje é via API/Swagger.
- **LGPD**: consentimento, anonimização e auditoria implementados; falta política de privacidade publicada, exportação de dados do titular e retenção automática.

Detalhes e mitigação: [`docs/arquitetura.md`](docs/arquitetura.md#12-riscos-e-mitigação).
