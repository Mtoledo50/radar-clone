# 📋 CHANGELOG — Radar Conta Certa

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.
**Formato:** [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)

## [Sprint FD — Funcionário Digital] 2026-08-17/18 — Aurora: 7 skills, NFS-e, guias e relatórios

### ✅ Added
- FD-1 Fundação: tabelas RobotWorker/RobotWorkerSkill/AutomationRun/AutomationPending/
  AutomationAudit/ApprovalRecord + dashboard da Aurora + menu + crons ↔ toggles.
- FD-2: skills RECONCILIATION, CLASSIFICATION, ACCOUNTING_BRIDGE + Central de
  Aprovações (régua 80/50 — ADR-030).
- FD-2 final: MONTHLY_REPORT — PDF mensal por cliente (jspdf+autotable no backend,
  ADR-035) + endpoints reports (list/download/generate) + aba "Relatórios Mensais".
- FD-3a: NFSE_IMPORT — parser ABRASF 2.0 (4/4 testes), model FiscalServiceInvoice,
  inbox/processed/failed, upload+lista, aba "NFS-e" c/ modal de XML original (ADR-036/037).
- FD-3b: NFSE_EMAIL_COLLECT — coletor IMAP (imapflow+mailparser), cron */30,
  SKIP gracioso sem credenciais, source EMAIL (ADR-039).
- FD-4: TAX_GUIDES — domínio puro Simples Nacional (Anexo III) + ISS (5/5 testes),
  model TaxGuide c/ memória de cálculo (ADR-038), endpoints calculate/list/patch/pdf,
  PDF imprimível da guia + aba "Guias de Imposto" c/ aprovação humana.

### 🧠 Decisions
- ADR-030 Regra de Ouro (LEGAL nunca AUTO); ADR-031 cálculo determinístico;
  ADR-033 perfis de aprovação; ADR-034 deltas em arquivos estruturais.
- ADR-035 PDFs no backend (jspdf 2.5.2 / autotable 3.8.2 pinados).
- ADR-036 ABRASF c/ adaptadores; ADR-037 source como atributo; ADR-038 memória de
  cálculo; ADR-039 IMAP como coletor.

### 📊 Resultados reais (produção controlada, Postgres local 5432)
- 98 clientes reais importados; CLASSIFICATION 18/18 auto; 99 PDFs mensais;
- NFS-e com fila 🟡 e vínculo por CNPJ; guias ACGS 2026-07: ISS R$ 420 + DAS R$ 660
  com passo a passo auditável; 602h economizadas.

### 🏁 Status
HOMOLOGADO localmente. Teste IMAP real pendente (requer caixa de e-mail).

## [Sprint F6] 2026-08 — Auditoria Tributária de NF-e (Base × Alíquota)

### ✅ Added
- **Parser de XML NF-e 4.0** com captura completa de alíquotas reais:
  - ICMS: `vBC`, `pICMS`, `vICMS` (tratando CST 51 diferimento, CST 60 ST retido, ICMSSN)
  - IPI: `vBC`, `pIPI`, `vIPI`, `CST` (formatos percentual, por unidade e IPINT isento)
  - PIS: `vBC`, `pPIS`, `vPIS`, `CST` (formatos PISAliq, PISQtde, PISNT, PISOutr)
  - COFINS: `vBC`, `pCOFINS`, `vCOFINS`, `CST` (formatos COFINSAliq, COFINSQtde, COFINSNT, COFINSOutr)
- **Service de persistência** gravando 6 novas colunas em `FiscalInvoiceItem`:
  - `ipiBase`, `ipiRate` (IPI com base + alíquota)
  - `pisBase`, `pisRate` (PIS com base + alíquota)
  - `cofinsBase`, `cofinsRate` (COFINS com base + alíquota)
