# 📋 CHANGELOG — Radar Conta Certa

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.
**Formato:** [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)

[Sprint Help System — Sistema de Ajuda Contextual] 27/08/2026 — ✅ HOMOLOGADO
Added
- Sistema de ajuda contextual em 2 camadas (Opção C — Progressive Disclosure):
  • Camada 1: Modal rápido (PageHelp.tsx) com description + steps curtos
  • Camada 2: Página dinâmica /ajuda/[slug] com conteúdo rico (KPIs, workflow,
    regras de ouro, exemplos práticos, passo a passo detalhado)
- Catálogo centralizado em `lib/page-help-catalog.ts` com 35 páginas mapeadas:
  Operacional (9), Comercial (3), Fiscal (7), Bancário/Contábil (5),
  Inteligência (14), Sistema (2)
- Componente PageHelp.tsx renderizado globalmente no layout.tsx (botão "O que é isso?")
- Página dinâmica /ajuda/[slug] com renderização condicional de seções ricas
- Mapeamento bidirecional pathname ↔ slug para navegação fluida
Decisions
ADR-088 Monitoramento/backup opt-in por env (Sentry sem DSN = silencioso); 
CD local via script idempotente (produção on-prem); CI só testes sem banco.
ADR-089 Ajuda contextual em 2 camadas (Progressive Disclosure): modal rápido
para usuários casuais + página detalhada para operadores. Zero poluição visual,
máximo valor pedagógico.
ADR-090 Catálogo centralizado em TypeScript (não CMS): fácil manutenção,
type-safe, sem dependências externas. Fallback amigável para páginas não mapeadas.
Provas
- 35/35 páginas com ajuda funcional • E2E visual: modal abre em todas as páginas
• Navegação modal → página detalhada funcionando • Fallback para rotas não mapeadas

## [Aurora FD-5 + Fases 4/5/6] 27/08/2026 — CNAB 240/400 + Régua + Notificações ✅
# ADR-088: Monitoramento e Backup Opt-in por Ambiente

## Status
Aceito (27/08/2026)

## Contexto
Precisamos de monitoramento de erros em produção (Sentry) e backups automáticos 
do banco de dados. No entanto, forçar configurações de serviços externos ou 
credenciais no ambiente de desenvolvimento local aumenta a fricção, gera custos 
desnecessários e quebra o princípio de "rodar local com 1 comando".

## Decisão
1. **Sentry (Monitoramento):** Envolvido em um wrapper (`sentry.ts`). A inicialização 
   só ocorre se a variável de ambiente `SENTRY_DSN` estiver presente e válida. 
   Caso contrário, o sistema opera normalmente sem enviar telemetria.
2. **Backup (Dados):** Implementado como um script PowerShell externo 
   (`backup-radar-db.ps1`) que usa o `pg_dump` nativo. É agendado via 
   Windows Task Scheduler, mantendo a responsabilidade do backup fora do 
   processo Node.js/NestJS.

## Consequências
- **Dev Local:** Zero configuração, zero custo, zero ruído.
- **Produção:** Basta adicionar o `SENTRY_DSN` no `.env` e rodar o script de 
  agendamento (`install-backup-task.ps1`) para ter enterprise-grade safety.
- **Arquitetura:** O backup não depende da saúde da aplicação Node para ser executado.

### Added
- Domínio puro CNAB 240/400 + client-matcher em `backend/src/billing/domain/` —
  16 testes unitários verdes (7 CNAB + 5 dispatcher + 4 matcher).
- Prisma: 4 tabelas (`cnab_arquivos`, `cnab_movimentos`, `cobranca_regras`,
  `cobranca_eventos`) + 5 enums + auditoria de envio (`destinatario`, `provider`,
  `externalId`) + vínculo BillingInstruction↔Client (`clientId`).
- `BillingModule` c/ 19 rotas protegidas (JwtAuthGuard): CRUD de cobranças,
  upload de retorno CNAB (multipart), baixa de movimentos, regras, execução da
  régua, aprovação humana, envio plugável, históricos, vínculo de client e
  override de destinatário.
- Notificações plugáveis (ADR-086): SendGrid/Twilio via REST fetch nativo (zero
  deps) + LogProvider; roteamento por canal; falha real → FALHOU.
