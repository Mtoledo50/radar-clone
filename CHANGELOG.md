# 📋 CHANGELOG — Radar Conta Certa

**Formato:** [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
**Última atualização:** 14/08/2026 (pós-Sprint 31 + Sprint A1)

## [Sprint A3] 2026-08 — Versões de Proposta
### ✅ Added
- Migração Prisma: colunas `version`, `isCurrent`, `originalProposalId` no modelo `Proposal`.
- Self-relation `ProposalVersions` para navegação entre versões da mesma cadeia.
- Endpoint `GET /proposals/client/:clientId/versions` (agrupa propostas por cadeia).
- Endpoint `POST /proposals/:id/new-version` (duplica proposta + incrementa version).
- DTOs `ProposalVersionDto` e `ProposalVersionsResponseDto`.
### 🧠 Decisions
- Agrupamento em memória (Map) por `originalProposalId` — simples e O(N).
- Nova versão sempre nasce como `status: DRAFT` e `isCurrent: true`.
- Versão anterior é automaticamente marcada como `isCurrent: false` (transação atômica).
- Itens da proposta (`ProposalItem`) são duplicados na nova versão.
### 🏁 Status
- **HOMOLOGADO** no ambiente Docker.

---
## [Sprint A2] 2026-08 — Valor de Referência + Dinheiro na Mesa
### ✅ Added
- Endpoint `POST /commercial-plans/insights` no `CommercialPlansController`.
- Método `getPlansWithInsights(companyId, baseValue, currentMonthly)` no `CommercialPlansService`.
- DTO `CalculatePricingInsightsDto` com validação (`@IsNumber`, `@IsOptional`).
- DTO `PlanWithInsightsDto` estendendo `ResolvedPlanDto` com `calculatedPrice`, `percentVsBase`, `moneyOnTable`.
- Integração das funções `planPriceFromReference`, `relativePercentVsBase`, `calcMoneyOnTable` do domínio puro.
### 🧪 Teste de Validação
- Base R$ 2000 + Plano BLACK (multiplier 1.4) = Preço Ideal R$ 2800
- Cliente pagando R$ 1200 → Perda Mensal R$ 1600 → Perda Anual R$ 19200
### 🏁 Status
- **HOMOLOGADO** no ambiente Docker (Postgres 5433, Backend 3001, Frontend 3000).

## [Sprint A1] 2026-08 — Motor de Herança de Planos (Domínio Puro)

### ✅ Added
- Camada de domínio puro para herança de planos comerciais (`backend/src/commercial-plans/domain/`).
- Função `resolvePlanInheritance(plans, items)`: calcula itens herdados em memória com multiplicador crescente.
- Função `calculatePricingInsights(resolvedPlans, baseValue)`: valor de referência, % vs base, dinheiro na mesa (mensal/anual).
- Flag `isIndependent`: planos marcados não herdam e não doam itens.
- Ordenação por `multiplier` (menor → maior) para derivar cadeia de herança.
- 6 testes unitários verdes (`backend/src/commercial-plans/domain/tests/plan-inheritance.spec.ts`).

### 🧠 Decisions
- **ADR-020:** Herança derivada em memória (banco guarda apenas itens próprios de cada plano).
- Preços com `round2` (sem erro de ponto flutuante).
- Domínio puro sem dependência de Prisma/HTTP (testável e reutilizável).

###  Arquivos Criados
- `backend/src/commercial-plans/domain/plan-inheritance.ts`
- `backend/src/commercial-plans/domain/pricing-insights.ts`
- `backend/src/commercial-plans/domain/tests/plan-inheritance.spec.ts`

---

## [Sprint 31] 2026-08 — Containerização (Docker Compose)

### ✅ Added
- `docker-compose.yml` na raiz: Postgres 5433, Backend 3001, Frontend 3000, volume `pgdata`.
- `backend/Dockerfile`: multi-stage com `node:20-slim` + OpenSSL (resolve incompatibilidade Prisma/Alpine).
- `backend/.dockerignore`: exclui `node_modules`, `.env`, `dist`.
- `frontend/Dockerfile`: multi-stage com `output: "standalone"` do Next.js.
- `frontend/.dockerignore`: exclui `node_modules`, `.next`, `.env.local`.
- `frontend/next.config.ts`: adicionado `output: "standalone"`.
- Comando de boot do backend: `npx prisma migrate deploy && node dist/main.js` (self-healing).

###  Fixed (Erros de Build de Produção)
- `revisao/page.tsx`: adicionadas funções `handleSelectDebit/Credit` e `handleClearDebit/Credit`.
- `revisao/page.tsx`: Lucide `title` → wrapper `<span title>` (ADR-021).
- Removido `layout copy.tsx` (backup quebrava o build; ADR-022).
- `layout.tsx`: `item.children?.map` com optional chaining (ADR-023).
- `planejamento/page.tsx`: Sonner `cancel` com `onClick={() => {}}` (ADR-024).
- `columnExport.ts`: interface `ColumnDef` adicionada propriedade `always?: boolean`.
- `parseInitialStock.ts`: interface `InitialStockItem` alinhada com modal (`description`, `averageCost`, `unit`, `ncm`, `totalCost`).
- `login/page.tsx`: envolvido em `<Suspense>` para satisfazer `useSearchParams()` no Next.js 16.

### 🧠 Decisions
- Postgres do Docker na porta **5433** (não conflita com Postgres local 5432).
- Backend aplica `prisma migrate deploy` no boot (self-healing).
- `NEXT_PUBLIC_API_URL` embutido no build (browser fala com `localhost:3001`).
- Troca de base Alpine para Debian-slim no backend (Prisma exige glibc + OpenSSL).

###  Arquivos Criados/Alterados
- `docker-compose.yml`
- `backend/Dockerfile`, `backend/.dockerignore`
- `frontend/Dockerfile`, `frontend/.dockerignore`
- `frontend/next.config.ts`
- `frontend/src/lib/columnExport.ts`
- `frontend/src/lib/parseInitialStock.ts`
- `frontend/src/components/fiscal/ColumnPickerModal.tsx`
- `frontend/src/components/fiscal/InitialStockImportModal.tsx`
- `frontend/src/app/login/page.tsx`

---

## [Sprints 26–30] 2026 — Hardening e UX

### ✅ Added
- Soft deletes em entidades críticas (preserva histórico contábil).
- Validações de DTO com `class-validator`.
- Índices compostos no Prisma (performance).
- Empty states em todas as telas.
- Confirmações Sonner em ações destrutivas.
- Paginação e otimizações de queries.
- Tendências de propostas (gráfico de evolução).

---

## [Sprints 22–25] 2026 — Módulos Operacionais (Vantagem Competitiva)

### ✅ Added
- **Fiscal:** NF-e de entrada, estoque Kardex, apuração ICMS, SPED Bloco H.
- **Bancário:** extrato CSV, classificação com memória, naturezas por cliente, fechamento com trava.
- **Operações:** projetos e tarefas (Kanban multi-tenant).
- **Contábil:** plano de contas SCI 90113, lançamentos, conciliação, exportação SCI.

---

## [Sprints 18–21] 2026 — Ciclo Comercial v1

### ✅ Added
- Carteira de Clientes (MRR/Churn/Ticket).
- Propostas (wizard 5 passos, link público, tracking).
- PDF/Excel de propostas.
- Regras de horas + calculadora de precificação.

---

## [Sprints 13–17] 2026 — BI e Administração

### ✅ Added
- DRE gerencial.
- Ponto fora da curva (anomalias estatísticas).
- Simulador tributário (Simples × Presumido × Real).
- Planos comerciais v1 (multiplicadores).
- Painel Admin (visão geral + catálogo).

---

## [Sprints 8–12] 2026 — Identidade e Módulos de Gestão

### ✅ Added
- Rebranding Conta Certa + Sonner (toasts).
- Precificação por horas + margem.
- Planejamento estratégico (OKRs, metas).
- Minha Empresa (perfil do escritório).
- CSV UTF-8+BOM (ADR-002).

---

## [Sprints 1–7] 2026 — Fundação

### ✅ Added
- Monorepo (backend/ + frontend/).
- Auth multi-tenant JWT+refresh.
- Frontend Next.js+Zustand.
- Dashboard executivo (gráficos CSS, ADR-001).
- Pessoas/Turnover.
- Clientes (CRUD + importação em massa).