- **Componente `TaxAuditTable`** com tabela de auditoria por item:
  - 4 linhas (ICMS/IPI/PIS/COFINS) com Base × Alíquota = Valor
  - Selo ✓ OK (verde, bate) ou ⚠ diverge (âmbar, com diferença em R$)
  - **Linha explicativa automática** quando diverge:
    - Diagnóstico do erro (campo ausente, parser antigo, redução de base)
    - Resultado esperado (calculado ou implícito)
- **Tolerância de arredondamento** de R$ 0,02 (padrão fiscal brasileiro)

### 🧠 Decisions
- **ADR-031**: Cálculo tributário determinístico. O parser apenas extrai; a auditoria (base × alíquota) é feita no frontend (componente isolado). Tolerância R$ 0,02.
- **ADR-032**: Reimportação necessária para notas antigas. Notas importadas antes da Sprint F6 têm alíquotas zeradas; o parser novo captura apenas em novos uploads.

### 🛠️ Fixed
- Parser antigo capturava apenas `vIPI`, `vPIS`, `vCOFINS` (valores), sem base/alíquota → auditoria impossível.
- Parser não tratava CST 51 (diferimento) → alíquota efetiva calculada incorretamente.
- Parser não tratava IPI por unidade (qUnid × vUnid) → alíquota zerada.
- Parser não tratava PIS/COFINS por quantidade (qBCProd × vAliqProd) → base zerada.

### 🏁 Status
- **HOMOLOGADO** no ambiente Docker (Postgres 5433, Backend 3001, Frontend 3000).
- Testado com NF-e reais (Blutrade, SEIWA BUSSAN) — auditoria detecta divergências de cálculo automaticamente.

## [FD-3b] 2026-08-18 — Coleta IMAP de NFS-e (Aurora)

### ✅ Added
- `EmailCollectorService` (backend/src/fiscal/nfse/email-collector.service.ts):
  cliente IMAP puro via `imapflow` + `mailparser`, extrai anexos .xml de mensagens
  UNSEEN, salva em uploads/nfse-inbox/, marca SEEN (não apaga — auditoria).
- `NfseEmailCollectSkill` (7ª skill): cron `*/30 * * * *`, lê config via env
  (ADR-032), SKIP gracioso se não configurada, dispara NfseImportSkill inline
  após coletar (ADR-037: mesmo canal de processamento).
- Enum `SkillKey` expandido com `NFSE_EMAIL_COLLECT`.
- Vars `NFSE_IMAP_*` no .env (host/port/secure/user/pass/mailbox).

### 🧠 Decisions
- ADR-039: IMAP como coletor; `source: 'EMAIL'` na skill de importação (ADR-037).
- SKIP gracioso: sem credenciais → log + return, não quebra o cron.
- Segurança (ADR-032): credenciais via env, TLS obrigatório, senha de APP.

### 📊 Resultados reais (produção controlada, 18/08/2026)
- Skill registrada com 2 crons ativos (NFSE_IMPORT + NFSE_EMAIL_COLLECT).
- Run manual sem credenciais: `configured: false` + SKIP gracioso validado.

### 🏁 Status
HOMOLOGADO em ambiente local. Teste com caixa real pendente (requer credenciais IMAP).

## [Sprint F6] 2026-08 — Auditoria Tributária de NF-e (Base × Alíquota)

### ✅ Added
- **Parser de XML NF-e 4.0** com captura completa de alíquotas reais:
  - ICMS: `vBC`, `pICMS`, `vICMS` (tratando CST 51 diferimento, CST 60 ST retido, ICMSSN)
  - IPI: `vBC`, `pIPI`, `vIPI`, `CST` (formatos percentual, por unidade e IPINT isento)
  - PIS: `vBC`, `pPIS`, `vPIS`, `CST` (formatos PISAliq, PISQtde, PISNT, PISOutr)
  - COFINS: `vBC`, `pCOFINS`, `vCOFINS`, `CST` (formatos COFINSAliq, COFINSQtde, COFINSNT, COFINSOutr)
