# 📋 CHANGELOG — Radar Conta Certa

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.
**Formato:** [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
**Última atualização:** 18/08/2026 (pós-Sprints F4–F7 do Fiscal — Enriquecimento e Auditoria)
## [FD-4] 2026-08-18 — Guias de imposto com memória de cálculo (Aurora)

### ✅ Added
- Domínio puro `backend/src/tax/domain/`: `simples-nacional.ts` (Anexo III,
  alíquota efetiva por RBT12) e `iss.ts` (ISS próprio × retido); 5/5 testes verdes.
- Model `TaxGuide` + enums `TaxGuideType` (DAS/ISS/DARF) e `TaxGuideStatus`
  (DRAFT/APPROVED/TRANSMITTED/REJECTED); idempotência @@unique([companyId, clientId, period, type]).
- `TaxGuidesService`: lê NFS-e da FD-3a, calcula ISS+DAS e upserta guias com
  `memory` JSON (steps, sources, lawRef) — ADR-038.
- Endpoints: GET /digital-employee/tax-guides, POST .../calculate,
  PATCH .../:id (aprovação), GET .../:id/pdf.
- PDF imprimível da guia (jspdf+autotable, ADR-035): faixa teal, box valor+vencimento,
  resumo, memória passo a passo, referência legal e rodapé de compliance.
- Página `/dashboard/funcionario-digital/guias`: KPIs, filtros, tabela,
  modal de memória, Aprovar e Imprimir. Item de menu "Guias de Imposto".

### 🧠 Decisions
- ADR-038: memória de cálculo auditável — o contador vê a conta, não só o resultado.
- Regra de Ouro: Aurora calcula e prepara; humano aprova e transmite no portal oficial.
- ISS retido pelo tomador não gera guia, mas entra na memória p/ conferência.

### 📊 Resultados reais (produção controlada, 18/08/2026)
- ACGS 2026-07: ISS R$ 420,00 (3 próprias + 1 retida) + DAS R$ 660,00 (faixa 1, 6%).
- PDF validado no viewer + impressão + aprovação na UI.

### 🏁 Status
HOMOLOGADO em ambiente local.
## [FD-3a] 2026-08-18 — NFS-e: importação de notas de serviço (Aurora)

### ✅ Added
- Model `FiscalServiceInvoice` (NFS-e) + enums `NfseDirection` (EMITIDA/RECEBIDA) e
  `NfseStatus` (IMPORTED/REVIEW/ACCOUNTED/REJECTED); idempotência por
  @@unique([companyId, issuerCnpj, number, series]).
- Parser ABRASF 2.0 (`backend/src/fiscal/nfse/nfse.parser.ts`): puro, tolerante a
  variações municipais; 4/4 testes verdes (válido, sem tomador, malformado, sem número).
- `NfseImportSkill` (5ª skill): processa `uploads/nfse-inbox/` → upsert → move para
  `nfse-processed/` ou `nfse-failed/`; vínculo por clientId explícito ou CNPJ
  (emissor=EMITIDA / tomador=RECEBIDA); sem vínculo → REVIEW (fila 🟡).
- Endpoints: `POST /digital-employee/nfse/upload` e `GET /digital-employee/nfse`.
- Página `/dashboard/funcionario-digital/nfse`: KPIs, filtros, tabela com destaque 🟡,
  "Enviar XML", "Reprocessar caixa" e modal "XML original".
- Item de menu "NFS-e" na seção Inteligência; cron `0 9 * * *` (autonomia REVIEW).

### 🧠 Decisions
- ADR-036: parser ABRASF com adaptadores; não reconhecido → rawXml + REVIEW (nunca descarta).
- ADR-037: origem (`source`: MANUAL|EMAIL|PORTAL|OCR) é atributo, não arquitetura —
  coletores futuros (FD-3b/c) despejam na mesma inbox.
- `fast-xml-parser` para parsing XML no backend.
- Migrations locais via SQL manual + `migrate resolve` (radar_user sem CREATEDB).

### 📊 Resultados reais (produção controlada, 18/08/2026)
- 2 XMLs semeados: 1 IMPORTED (vínculo automático ACGS por CNPJ) + 1 REVIEW (órfão → 🟡).
- UI homologada: KPIs, filtros, tabela, modal XML e menu.

### 🏁 Status
HOMOLOGADO em ambiente local (Postgres 5432, dados reais).

## [FD-2 Final — MonthlyReportSkill] 2026-08-18 — Pacote mensal da Aurora 📊

### ✅ Added
- Model `MonthlyReport` + enum `ReportStatus` (GENERATING/READY/FAILED), unique por (companyId, clientId, period).
- `MonthlyReportSkill`: PDF mensal profissional por cliente ativo (jspdf 2.5 + autotable 3.8).
  - Pipeline: COLETAR (extratos do mês) → INTERPRETAR (receitas/despesas/saldo + por natureza + top 10) → EXECUTAR (PDF) → REGISTRAR (MonthlyReport + auditoria).
  - Modo manual via `params.clientId` (botão "Gerar agora").
  - Resiliência: cliente sem movimentação recebe PDF "sem movimentações"; erro não aborta o lote.
  - Cron `0 8 5 * *` (dia 5 às 08:00).
- Storage local: `backend/uploads/reports/{companyId}/{period}/{clientId}.pdf`.
- Endpoints: `GET /digital-employee/reports`, `GET .../reports/:id/download`, `POST .../reports/generate`.
- Página `/dashboard/funcionario-digital/relatorios`: tabela com 99 relatórios, filtros (período/status/busca), botões ⬇️ Baixar, ▶️ Gerar agora e "Gerar mês anterior".
- Item de menu "Relatórios Mensais" na seção Inteligência.

### 🧠 Decisions
- ADR-035 (proposto): PDFs no backend com jspdf+autotable (mesma stack do FE); storage local (S3 na FD-7).
- Pin de versões no backend: jspdf 2.5.2 + autotable 3.8.2 (v4/v5 são ESM-first e quebram `require` do NestJS); `autoTable` via `require(...).default`.
- Migration aplicada via SQL manual (`psql` superuser) + `GRANT` para `radar_user` (usuário do app sem permissão CREATEDB p/ shadow database).
- Frontend usa `api` (axios c/ interceptor JWT) — padrão do projeto (elimina 401 de token manual).

### 📊 Resultados reais (produção controlada, 18/08/2026)
- 99 PDFs gerados em lote (`itemsProcessed: 99`).
- Geração manual validada (`itemsProcessed: 1`, `secondsSaved: 3600`).
- Download validado via endpoint e via UI; caso "sem movimentações" validado.

### 🏁 Status
HOMOLOGADO em ambiente local (Postgres 5432, dados reais).

## [Entrega C] 2026-08-17 — Aurora em produção controlada com dados reais 🎉

### ✅ Added
- **Importação de 98 clientes reais** do CSV de honorários (planilha "Contratos - Hon. mensais.csv")
- **Seed de demonstração** com 18 transações bancárias distribuídas em 3 clientes
- **Memória de aprendizado** com 4 regras (CEEE, TARIFA, PIX RECEBIDO, ALUGUEL)
- **Execução real das 3 skills** em produção controlada:
  - `CLASSIFICATION`: 18 items processados, 18 auto-aprovados (100%), 540 segundos salvos
  - `RECONCILIATION`: executada (sem NF-e para cruzar - comportamento esperado)
  - `ACCOUNTING_BRIDGE`: executada (skipped - mês não fechado - trava de compliance funcionando)
- **Auditoria completa** registrada no `automation_audits`

### 🧠 Decisions
- Uso de `findFirst + create/update` em vez de `upsert` (contorno de constraint única)
- Seed de dados para validar pipeline sem depender de importação manual
- Trava de compliance funcionando: ACCOUNTING_BRIDGE só executa em meses fechados

### 🏁 Status
HOMOLOGADO em produção controlada: Aurora processou dados reais, decidiu com autonomia (régua 80/50), respeitou travas de compliance e registrou auditoria completa.
---
## [Sprint FD-2] 2026-08-17 — Aurora: Central de Aprovações + decisões auditadas 🟡

### ✅ Added
- **Central de Aprovações** `/dashboard/funcionario-digital/aprovacoes`:
  filtros (tipo + busca), dossiê por tipo (CLASSIFICATION/MATCH), modal de revisão
  com nota, aprovação/rejeição direta ou com nota, toasts Sonner.
- Link "Abrir central →" no card "Fila de revisão 🟡" do dashboard da Aurora.
- **Efeito colateral seguro**: CLASSIFICATION aprovada aplica a natureza sugerida
  na transação (tolerante se a transação não existir).
- **Auditoria da decisão humana**: `USER_APPROVED:<tipo>` / `USER_REJECTED:<tipo>`
  com a nota no `detail`.

### 🧠 Decisions
- Aprovar/rejeitar SEMPRE cria `ApprovalRecord` (trava de transmissão — Regra de Ouro).
- MATCH aprovada na Central apenas registra a decisão; a confirmação efetiva
  permanece na tela de Conciliação (motor de score da Sprint 29).

### 🏁 Status
HOMOLOGADO em banco local (5432): pendência de teste aprovada com nota →
toast de sucesso + fila zerada + auditoria `USER_APPROVED:CLASSIFICATION`.

## [Sprint FD-2 parcial] 2026-08-17 — Aurora: 3 skills + crons autônomos 🌅

### ✅ Added (Backend)
- **`ClassificationSkill`**: classifica transações `NAO_CLASSIFICADO` reaproveitando
  a memória de aprendizado da Sprint 22 (`BankingService.classify`). Régua:
  score ≥ 80% → auto-aprova; 50–79% → fila 🟡; < 50% → ignora. Adaptador isolado
  (`normalizeSuggestion`) protege contra variações de retorno do motor.
- **`AccountingBridgeSkill`**: promove o mês bancário anterior para a escrituração
  contábil via `AccountingService.promoteFromBanking`. Trata graciosamente meses
  sem fechamento (`skipped: true` sem quebrar o run). Idempotente.
- **Crons sincronizados com toggles** (`SchedulerService.onModuleInit` + `DigitalEmployeeService.updateSkill`):
  skill ligada = cron registrado; skill desligada = cron removido; boot registra
  todas as skills ligadas de todos os workers ACTIVE.
- **Exports dos módulos**: `BankingModule` passa a exportar `BankingService`;
  `AccountingModule` passa a exportar `AccountingService` (injeção nas skills).

### ✅ Added (Frontend)
- Toggle de skills no dashboard da Aurora agora tem **efeito real no cron**
  (antes só persistia no banco; agora acorda/dorme a Aurora em tempo real).

### 🏁 Status
HOMOLOGADO em banco local (5432): as 3 skills executam via botão "Rodar agora"
com status SUCCESS; tratamento gracioso de casos de borda (sem transações / sem
fechamento) validado; crons ativos em produção controlada.

---

## [Sprint FD-1] 2026-08-15 — Aurora: Fundação do Funcionário Digital 🌅

### ✅ Added (Backend)
- **Migração `fd1_foundation_robot_worker`**: 6 tabelas (`robot_workers`,
  `robot_worker_skills`, `automation_runs`, `automation_pendings`,
  `automation_audits`, `approval_records`) + 6 enums (`SkillKey`,
  `AutonomyLevel`, `RunStatus`, `TriggerType`, `PendingStatus`, `ApprovalDecision`).
- **Módulo `digital-employee`** completo:
  - `DigitalEmployeeService` (lazy create + KPIs agregados + CRUD)
  - `DigitalEmployeeController` (8 endpoints JWT)
  - `AutomationAuditService` (Pilar D — trilha de compliance 100%)
  - `JobRunnerService` (executor com métricas e status tracking)
  - `SchedulerService` (esqueleto cron — desligado por segurança na FD-1)
  - `BaseSkill` (classe abstrata — Pilar B, pipeline universal)
  - `ReconciliationSkill` (reusa `BankingReconcileService` da Sprint 29)
- **Endpoint `POST /digital-employee/skills/:skillKey/run`** — botão "Rodar agora"
  (disparo manual fora do cron).
- **Integração com BankingModule**: `BankingReconcileService` exportado.
- **CORS multi-origem** no `main.ts`: aceita `localhost:3000`, `localhost:3002`
  e variantes IP (comma-separated via env `FRONTEND_URL`).

### ✅ Added (Frontend)
- **Dashboard `/dashboard/funcionario-digital`**: header com avatar 🌅 + status
  ACTIVE/PAUSED + botão pausa; 4 KPI cards (runs hoje, auto-aprovados,
  pendências 🟡, tempo economizado); timeline de runs; fila de revisão humana;
  painel de skills com toggle on/off + botão ▶; trilha de auditoria.
- **Hook Zustand `useDigitalEmployee`**: gerencia estado + chamadas API +
  optimistic updates + refresh automático a cada 30s.
- **6 componentes isolados**: `EmployeeHeader`, `KpiCards`, `RunsTimeline`,
  `PendingQueue`, `SkillsPanel`, `AuditTrail`.
- **Item no menu lateral** (`layout.tsx`): 🤖 Funcionário Digital na seção
  INTELIGÊNCIA (topo da seção).
- **Axios instance `@/lib/axios`**: interceptor injeta JWT automaticamente +
  trata 401 globalmente (redireciona para `/login`).

### 🧠 Decisions (ADRs)
- **ADR-030** Regra de Ouro: ações `riskLevel=LEGAL` nunca são AUTO (aprovação
  humana sempre, independente do score).
- **ADR-031** Cálculo tributário determinístico no backend; IA apenas
  sugere/classifica.
- **ADR-032** LGPD: cofres de credenciais AES-256-GCM (implementação em FD-8).
- **ADR-033** Perfis de aprovação por tipo de tarefa
  (Auxiliar/Analista/Supervisor/Contador).
- **ADR-034** Arquivos estruturais (`app.module.ts`, `schema.prisma`): entregar
  sempre o **delta**, nunca substituição total.

### 🏁 Status
HOMOLOGADO em banco local (5432): login JWT ✅ • lazy create da Aurora ✅ •
run MANUAL com métricas (3ms) ✅ • auditoria `SKILL_FINISHED:RECONCILIATION` ✅ •
dashboard renderizando dados reais ✅ • menu lateral integrado ✅.

---

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

---

## [Sprints F6–F7 — Auditoria Tributária e Impressão Fiscal] 2026-08-18

### ✅ Added
- **F6**: componente `TaxAuditTable` — auditoria tributária por item no modal
  de detalhe da NF-e: tabela Base × Alíquota = Valor para ICMS, IPI, PIS e
  COFINS, com selo **✓ OK** / **⚠ diverge** e explicação automática do
  valor esperado quando há divergência (cross-check determinístico).
- **F6.1**: selo destacado **"Qtd: N UN"** por item + resumo
  "X itens • Y unidades" no cabeçalho do modal. Unidade de medida vem do
  produto catalogado (`item.product.unit`) com fallback seguro para `UN`.
- **F7**: botão 🖨️ **Imprimir** no modal de detalhe da NF-e:
  - Impressão direta ou "Salvar como PDF" via diálogo nativo do navegador.
  - Layout A4 otimizado: imprime **somente o modal** (dashboard/sidebar
    ficam de fora).
  - Chave de acesso (44 dígitos) em destaque no rodapé fiscal (exigência legal).
  - Cada item com `break-inside: avoid` — nunca cortado entre páginas.
  - Botões de ação (Imprimir/Fechar) somem no papel via classe `print-hidden`.
- **F7 (arquitetura)**: modal renderizado via `createPortal(document.body)` —
  vira irmão do root do Next, permitindo que o CSS `@media print` esconda
  tudo exceto o backdrop do modal.

### 🔧 Changed
- `notas/page.tsx`: tipos `InvoiceItem` e `InvoiceDetail` ganham
  `ipiBase`, `ipiRate`, `pisBase`, `pisRate`, `cofinsBase`, `cofinsRate`
  (necessários para a auditoria); `product` ganha `unit?: string`.
- `notas/page.tsx`: modal migra para `createPortal` + `<style>` injetado
  com CSS de impressão (ADR-026 revisado — sem `globals.css`).

### 🧠 Decisions
- **ADR-026**: impressão fiscal sem `globals.css`/jsPDF. Modal via
  `createPortal(document.body)` + `<style>` com `@media print` injetado;
  CSS esconde todos os filhos diretos do `body` exceto o backdrop do modal.
  PDF gerado pelo diálogo nativo do navegador (Ctrl+P → "Salvar como PDF").
- Auditoria determinística no frontend (Base × Alíquota = Valor):
  tolerância de R$ 0,01 para arredondamentos fiscais. Sem IA, sem heurística.
- CSOSN 102/103 (Simples Nacional): base ICMS por item R$ 0,00 no XML
  (comportamento fiscal correto — grupo `ICMSSN102` não possui tag `vBC`).
  Tabela de auditoria mostra "—" nesses casos.

### 📁 Arquivos
- `frontend/src/components/fiscal/TaxAuditTable.tsx` (novo — F6)
- `frontend/src/app/dashboard/fiscal/notas/page.tsx` (F6.1 + F7)

### 🏁 Status
HOMOLOGADO em ambiente local (Postgres 5432, dados reais). Zero migrações.

---

## [Sprints F4–F5 — Enriquecimento Fiscal] 2026-08

### ✅ Added
- **F4**: card "Base ICMS" no modal de detalhe da nota (total da nota) e linha
  "Base ICMS" por item — exibindo dados que o parser já extraía (`vBC` por
  item e no `ICMSTot`) e o schema já persistia. Zero migrações.
- **F5**: coluna "Produtos" na listagem de notas (1º produto em A–Z + badge
  "+N produto(s)" com tooltip listando todos).
- **F5**: seletor "Ordenar por: Mais recentes | Produto (A–Z)" — ordenação
  server-side compatível com paginação.
- **F5**: busca da listagem agora encontra notas pelo NOME DO PRODUTO
  (ex.: digitar "TRIANGLE" acha a nota #8338).

### 🔧 Changed
- `invoice.service.ts` → `findAll`: retorna descrições dos itens ordenadas
  A–Z; novo filtro `sortBy`; busca inclui `items.description`.
- `invoice.controller.ts` → whitelist segura de `sortBy`.
- `notas/page.tsx` → coluna nova + seletor + tipos atualizados.

### 🧠 Decisions
-- - **ADR-025**: ordenação "Produto (A–Z)" na camada de aplicação...
+ - ### Decisions
- Ordenação por produto via agregação Prisma
  (`orderBy: { items: { _min: { description: 'asc' } } }`) — notas sem
  itens vêm por último (NULLS LAST).
+ - **ADR-028** (ex-"ADR-025" da conversa): ordenação A–Z na aplicação
+   (renumerado: ADR-025 original = RBAC @Roles(), confirmado pelo commit aff3652).
+   (renumerado: ADR-025 original = RBAC @Roles(), conforme READMEv1)
  + `localeCompare('pt-BR')` + paginação sobre ranking. Sem agregação de
  relação do Prisma (`orderBy: items._min` retornava 500 no ambiente local).
  Notas sem itens vão para o final da lista.
- CSOSN 102/103 (Simples) não trazem `<vBC>` por item no XML: base
  exibida como R$ 0,00 nesses casos (comportamento fiscal correto).

---

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

### 📁 Arquivos Criados
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

### 🔧 Fixed (Erros de Build de Produção)
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

### 📁 Arquivos Criados/Alterados
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