- Frontend: página "Cobrança & CNAB" c/ 4 abas — Cobranças (seletor de cliente
  da casa c/ autopreenchimento nome/CNPJ/honorário + vínculo 🔗), Remessas,
  Retornos e Régua (regras + eventos + destinatário c/ override ✏️).

### Decisions
- **ADR-084:** Domínio puro CNAB isolado; aprovação humana obrigatória em cobrança automática.
- **ADR-085:** Arquitetura híbrida: BillingInstruction = fonte de verdade;
  CnabArquivo/Movimento = histórico; CobrancaRegra/Evento = régua c/ workflow humano.
- **ADR-086:** Notificações por estratégia via fetch nativo; MODO LOG sem chaves;
  falha real → FALHOU (sem fallback silencioso).
- **ADR-087:** Vínculo Client↔cobrança/evento por auto-match determinístico (nome
  normalizado) + seleção manual; destinatário = override > contato do client > log.

### Provas
- 16/16 testes • `tsc --noEmit` 0 erros • E2E visual (3005): remessa, retorno,
  regras, aprovação, envio c/ destinatário real, autopreenchimento da casa.

---

## [Sprint Limpeza TS] 26/08/2026 — 17 erros TypeScript corrigidos ✅

### Changed
- `indicadores/page.tsx`: tipado `insights: Insight[]` com
  `type Insight = { type: 'success' | 'warning' | 'info'; message: string }`
  (eliminou 10 erros de `never[]`).
- `ClosingModal.tsx:32`: `import { api }` → `import api` (axios exporta default).
- `proposal-png.ts`: alias `const c = ctx as CanvasRenderingContext2D` em
  `roundRect` fallback (eliminou 6 erros de `never` no Canvas 2D API).
- `next.config.mjs`: removido `typescript.ignoreBuildErrors: true` — build Docker
  agora roda com type-check rigoroso, igual ao dev.

### Decisions
- **ADR-083:** Limpeza técnica: corrigir erros de tipo legados ANTES de remover
  `ignoreBuildErrors` do build Docker (evita regressão silenciosa em CI futuro).

### Provas
- `npx tsc --noEmit` retorna "Found 0 errors".
- `next build` mostra "Finished TypeScript in 8.5s" (sem fail).

---

## [Sprint 32] 26/08/2026 — Produção local: Radar + Site Conta Certa ✅

### Added
- docker-compose unificado (site Vite/nginx + backend Express + Radar Next/Nest + cloudflared).
- Public hostnames no túnel Cloudflare: `radar.contacerta.com.br` + `radar-api.contacerta.com.br`.
- Radar aplica `prisma migrate deploy` no boot contra o Postgres real da máquina (5432).
- Botão "Administração" no menu do site institucional → abre o Radar em nova aba.

### Changed
- Header do site: `<Link to="/#secao">` substituído por `<a href="#secao">` +
  `scrollIntoView({ behavior: 'smooth' })` (react-router não faz scroll em hash).
- Dockerfile radar-frontend: ARG/ENV `NEXT_PUBLIC_API_URL=https://radar-api.contacerta.com.br`
  antes do build (env real vence .env.local).
- Dockerfile radar-backend: CMD à prova de layout (detecta `dist/main.js` ou `dist/src/main.js`).
- `next.config.mjs`: `typescript.ignoreBuildErrors` só no build Docker.
- CORS do radar-backend liberado para `radar.contacerta.com.br` + localhost.

### Fixed
- Prisma P3009: `migrate resolve --applied` em 6 migrations cujo DDL já existia.
- Cloudflare "DNS record already exists": removido registro `radar` velho; túnel
  recriou o CNAME.