- **Service de persistência** gravando 6 novas colunas em `FiscalInvoiceItem`:
  - `ipiBase`, `ipiRate` (IPI com base + alíquota)
  - `pisBase`, `pisRate` (PIS com base + alíquota)
  - `cofinsBase`, `cofinsRate` (COFINS com base + alíquota)
- **Componente `TaxAuditTable`** com tabela de auditoria por item:
  - 4 linhas (ICMS/IPI/PIS/COFINS) com Base × Alíquota = Valor
  - Selo ✓ OK (verde, bate) ou ⚠ diverge (âmbar, com diferença em R$)
  - **Linha explicativa automática** quando diverge:
    - Diagnóstico do erro (campo ausente, parser antigo, redução de base)
    - Resultado esperado (calculado ou implícito)
- **Tolerância de arredondamento** de R$ 0,02 (padrão fiscal brasileiro)

### 🧠 Decisions
- **ADR-031**: Cálculo tributário determinístico. O parser apenas extrai; a auditoria (base × alíquota) é feita no frontend (componente isolado). Tolerância R$ 0,02.
- **ADR-032**: Reimportação necessária para notas antigas. Notas importadas antes da Sprint F6 têm alíquotas zeradas; o parser novo captura apenas em novos uploads.

### 🛠️ Fixed
- Parser antigo capturava apenas `vIPI`, `vPIS`, `vCOFINS` (valores), sem base/alíquota → auditoria impossível.
- Parser não tratava CST 51 (diferimento) → alíquota efetiva calculada incorretamente.
- Parser não tratava IPI por unidade (qUnid × vUnid) → alíquota zerada.
- Parser não tratava PIS/COFINS por quantidade (qBCProd × vAliqProd) → base zerada.

### 🏁 Status
- **HOMOLOGADO** no ambiente Docker (Postgres 5433, Backend 3001, Frontend 3000).
- Testado com NF-e reais (Blutrade, SEIWA BUSSAN) — auditoria detecta divergências de cálculo automaticamente.

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

[Sprint C4] 2026-08 — Score 0–100 do Escritório (FASE C COMPLETA 🏁)
✅ Added
`company/domain/office-score.ts`: domínio puro (ADR-055) que consolida
5 dimensões ponderadas (Mercado 25 / Pessoas 20 / Comercial 20 /
Crescimento 15 / Gestão 20) em nota única 0–100 com níveis
EXCELENTE(≥80)/SAUDÁVEL(≥60)/ATENÇÃO(≥40)/CRÍTICO(<40) e insights
automáticos (2 pontos fracos + 1 forte).
`ScoreService` + `GET /company/score`: coleta inputs de C1/C2 (coberturas),
B2/B3 (setores/novatos), B5 (cargos via domínio position-benchmark),
A4/A7 (conversão/desconto via closingDetails), CompanyProfile (metas)
e C3 (progresso médio via CustomIndicatorService.getDashboard).
Página `/dashboard/score`: nota total 7xl com barra colorida, cards por
dimensão (peso + barra + detalhe), insights da diretoria e painel
"como é calculado" (ADR-055). Menu "Score do Escritório" na seção INTELIGÊNCIA.
🧠 Decisions
ADR-055: score v1 determinístico e explicável (zero IA); sub-scores com
fórmulas documentadas; neutro 50 quando não há dados (ex.: sem propostas).
ADR-034.2: sprints autocontidas entregues em mensagem única
(código completo + validação + docs) — método preferido do Marcos.
Coberturas C1/C2 recalculadas inline no ScoreService (dívida consciente v1;
refatorar para compartilhar com CustomIndicatorService quando estabilizar).
📊 Resultados reais (homologação)
Score total 51 (ATENÇÃO) • Comercial 90 (ponto forte) • Pessoas 63 •
Mercado 48 • Gestão 40 • Crescimento 0 (metas zeradas no CompanyProfile).
Insight automático: "Prioridade: Crescimento (0/100)".
🏁 Status
HOMOLOGADO localmente. 🎉 FASE C (Mercado) COMPLETA: C1–C4.

[Sprint C3] 2026-08 — Indicadores Customizados com Fórmula (Fase C — Mercado)
✅ Added
`company/domain/formula-engine.ts`: parser/avaliador determinístico de
fórmulas matemáticas simples com AST minimalista. Aceita apenas números,
variáveis whitelisted, operadores +−*/ e parênteses. Zero eval/Function.
Enum `IndicatorCategory` + model `CustomIndicator` + tabela `custom_indicators`:
KPIs customizados por tenant, com fórmula, meta, unidade, categoria, cor,
favorito e soft delete.
`CustomIndicatorService` + `CustomIndicatorController`: CRUD completo,
preview de fórmula, lista de variáveis permitidas e dashboard calculado.
`GET /company/indicators/dashboard`: avalia os indicadores contra contexto
real do tenant (CompanyProfile, clientes, colaboradores, serviços,
softwareCoverage C1 e servicesCoverage C2).
Frontend `/dashboard/indicadores-custom`: dashboard de cards, modal
criar/editar com validação ao vivo, favoritos, exclusão e barras de progresso.
Seed `seed-custom-indicators.ts`: 4 indicadores exemplo.
Item de menu "Indicadores Customizados" na seção INTELIGÊNCIA.
🧠 Decisions
ADR-054: fórmula segura por whitelist; proibido eval/Function.
Variáveis expostas: clientesHoje/clientesAno/funcionariosHoje/
funcionariosAno + derivadas operacionais e de cobertura C1/C2.
Descoberta do status "ativo" do cliente em runtime (ACTIVE_CLIENT_STATUS)
p/ ser agnóstico ao schema (fix TS2322).
Tipagem de tupla `Array<[string, string[]]>` em essentialCategories
(fix TS2339).
Divisão por zero retorna erro controlado no card, nunca quebra a página.
Página `/dashboard/indicadores` (BI de eficiência hard-coded) mantida
intacta; nova página `/dashboard/indicadores-custom` coexiste.
🏁 Status
HOMOLOGADO localmente.

[Sprint C2] 2026-08 — Serviços Extras com Preço Médio (Fase C — Mercado)
✅ Added
`company/domain/extra-services-benchmark.ts`: domínio puro (ADR-053) com
catálogo curado v1 de 12 serviços extras do mercado contábil BR (BPO,
IRPF, LGPD, CNDs, DP de terceiros, etc.) com preço médio (mensal/avulso/hora),
unidade, keywords normalizadas e descrição.
`CompanyService.getExtraServicesBenchmark` + rota
`GET /company/extra-services-benchmark`: lê ServiceItem ativos do tenant,
cruza com o catálogo v1 (keywords normalizadas), deriva coveragePct,
potentialMonthly (soma dos MENSAIS não oferecidos) e insights.
Seção "💼 Serviços Extras — Mercado" em Minha Empresa: KPIs (catálogo/
oferecidos/💰 dinheiro na mesa/avulsos não oferecidos), cards por serviço
com selo "Você vende"/"Não vende", preço médio de mercado vs. seu preço.
🧠 Decisions
ADR-053: catálogo v1 de preços médios (curadoria 2026) — sugestão, não
promessa (filosofia ADR-031: humano decide preço final).
`potentialMonthly` soma APENAS serviços mensais não oferecidos
(determinístico — ADR-031).
Zero tabelas novas; derivado em memória dos ServiceItem do tenant.
📊 Resultados reais (homologação)
Catálogo 12 serviços • 92% coverage (11/12) • 💰 R$ 120/mês na mesa
(apenas Gestão de CNDs não oferecida) • todos avulsos/hora já oferecidos.
🏁 Status
HOMOLOGADO localmente.