- Site: menu institucional agora rola ao clicar nas âncoras (#servicos, #planos, etc).

### Decisions
- **ADR-077:** Postgres real via `host.docker.internal`.
- **ADR-078:** `ignoreBuildErrors` no build Docker.
- **ADR-079:** Túnel único site + Radar.
- **ADR-080:** `migrate resolve --applied`.
- **ADR-081:** env de build > `.env.local`.
- **ADR-082:** scroll suave nativo em vez de hash do router.

---

## [Sprint Contábil+] 22/08/2026 — Plano de Contas SCI 90113 ✅

### Added
- Seed idempotente `seed-chart-of-accounts.ts` (ADR-062): 1.207 contas,
  encoding Windows-1252 autodetectado, código real na coluna 2 do CSV,
  hierarquia pai→filho, reimportação desativa contas antigas do plano.
- Página `/dashboard/contabil/plano-contas`: árvore indentada por nível,
  KPIs por tipo, busca, ordenação código/nome ↑↓, filtro por plano,
  toggle de analíticas, ✏️ editar / ➕ criar / 🗑️ desativar.

### Removed
- Endpoint morto de upload de CSV (multipart) removido do backend —
  seed é o canal oficial (ADR-062).

### Status
- **HOMOLOGADO** localmente (1.207 contas ativas + CRUD validado).

---

## [Sprints FD-5/6/8 v1] 21/08/2026 — Aurora: Cofre Legal, Certificado A1, EFD e CNAB v1 ✅

### Added
- **FD-8:** cofre AES-256-GCM (`common/crypto/vault.ts`, ADR-059) + LegalModule:
  senhas/procurações/eCAC cifrados; listagem SEM o segredo (só `hasSecret`);
  reveal só ADMIN (RolesGuard); obrigações legais com alerta de prazo;
  upload de Certificado A1 (.pfx + senha cifrados).
- **FD-6:** geração da EFD-Contribuições v1 (bases PIS/COFINS da auditoria F6 →
  txt M200/M600, ADR-060) com download direto no frontend.
- **FD-5 v1:** model `BillingInstruction` + régua de cobrança
  (PENDENTE→GERADA→ENVIADA→PAGA, VENCIDA derivada) + gerador CNAB 240 v1
  (`billing/domain/cnab240.ts`, domínio puro, ADR-061) + página
  `/dashboard/funcionario-digital/cobranca` com KPIs, tabela e download.

### Decisions
- **ADR-059:** cofre local c/ chave em env (reveal auditável).
- **ADR-060:** EFD v1 sem filtro de competência.
- **ADR-061:** CNAB v1 c/ entradas explícitas (layout bancário homologa no v2).

### Status
- **HOMOLOGADO** localmente. Aurora: FD-1→FD-6 + FD-8 ✅.

---

## [Sprints C1–D3] 08/2026 — Conta Certa 2.0: FASES C (Mercado) e D (Mentoria) ✅

### Added
- **C1:** Benchmark de softwares (ADR-052 híbrido rede+catálogo) + persistência
  `GET/PATCH /company/software-stack` + seção em Minha Empresa + seed de rede.
- **C2:** Serviços extras c/ preço médio (ADR-053) + "💰 dinheiro na mesa".
- **C3:** Indicadores customizados c/ fórmula (ADR-054 — parser AST, ZERO eval) +
  `/dashboard/indicadores-custom` + seed de 4 indicadores.
- **C4:** Score 0–100 do Escritório (ADR-055 — 5 dimensões ponderadas) +
  `/dashboard/score` (nota real 51 = Prata 🥈 na homologação).
- **D1:** Visão de Futuro (ADR-056) + `/dashboard/mentoria` (norte + metas +
  focos derivados das 2 dimensões mais fracas do Score).
- **D2:** Checklist "Meu Plano" (ADR-057 — persistido, % execução, import
  idempotente das ações dos focos via @@unique).
- **D3:** Ranking de Níveis (ADR-058 — Bronze→Diamante + pódio multi-tenant) +
  `/dashboard/ranking`.

### Decisions
- **ADR-052→058:** domínios puros, zero IA generativa, zero tabelas onde possível.
- **ADR-034.2:** sprints autocontidas em entrega única (código+seed+validação+docs).

### Status
- **HOMOLOGADO** localmente. 🎉 **FASES C e D COMPLETAS. Plano 2.0: A–D ✅.**

---

## [Sprints SCI-1/2/3] 08/2026 — Ciclo Contábil por Cliente ✅

### Added
- Ciclo Contábil do Cliente: balancete inicial + razão/livro caixa + sugeridor
  contraparte→conta (memória do passado p/ classificar o futuro).
- Importação inteligente de extrato: sugestões 🟢 Auto / 🟡 Regra / 🟠 Revisar,
  multi-conta bancária por seção do CSV, revisão humana com autocomplete
  (nome / código / nº unificado), anti-duplicidade (somente novos OU substituir)
  e lixeira do extrato importado.
- Multi-planos por cliente (ADR-072): `Client.accountingPlan`, múltipla escolha
  no cadastro (aba 1), badge 📒 na carteira, importação do plano SCI 90132 e
  exclusão de plano com trava de integridade.
- Extratos Conciliados: 🖨️ Imprimir (impressora) e 📄 PDF por cliente;
  atalho 📤 Exportar p/ SCI após conciliação (Lançamentos → Integração SCI).
- Partida dobrada manual: D e C obrigatórios com espelhamento de valor e
  auto-CONCILIADO + botão ✓ de conciliação rápida (ADR-074).

### Changed
- Exportação SCI (history + accounting): números REDUZIDOS do plano ativo do
  cliente (ex.: 489;819) e decimal com PONTO (1500.00) — ADR-073.
- Sincronização do balancete e sugestões do extrato passam a respeitar o plano
  ativo do cliente; re-importação da base aceita números reduzidos.

### Fixed
- Imports quebrados do `lancamentos/page.tsx` (api/useRouter/jsPDF/autoTable).

### Decisions
- **ADR-072:** multi-planos por cliente.
- **ADR-073:** SCI reduzido + decimal ponto.
- **ADR-074:** partida dobrada c/ espelho e auto-conciliação.

---

## [Sprint FD — Funcionário Digital] 17-18/08/2026 — Aurora: 7 skills, NFS-e, guias e relatórios ✅

### Added
- **FD-1 Fundação:** tabelas `RobotWorker`/`RobotWorkerSkill`/`AutomationRun`/
  `AutomationPending`/`AutomationAudit`/`ApprovalRecord` + dashboard da Aurora
  + menu + crons ↔ toggles.
- **FD-2:** skills `RECONCILIATION`, `CLASSIFICATION`, `ACCOUNTING_BRIDGE` +
  Central de Aprovações (régua 80/50 — ADR-030).
- **FD-2 final:** `MONTHLY_REPORT` — PDF mensal por cliente (jspdf+autotable no
  backend, ADR-035) + endpoints reports + aba "Relatórios Mensais".
- **FD-3a:** `NFSE_IMPORT` — parser ABRASF 2.0 (4/4 testes), model
  `FiscalServiceInvoice`, inbox/processed/failed, upload+lista, aba "NFS-e"
  c/ modal de XML original (ADR-036/037).
- **FD-3b:** `NFSE_EMAIL_COLLECT` — coletor IMAP (imapflow+mailparser), cron
  `*/30`, SKIP gracioso sem credenciais, source `EMAIL` (ADR-039).
- **FD-4:** `TAX_GUIDES` — domínio puro Simples Nacional (Anexo III) + ISS
  (5/5 testes), model `TaxGuide` c/ memória de cálculo (ADR-038), endpoints
  calculate/list/patch/pdf, PDF imprimível da guia + aba "Guias de Imposto".

### Decisions
- **ADR-030:** Regra de Ouro (LEGAL nunca AUTO).
- **ADR-031:** cálculo determinístico.
- **ADR-033:** perfis de aprovação.
- **ADR-034:** deltas em arquivos estruturais.
- **ADR-035:** PDFs no backend (jspdf 2.5.2 / autotable 3.8.2 pinados).
- **ADR-036:** ABRASF c/ adaptadores.
- **ADR-037:** source como atributo.
- **ADR-038:** memória de cálculo.
- **ADR-039:** IMAP como coletor.

### Resultados reais (produção controlada, Postgres local 5432)
- 98 clientes reais importados; CLASSIFICATION 18/18 auto; 99 PDFs mensais;
- NFS-e com fila 🟡 e vínculo por CNPJ; guias ACGS 2026-07: ISS R$ 420 + DAS R$ 660
  com passo a passo auditável; 602h economizadas.

### Status
- **HOMOLOGADO** localmente. Teste IMAP real pendente (requer caixa de e-mail).

---

## [Sprints F6–F7] 18/08/2026 — Auditoria Tributária e Impressão Fiscal ✅

### Added
- **F6:** componente `TaxAuditTable` — auditoria tributária por item no modal
  de detalhe da NF-e: tabela Base × Alíquota = Valor para ICMS, IPI, PIS e
  COFINS, com selo **✓ OK** / **⚠ diverge** e explicação automática do
  valor esperado quando há divergência (cross-check determinístico).
- Parser de XML NF-e 4.0 com captura completa de alíquotas reais:
  ICMS (tratando CST 51 diferimento, CST 60 ST retido, ICMSSN),
  IPI (formatos percentual, por unidade e IPINT isento),
  PIS/COFINS (formatos Aliq/Qtde/NT/Outr).
- Service de persistência gravando 6 novas colunas em `FiscalInvoiceItem`:
  `ipiBase`, `ipiRate`, `pisBase`, `pisRate`, `cofinsBase`, `cofinsRate`.
- **F6.1:** selo destacado **"Qtd: N UN"** por item + resumo
  "X itens • Y unidades" no cabeçalho do modal.
- **F7:** botão 🖨️ **Imprimir** no modal de detalhe da NF-e:
  - Layout A4 otimizado: imprime **somente o modal** (dashboard/sidebar ficam de fora).
  - Chave de acesso (44 dígitos) em destaque no rodapé fiscal (exigência legal).
  - Cada item com `break-inside: avoid` — nunca cortado entre páginas.

### Changed
- `notas/page.tsx`: tipos `InvoiceItem` e `InvoiceDetail` ganham
  `ipiBase`, `ipiRate`, `pisBase`, `pisRate`, `cofinsBase`, `cofinsRate`;
  `product` ganha `unit?: string`.
- `notas/page.tsx`: modal migra para `createPortal` + `<style>` injetado
  com CSS de impressão (ADR-026 revisado — sem `globals.css`).

### Decisions
- **ADR-026:** impressão fiscal sem `globals.css`/jsPDF. Modal via
  `createPortal(document.body)` + `<style>` com `@media print` injetado.
- **ADR-031:** Auditoria determinística no frontend (Base × Alíquota = Valor):
  tolerância de R$ 0,02 para arredondamentos fiscais.
- **ADR-032:** Reimportação necessária para notas antigas (parser novo captura
  apenas em novos uploads).
- CSOSN 102/103 (Simples Nacional): base ICMS por item R$ 0,00 no XML
  (comportamento fiscal correto — grupo `ICMSSN102` não possui tag `vBC`).

### Status
- **HOMOLOGADO** em ambiente local. Testado com NF-e reais — auditoria detecta
  divergências de cálculo automaticamente.

---

## [Sprints F4–F5] 08/2026 — Enriquecimento Fiscal ✅

### Added
- **F4:** card "Base ICMS" no modal de detalhe da nota (total da nota) e linha
  "Base ICMS" por item — exibindo dados que o parser já extraía (`vBC` por
  item e no `ICMSTot`) e o schema já persistia. Zero migrações.
- **F5:** coluna "Produtos" na listagem de notas (1º produto em A–Z + badge
  "+N produto(s)" com tooltip listando todos).
- **F5:** seletor "Ordenar por: Mais recentes | Produto (A–Z)" — ordenação
  server-side compatível com paginação.
- **F5:** busca da listagem agora encontra notas pelo NOME DO PRODUTO
  (ex.: digitar "TRIANGLE" acha a nota #8338).

### Changed
- `invoice.service.ts` → `findAll`: retorna descrições dos itens ordenadas
  A–Z; novo filtro `sortBy`; busca inclui `items.description`.
- `invoice.controller.ts` → whitelist segura de `sortBy`.
- `notas/page.tsx` → coluna nova + seletor + tipos atualizados.

### Decisions
- **ADR-028:** ordenação A–Z na aplicação (`localeCompare('pt-BR')` +
  paginação sobre ranking). Notas sem itens vão para o final da lista.
- CSOSN 102/103 (Simples) não trazem `<vBC>` por item no XML: base
  exibida como R$ 0,00 nesses casos (comportamento fiscal correto).

---

## [Sprints A1–A7] 08/2026 — Plano 2.0: Ciclo Comercial Completo ✅

### A1 — Motor de Herança de Planos (Domínio Puro)
- Camada de domínio puro para herança de planos comerciais
  (`backend/src/commercial-plans/domain/`).
- Função `resolvePlanInheritance(plans, items)`: calcula itens herdados em
  memória com multiplicador crescente.
- Função `calculatePricingInsights(resolvedPlans, baseValue)`: valor de
  referência, % vs base, dinheiro na mesa (mensal/anual).
- Flag `isIndependent`: planos marcados não herdam e não doam itens.
- 6 testes unitários verdes.
- **ADR-020:** Herança derivada em memória; preços com `round2`.

### A2 — Valor de Referência + Dinheiro na Mesa
- Endpoint `POST /commercial-plans/insights`.
- DTO `CalculatePricingInsightsDto` + `PlanWithInsightsDto`.
- Integração das funções `planPriceFromReference`, `relativePercentVsBase`,
  `calcMoneyOnTable` do domínio puro.

### A3 — Versões de Proposta
- Migração: colunas `version`, `isCurrent`, `originalProposalId` no `Proposal`.
- Self-relation `ProposalVersions` para navegação entre versões da mesma cadeia.
- Endpoints `GET /proposals/client/:clientId/versions` e
  `POST /proposals/:id/new-version`.

### A4 — Fechamento com Ganho
- Domínio puro `closing-gain.ts`: função `calcClosingGain` com round2.
- DTO `CloseProposalDto`: `discountPercent` (0–50), `closedPlanId?`,
  `currentMonthly?`, `notes?`.
- Controller `POST /proposals/:id/close` com rota unificada polimórfica.
- Modal com slider de desconto e preview em tempo real.

### A5 — White-label (Branding da Proposta Pública)
- Schema: 3 colunas em `Company` (`primaryColor`, `secondaryColor`, `proposalFooterText`).
- Backend: `GET/PATCH /company/branding`.
- Frontend público consome CSS variables `--brand-primary` / `--brand-secondary`.
- **ADR-043:** white-label via CSS variables.

### A6 — PDF v2 Premium + PNG da Capa
- `lib/proposal-pdf.ts`: PDF v2 100% client-side (ADR-045) — capa com cores do
  tenant, logo oficial proporcional, sumário, gráfico de barras.
- `lib/proposal-png.ts`: card 1080×1350 p/ WhatsApp via Canvas 2D nativo (ADR-046).
- **ADR-045:** PDF no cliente (zero carga no servidor).
- **ADR-046:** PNG via Canvas 2D nativo.

### A7 — Dashboard de Desempenho Comercial
- `ProposalsService.getPerformance`: endpoint `GET /proposals/performance?period=`
  consolidando funil, taxa de conversão, tempo médio, desconto médio, ganho
  acumulado, concessão acumulada, top 5 fechamentos e motivos de perda.
- `/dashboard/precificacao/desempenho/page.tsx`: 4 KPIs, card "Dinheiro em Jogo",
  funil de conversão em CSS puro, top 5 fechamentos.
- **ADR-001:** gráficos em CSS puro.

### Status
- **HOMOLOGADO** localmente. **Fase A do plano 2.0 completa (A1–A7).**

---

## [Sprint 31] 08/2026 — Containerização (Docker Compose) ✅

### Added
- `docker-compose.yml` na raiz: Postgres 5433, Backend 3001, Frontend 3000, volume `pgdata`.
- `backend/Dockerfile`: multi-stage com `node:20-slim` + OpenSSL.
- `frontend/Dockerfile`: multi-stage com `output: "standalone"` do Next.js.
- Comando de boot do backend: `npx prisma migrate deploy && node dist/main.js` (self-healing).

### Fixed (Erros de Build de Produção)
- `revisao/page.tsx`: adicionadas funções `handleSelectDebit/Credit` e `handleClearDebit/Credit`.
- `revisao/page.tsx`: Lucide `title` → wrapper `<span title>` (ADR-021).
- Removido `layout copy.tsx` (backup quebrava o build; ADR-022).
- `layout.tsx`: `item.children?.map` com optional chaining (ADR-023).
- `planejamento/page.tsx`: Sonner `cancel` com `onClick={() => {}}` (ADR-024).
- `login/page.tsx`: envolvido em `<Suspense>` para satisfazer `useSearchParams()`.

### Decisions
- Postgres do Docker na porta **5433** (não conflita com Postgres local 5432).
- Troca de base Alpine para Debian-slim no backend (Prisma exige glibc + OpenSSL).

---

## [Sprints B1–B5] 08/2026 — Pessoas: Tipos, Distribuição, KPIs, Entrevista IA, Cargos ✅

### B1 — Tipos Contratuais
- Schema Prisma: enum `ContractType` (CLT/ESTAGIARIO/TERCEIRIZADO/SOCIO) +
  coluna `contractType` no model `Employee`.
- Badge colorido na tabela + filtro por tipo contratual.
- **ADR-047:** tipo contratual vive no `Employee`.

### B2 — Distribuição por Setor VALIDADA
- `EmployeeService.getSectorDistribution` + endpoint
  `GET /employees/sector-distribution`.
- Comparação com benchmark contábil (ADR-048): Fiscal 30% • Contábil 25% •
  DP 20% • Admin 15% • Outros 10%, tolerância ±5 p.p.
- Normalização de acentos: "Contábil" caía em "Outros" → fix com `.normalize('NFD')`.

### B3 — KPIs Novatos & Críticos
- Schema Prisma: flag `isCritical Boolean @default(false)` nos models
  `Employee` e `Resignation`.
- Endpoints de KPIs (turnover de novatos, críticos ativos, tenure médio).
- Modal com checkbox "🔑 Colaborador crítico".
- **ADR-049:** flag crítico com cópia histórica.

### B4 — Entrevista de Desligamento com IA
- Schema: `exitInterview Json?` + `exitAnalysis Json?` no `Resignation`.
- `exit-interview-engine.ts`: motor DETERMINÍSTICO (domínio puro, zero deps).
- Modal 2 passos (formulário → causa primária + confiança + plano de ação).
- **ADR-050:** motor intercambiável (LLM amanhã sem tocar no código).

### B5 — Benchmark de Cargos por Setor
- `employee/domain/position-benchmark.ts`: domínio puro (ADR-051) com catálogo
  contábil de cargos por setor.
- Página `/dashboard/pessoas/benchmark`: cards por setor com barras CSS puro.
- **FASE B (Pessoas) COMPLETA.**

---

## [Sprints 26–30] 2026 — Hardening e UX ✅

### Added
- Soft deletes em entidades críticas (preserva histórico contábil).
- Validações de DTO com `class-validator`.
- Índices compostos no Prisma (performance).
- Empty states em todas as telas.
- Confirmações Sonner em ações destrutivas.
- Paginação e otimizações de queries.
- Tendências de propostas (gráfico de evolução).

---

## [Sprints 22–25] 2026 — Módulos Operacionais (Vantagem Competitiva) ✅

### Added
- **Fiscal:** NF-e de entrada, estoque Kardex, apuração ICMS, SPED Bloco H.
- **Bancário:** extrato CSV, classificação com memória, naturezas por cliente,
  fechamento com trava.
- **Operações:** projetos e tarefas (Kanban multi-tenant).
- **Contábil:** plano de contas SCI 90113, lançamentos, conciliação, exportação SCI.

---

## [Sprints 18–21] 2026 — Ciclo Comercial v1 ✅

### Added
- Carteira de Clientes (MRR/Churn/Ticket).
- Propostas (wizard 5 passos, link público, tracking).
- PDF/Excel de propostas.
- Regras de horas + calculadora de precificação.

---

## [Sprints 13–17] 2026 — BI e Administração ✅

### Added
- DRE gerencial.
- Ponto fora da curva (anomalias estatísticas).
- Simulador tributário (Simples × Presumido × Real).
- Planos comerciais v1 (multiplicadores).
- Painel Admin (visão geral + catálogo).

---

## [Sprints 8–12] 2026 — Identidade e Módulos de Gestão ✅

### Added
- Rebranding Conta Certa + Sonner (toasts).
- Precificação por horas + margem.
- Planejamento estratégico (OKRs, metas).
- Minha Empresa (perfil do escritório).
- CSV UTF-8+BOM (ADR-002).

---

## [Sprints 1–7] 2026 — Fundação ✅

### Added
- Monorepo (backend/ + frontend/).
- Auth multi-tenant JWT+refresh.
- Frontend Next.js + Zustand.
- Dashboard executivo (gráficos CSS, ADR-001).
- Pessoas/Turnover.
- Clientes (CRUD + importação em massa).