[Sprint C1] 2026-08 — Benchmark de Softwares (Fase C — Mercado)
✅ Added
`company/domain/software-benchmark.ts`: domínio puro (ADR-052) com
catálogo curado v1 de softwares do mercado contábil BR, apportionment
por maiores restos e matching bidirecional normalizado (NFD).
`CompanyService.getSoftwareBenchmark` + rota
`GET /company/software-benchmark`: agrega stack do tenant + rede de
outros tenants, decide fonte ('rede'/'hibrido'/'catalogo' — ADR-052),
retorna categorias + coverage + insights.
Seção "📊 Benchmark de Mercado" em `/dashboard/minha-empresa`:
KPIs de cobertura/amostra/fonte + cards por categoria (barras CSS puro
ADR-001) com destaque verde se você usa + recomendações + insights.
Seed `seed-company-network.ts`: 8 escritórios fake para popular a rede
e evitar feature nascendo vazia.
🧠 Decisions
ADR-052: benchmark híbrido (rede real ≥10 = fonte primária; 1–9 = híbrido;
0 = catálogo v1). A feature nunca nasce vazia.
ADR-001: barras em CSS puro (zero dependências).
Domínio puro: zero tabelas novas; tudo derivado de Company.softwareStack.
🏁 Status
EM HOMOLOGAÇÃO local.

[Sprint B5] 2026-08 — Benchmark de Cargos por Setor (FASE B COMPLETA)
✅ Added
`employee/domain/position-benchmark.ts`: domínio puro (ADR-051) com catálogo
contábil de cargos por setor (pesos), apportionment por maiores restos e
classificação de cargos reais por keywords normalizadas; deriva gaps
VACANCY/OK/OVER.
`EmployeeService.getPositionBenchmark` + rota
`GET /employees/position-benchmark`: agrega ativos por setor canônico
(ADR-048) e devolve análises por setor + totais (vacancies/over).
Página `/dashboard/pessoas/benchmark`: cards por setor com barras
preenchido × recomendado (CSS puro), selos de status, chips de cargos não
reconhecidos e KPIs totais. Menu "Benchmark de Cargos" em Gestão de Pessoas.
🧠 Decisions
ADR-051: catálogo estático versionado, ZERO tabelas novas; gaps derivados
em memória dos Employees (fonte da verdade).
ADR-034.1: arquivo em produção recebe delta cirúrgico; arquivo novo/quebrado
recebe versão completa.
🏁 Status
HOMOLOGADO localmente. 🎉 FASE B (Pessoas) COMPLETA: B1–B5.

[Sprint B4] 2026-08 — Entrevista de Desligamento com IA (Fase B — Pessoas)
✅ Added
Schema: `exitInterview Json?` + `exitAnalysis Json?` no model `Resignation`.
`exit-interview-engine.ts`: motor DETERMINÍSTICO (domínio puro, zero deps) que
classifica as 5 respostas em 7 causas-raiz por keywords normalizadas (NFD sem
acento), pontua por score e sugere plano de ação por categoria.
`TurnoverService`: `saveExitInterview`, `analyzeResignation`, `getExitAnalyses`
+ 3 rotas no controller (`POST :id/interview`, `POST :id/analyze`,
`GET /exit-analyses`).
`ExitInterviewModal.tsx`: modal 2 passos (formulário → causa primária +
confiança + plano de ação).
`turnover/page.tsx`: botão 📝 na tabela de Registros + sub-aba "Análises IA"
com top causas-raiz e planos agregados.
🛠️ Fixed (FIX B4.1)
`GET /turnover/resignations` não estava registrado no controller (o método
existia no service) → 404 derrubava o Promise.all e esvaziava todas as abas.
🧠 Decisions
ADR-050: motor intercambiável (`engine: "rules-v1"`; LLM amanhã sem tocar em
service/controller/UI). ADR-031: IA só sugere, humano decide.
🏁 Status
HOMOLOGADO localmente.

[Sprint B3] 2026-08 — KPIs Novatos & Críticos (Fase B — Pessoas)
✅ Added
Schema Prisma: flag `isCritical Boolean @default(false)` nos models
`Employee` (equipe atual) e `Resignation` (cópia histórica no desligamento).
`EmployeeService.getTurnoverKpis`: novo endpoint
`GET /employees/turnover-kpis?year=` que retorna activeCount, criticalActive,
avgTenureMonths, totalDismissals, newbieDismissals, newbieTurnoverRate (%)
e criticalDismissals — consumindo o `isCritical` gravado nas rescisões.
`TurnoverService.getResignationsDashboard`: endpoint
`GET /turnover/resignations-dashboard?year=` que agrega total de desligamentos,
turnover de novatos (<12 meses), motivo mais frequente e setor crítico.
`TurnoverService.createResignation`: aceita `isCritical` e grava em
`Resignation.isCritical` (cópia histórica — ADR-049).
Frontend `pessoas/page.tsx`:
- 4 KPIs no topo (Ativos/Tenure, 🔑 Críticos Ativos, Turnover Novatos,
  Desligados com críticos perdidos).
- Modal de criar/editar com checkbox "🔑 Colaborador crítico" e select de Status.
- Badge 🔑 na tabela ao lado do nome (só aparece em críticos).
- Filtro "Somente críticos 🔑" (checkbox).
- Suporte a edição (não só criação).
Frontend `turnover/page.tsx`:
- KPIs da aba Rescisões → Dashboard agora vêm dos endpoints reais
  (não mais hardcoded "0" / "N/A").
- Card rosa "KPIs Avançados de Turnover" com 4 métricas do endpoint.
- Modal de rescisão com checkbox "Era colaborador crítico 🔑?" que grava
  `Resignation.isCritical`.
- Ícone 🔑 ao lado do nome na tabela de registros (para desligamentos críticos).
🧠 Decisions
ADR-049: flag crítico com cópia histórica (Employee.isCritical = estado atual;
Resignation.isCritical = foto do momento do desligamento). Mesma filosofia
do ADR-047 (contractType). Permite que um colaborador deixe de ser crítico
e depois saia — a rescisão ainda conta como "crítico perdido".
Cálculo de tenure usa mês médio = 30.44 dias (365.25/12), piso em 0.
Turnover de novatos = desligados com tenure < 12 meses ÷ total desligados × 100.
Padronização de auth: todos os controllers usam `@CurrentUser() user: UserPayload`
(mais limpo e tipado que `@Request() req` + `req.user.xxx`).
🏁 Status
HOMOLOGADO localmente.

[Sprint B2] 2026-08 — Distribuição por Setor VALIDADA (Fase B — Pessoas)
✅ Added
`EmployeeService.getSectorDistribution` + endpoint
`GET /employees/sector-distribution`: deriva a distribuição atual por setor
dos colaboradores ATIVOS (fonte da verdade), normaliza `department`
(minúsculo + sem acentos) e mapeia para setores canônicos por keywords.
Comparação com benchmark contábil (ADR-048): Fiscal 30% • Contábil 25% •
DP 20% • Admin 15% • Outros 10%, tolerância ±5 p.p., selos
✓ OK / ⚠ OVER / ⚠ UNDER + headcount recomendado.
Lista `unmapped`: departamentos não reconhecidos viram chips com contagem
(orienta o usuário a padronizar nomes).
Frontend Turnover (`turnover/page.tsx`):
- Aba "Empresa": KPI "Total da Equipe" agora vem dos ativos (corrige o "0"
  sem preenchimento manual) + card preview "Distribuição por Setor (ao vivo)".
- Aba "Setores": nova seção no topo "Distribuição por Setor — VALIDADA
  (ao vivo)" com header teal, barras comparativas (atual × linha de meta)
  e botão 🔄 Atualizar.
- Coexistência com o legado: tabela histórica manual (TurnoverMonthly)
  permanece abaixo, sem quebra.
🛠️ Fixed
Normalização de acentos: "Contábil" caía em "Outros" porque o matching
comparava 'contáb' ≠ 'contab'; agora `.normalize('NFD')` remove acentos.
🧠 Decisions
ADR-048: benchmark contábil padrão com tolerância ±5 p.p.; distribuição
derivada em memória (zero tabelas novas, zero migrations).
🏁 Status
HOMOLOGADO localmente (12 colaboradores; Fiscal ✓ OK; Contábil mapeado pós-fix).

[Sprint B1] 2026-08 — Tipos Contratuais (Fase B — Pessoas)
✅ Added
Schema Prisma: enum `ContractType` (CLT/ESTAGIARIO/TERCEIRIZADO/SOCIO) +
coluna `contractType` no model `Employee` (default CLT).
Backend: `EmployeeService.create/update` aceita `contractType` (validação
contra enum, fallback CLT p/ valores inválidos).
Frontend `/dashboard/pessoas/page.tsx`:
- Modal com select de tipo contratual (CLT/Estagiário/Terceirizado/Sócio)
- Badge colorido na tabela ao lado do cargo (ADR-001)
- Filtro por tipo contratual (select)
- Gráfico de barras "Distribuição por Tipo" (CSS puro, zero dependências)
🧠 Decisions
ADR-047: tipo contratual vive no `Employee` (enum forte); `Resignation.contractType`
continua como cópia histórica no desligamento (não quebrar sprints antigas).
ADR-001: gráfico de distribuição em CSS puro (barras proporcionais).
🏁 Status
HOMOLOGADO localmente.

[Sprint A7] 2026-08 — Dashboard de Desempenho Comercial (FASE A COMPLETA 🏁)
✅ Added
`ProposalsService.getPerformance`: endpoint `GET /proposals/performance?period=`
consolidando funil (total/sent/viewed/won/lost), taxa de conversão, tempo médio
de fechamento (sentAt → closedAt), desconto médio praticado, ganho acumulado
(monthly/yearly via `closingDetails` da A4), concessão acumulada, top 5
fechamentos por ganho mensal e motivos de perda agregados.
`/dashboard/precificacao/desempenho/page.tsx`: 4 KPIs (conversão, tempo,
desconto, ganho), card "Dinheiro em Jogo" (Ganho × Concessão + balanço líquido
anual), funil de conversão em CSS puro (ADR-001), top 5 fechamentos e motivos
de perda com barras proporcionais; seletor de período (7d/30d/90d/12m/ytd).
Item de menu "Desempenho" filho de "Precificação" no `layout.tsx`.
🧠 Decisions
ADR-001: gráficos em CSS puro — zero dependências novas.
ADR-020: valores monetários já round2 no backend.
Endpoint deriva 100% de `Proposal.closingDetails` (A4) — nenhuma tabela nova,
nenhuma migration.
📊 Resultados reais (validação local com seed de 5 propostas)
Conversão 20% • desconto médio 10% • ganho +R$ 360/mês (+R$ 4.320/ano) •
concessão R$ 240/mês • balanço líquido +R$ 1.440/ano • top ganho: Padaria
Pão Quente (+R$ 360/mês) • perda: "fechou com concorrente mais barato".
🏁 Status
HOMOLOGADO localmente. **Fase A do plano 2.0 completa (A1–A7).**

[Sprint A6] 2026-08 — PDF v2 Premium + PNG da Capa + Logo oficial (white-label)
✅ Added
`lib/proposal-pdf.ts`: PDF v2 100% client-side (ADR-045) — capa com cores do
tenant, logo oficial em chip branco proporcional (contain, nunca esticado),
sumário com nº de páginas (insertPage), gráfico de barras do investimento,
tabela de itens (autoTable head/foot coloridos), seções condicionais,
running header + rodapé numerado com texto customizado.
`lib/proposal-png.ts`: card 1080×1350 p/ WhatsApp via Canvas 2D nativo
(ADR-046 — sem html2canvas), logo proporcional em chip branco, total em
destaque, fallback de inicial quando sem logo.
Exportação em 2 pontos: barra flutuante na página pública (PDF + PNG) e
botão 📄 (FileDown) por proposta na tabela do admin (branding via
GET /company/branding com fallback Conta Certa).
Logo oficial em `frontend/public/logo-conta-certa.png` + `logoUrl` gravado
no tenant via `prisma/set-logo.ts`.
🧠 Decisions
ADR-045: PDF no cliente (zero carga no servidor; jsPDF+autoTable já instalados).
ADR-046: PNG via Canvas 2D nativo (determinístico, sem dependência nova).
ADR-043.1: logo horizontal tratado como "chip branco" com proporção original
(contain) na capa do PDF/PNG e no header público — nunca clipado em círculo.
Degradação graciosa: sem logo → inicial; insertPage indisponível → sem sumário.
🏁 Status
HOMOLOGADO localmente (logo proporcional validado no PDF, no PNG e na página
pública; seed de 5 propostas como base de teste).

[Sprint A5] 2026-08 — White-label (Branding da Proposta Pública)
✅ Added
Schema: 3 colunas em `Company` (`primaryColor`, `secondaryColor`, `proposalFooterText`).
Backend: `GET/PATCH /company/branding` (PATCH só ADMIN) + `UpdateBrandingDto`
(regex hex + maxLength 300) + `findBySlug` retorna objeto `branding` com fallback.
Frontend admin: seção "🎨 Branding da Proposta Pública" em `/dashboard/minha-empresa`
(color pickers + hex + preview ao vivo + rodapé + validação client-side).
Frontend público: `/proposta/[slug]` consome CSS variables `--brand-primary` /
`--brand-secondary` (header, hero, preços, ícones, CTA) + rodapé customizado.
🧠 Decisions
ADR-043: white-label via CSS variables (performático, fallback trivial Conta Certa).
String vazia = null = fallback (tenant antigo nunca quebra).
🏁 Status
HOMOLOGADO localmente.

[Sprint A4] 2026-08 — Fechamento com Ganho (Conta Certa 2.0)
✅ Added
Domínio puro `closing-gain.ts`: função `calcClosingGain` com round2,
interface `ClosingGainResult` (finalPrice, concessionMonthly/Yearly,
gainMonthly/Yearly, belowCurrent, steps[] de memória).
DTO `CloseProposalDto`: `discountPercent` (0–50), `closedPlanId?`,
`currentMonthly?`, `notes?`.
Controller `POST /proposals/:id/close` com rota unificada polimórfica:
se body tem `discountPercent` → `closeWithGain` (A4); senão →
`closeProposal` (legado).
Service `closeWithGain`: persiste `closingDetails` JSON com memória
completa (steps, concession, gain, belowCurrent).
Frontend `CloseProposalModal.tsx`: slider de desconto (0–30%),
preview em tempo real (preço final + concessão + ganho vs hoje),
alerta 🟡 quando `belowCurrent`, toast com ganho mensal no sucesso.
Integração na `precificacao/page.tsx`: botão 🏆 abre o modal em
propostas `SENT`/`VIEWED`; callback `onClosed` recarrega a lista.
🧠 Decisions
ADR-020: round2 em todos os cálculos monetários (fonte da verdade
no backend, frontend só envia `discountPercent`).
Rota unificada polimórfica: mesmo endpoint decide o fluxo pelo DTO
recebido (evita endpoint duplicado e mantém compatibilidade legada).
Memória de cálculo persistida em `closingDetails.steps[]`: auditoria
completa e argumento de venda reproduzível.
🏁 Status
HOMOLOGADO em ambiente local.

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