# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa
> Arquivo de injeção de contexto. Cole INTEIRO no início de toda conversa nova.
> Última atualização: 18/08/2026 (pós-Sprints F4–F7 do Fiscal — Enriquecimento e Auditoria).

## 1) PERSONAS E MÉTODO DE TRABALHO
- Usuário: Marcos (autodeclarado "junior dos juniores"), dono do produto.
- IA: Engenheiro Sênior + Tech Lead Full Stack + CTO + QA + DevOps.
- Regras inegociáveis:
  1. Pensar como engenheiro; arquitetura antes de código.
  2. Passo a passo para júnior; arquivos SUPER comentados.
  3. Nunca entregar código sem contexto, funções gigantes ou soluções improvisadas.
  4. Fim de cada sprint = atualizar README + testes + VALIDAÇÃO do Marcos antes de avançar.
  5. Decisões técnicas registradas como ADRs.
  6. Clean Code, SOLID, modularização, padrões enterprise, SaaS desde o início.

## 2) O PRODUTO
- Nome: Radar Conta Certa (Conta Certa Soluções Empresariais).
- SaaS de gestão empresarial para escritórios contábeis.
- Multi-tenant single-database (isolamento por companyId).
- Identidade: teal #0d9488 • laranja #f97316 • cinza #475569.

## 3) STACK (VERSÕES)
- FE: Next.js 16.2.12 (App Router), React 19, TS 5, Tailwind 3, Zustand 4 (persist),
  Sonner, Axios, Lucide React, Turbopack, jspdf/autotable.
- BE: NestJS 10, TS 5, Prisma 5, PostgreSQL 15+, JWT+refresh, bcrypt, class-validator.
- Infra: Docker Compose (local); alvo futuro: VPS + nginx + Let's Encrypt + CI/CD.

## 4) AMBIENTE DO MARCOS (Windows/PowerShell)
- Projeto: C:\radar-clone (pastas backend/ e frontend/).
- Postgres LOCAL na porta 5432 = dados REAIS (não tocar).
- Docker Compose: postgres 5433 / backend 3001 / frontend 3000 (banco virgem p/ testes).
- Estado atual (17/08): backend .env aponta p/ 5432 (dados reais); o frontend Docker
  segura a porta 3000 → Next dev sobe na 3002 (CORS multi-origem 3000/3002 no main.ts).
- Docker Desktop já teve daemon.json corrompido (\x00); resolvido com reset completo
  (wsl --shutdown + remoção de .docker/AppData + reboot).

## 5) MÓDULOS ENTREGUES (operacionais)
Auth multi-tenant • Dashboard executivo (gráficos CSS puro) • Pessoas/Turnover •
Clientes • Carteira de Clientes (MRR/Churn/Ticket) • Precificação (horas, regras,
calculadora, planos START/PRIME/BLACK, propostas c/ link público + tracking + PDF/Excel) •
Planejamento (metas/KPIs/ações) • Minha Empresa • BI (DRE gerencial, ponto fora da
curva, simulador tributário) • Fiscal (NF-e/estoque/ICMS/SPED + **auditoria tributária
Base × Alíquota por item + impressão/PDF do detalhe** — Sprints F4–F7) •
Bancário (extrato, conciliação) • Operações (projetos/tarefas) • Admin •
Exportação CSV UTF-8+BOM • 🤖 Funcionário Digital Aurora (conciliação/classificação/
ponte + dashboard + auditoria + crons + NFS-e ABRASF).

## 6) ANÁLISE COMPETITIVA (11 vídeos — Radar Gestão Estratégica)
- ELES vencem em: herança entre planos; proposta white-label (cores do logo/site);
  "dinheiro na mesa" (cobrado hoje vs ideal); versões de proposta; fechamento c/
  desconto+ganho; turnover c/ tipos contratuais + distribuição validada + entrevista
  de desligamento c/ IA; benchmark de softwares/serviços extras; indicadores
  personalizados c/ fórmula; gamificação (níveis/pódio); UX (command palette,
  "onde parou", notificações).
- NÓS vencemos em: operacional contábil real (Fiscal, Bancário, SCI, Operações) —
  eles NÃO têm isso.
- Estratégia: manter vantagem operacional + atropelar na camada comercial/analítica/UX.

## 7) PLANO DE EXPANSÃO "CONTA CERTA 2.0"
Fase A (Comercial): A1 ✅ • A2 ✅ • A3 ✅ • A4 ✅ • A5 white-label • A6 PDF v2+PNG • A7 dashboard desempenho.  mesa 
• A3 versões de proposta 
• A4 fechamento c/ ganho 
• A5 white-label 
• A6 PDF v2+PNG • A7 dashboard desempenho.
- Fase B (Pessoas): B1 tipos contratuais • B2 distribuição por setor validada •
  B3 KPIs novatos/crítico • B4 entrevista de desligamento (IA) • B5 cargos p/ setor.
- Fase C (Mercado): C1 benchmark softwares • C2 serviços extras c/ preço médio •
  C3 indicadores c/ fórmula • C4 score 0–100.
- Fase D (Mentoria): D1 Visão de Futuro • D2 checklist/Meu Plano • D3 ranking níveis.
- Fase E (UX): E1 command palette • E2 boas-vindas/"onde parou" • E3 notificações.

## 8) ADRs ATIVOS (resumo) — catálogo unificado 001–042
### 📜 Infraestrutura e Plataforma (001–004)
ADR-001 Gráficos CSS puro (Recharts incompatível c/ React 19+Turbopack).
ADR-002 CSV com UTF-8+BOM (acentos no Excel).
ADR-003 Zustand persist p/ SSR seguro.
ADR-004 Multi-tenant single-database por companyId.

### 🏦 Bancário e Parsing (005–012)
ADR-005 Parser CSV bancário por CONTEÚDO, não cabeçalho (aceita qualquer banco).
ADR-006 Datas pela máscara: 01/06/2026 (BR) vs 6/1/26 (pivot), sem ambiguidade.
ADR-007 Memória de classificação por contraparte normalizada.
ADR-008 Upsert (companyId, code) no plano de contas (criar 2× não gera erro).
ADR-009 Classificação do DRE pelo SINAL da transação (independe do plano de contas).
ADR-010 Estorno por replay no Kardex (excluir NF-e recalcula custo médio).
ADR-011 Zero dependências opcionais em DTOs.
ADR-012 Naturezas como String (não enum) + grupos DRE fixos.

### 💼 Comercial e Dados (013–019)
ADR-013 Propostas relacionais (fim do JSON solto).
ADR-014 Idempotência na reimportação de extrato (reimportar substitui, não duplica).
ADR-015 Idempotência via UPSERT em seeds.
ADR-016 Classificação em 3 camadas: regras aprendidas → built-in → pendente revisão.
ADR-017 Trava de compliance: mês FECHADO é imutável.
ADR-018 Score de conciliação 60/30/10 (valor/nome/data) c/ thresholds 🟢≥80 / 🟡50–79.
ADR-019 Sugestões não gravam nada até confirmação humana.

### 🎯 Precificação e UX (020–027)
ADR-020 Herança de planos derivada em memória; independente não herda E não doa;
        ordem por multiplicador; preços com round2.
ADR-021 Ícones Lucide: tooltip via <span title> wrapper (title não existe no tipo).
ADR-022 Proibido arquivo de backup dentro de src/ (quebra next build).
ADR-023 Optional chaining (?.) em .map de opcionais no JSX.
ADR-024 Sonner: action/cancel exigem onClick (usar () => {} p/ só fechar).
ADR-025 RBAC com decorator @Roles() + 3 camadas (middleware/UI/RolesGuard).
ADR-026 Impressão fiscal sem globals.css/jsPDF: portal p/ document.body +
        <style> @media print; imprime só o modal; chave de acesso no rodapé.
ADR-027 Cookie espelho (radar_auth_token/role) p/ middleware Next.js.

### 🧾 Fiscal (028–029)
ADR-028 Ordenação "Produto (A–Z)" na aplicação (query leve + localeCompare pt-BR +
        paginação sobre ranking); sem agregação de relação do Prisma.
ADR-029 Unificação de códigos não destrutiva: Dice sobre tokens + coluna
        unifiedCode separada (nunca sobrescreve code).

### 🤖 Aurora e Compliance (030–037)
ADR-030 Regra de Ouro: ações riskLevel=LEGAL nunca são AUTO (aprovação humana sempre).
ADR-031 Cálculo tributário determinístico no backend; IA apenas sugere/classifica.
ADR-032 LGPD: cofres de credenciais AES-256-GCM (implementação em FD-8).
ADR-033 Perfis de aprovação por tipo de tarefa (Auxiliar/Analista/Supervisor/Contador).
ADR-034 Arquivos estruturais (app.module.ts, schema.prisma): entregar sempre o delta.
ADR-035 PDFs de relatório mensal no backend c/ jspdf 2.5.2 + autotable 3.8.2 pinados.
ADR-036 NFS-e: parser ABRASF 2.0 c/ adaptadores municipais; não reconhecido → rawXml.
ADR-037 Origem do documento (MANUAL|EMAIL|PORTAL|OCR) é atributo `source`.
ADR-038 Memória de cálculo auditável: toda guia preserva steps/sources/lawRef em JSON;
o contador reproduz a conta (FD-4).
ADR-039 IMAP como coletor de NFS-e (FD-3b); `source: 'EMAIL'` no upsert (ADR-037).

### 🆕 Recém-Documentados — Inferidos do código+commits (038–042)
ADR-038 Memória de cálculo auditável: toda guia preserva steps/sources/lawRef em JSON.
ADR-039 IMAP como coletor de NFS-e (FD-3b); source='EMAIL' no upsert (ADR-037).

ADR-038 Parser CSV bancário multi-formato: detecta separador (;, TAB), milhares
        BR/US e datas DD/MM vs MM/DD pela máscara (commit a74e37e — Sprint 21).
ADR-039 Naturezas dinâmicas por cliente: `BankCategory` é String (não enum);
        grupos DRE fixos garantem que o DRE sempre fecha (commit a74e37e).
ADR-040 Matching fuzzy por coeficiente de Dice sobre tokens (não Levenshtein),
        limiar configurável a partir de 10% (commit ca22fe1 — Sprint 18).
ADR-041 Ponte Bancário→Contábil idempotente: `bankTransactionId` como chave;
        promover 2× não duplica lançamentos (commit 9b0d607 — Sprint 26).
ADR-042 Conciliação Banco×NF-e apenas em DÉBITOS bancários c/ NF-e de ENTRADA
        (estoque armazena notas de compra) (commit d61b657 — Sprint 29).

9) STATUS ATUAL E PRÓXIMOS PASSOS
Sprint A1 CONCLUÍDA: domínio puro testado (6 testes verdes).
Sprint 31 (Docker) HOMOLOGADA: ambiente estável (Postgres 5433, Backend 3001, Frontend 3000).
Sprint A2 COMPLETA: GET /resolved + POST /insights (Dinheiro na Mesa R$ 19.200/ano validado).
Sprint A3 HOMOLOGADA: versões de proposta (version/isCurrent/originalProposalId + endpoints de listagem e duplicação).
Sprint A4 HOMOLOGADA: Fechamento com Ganho (slider de desconto + memória de cálculo em `closingDetails` JSON + alerta 🟡 belowCurrent). Fluxo completo: criar proposta → enviar → clicar 🏆 → descontar → ver ganho vs hoje → confirmar → toast com ganho mensal.
Sprint F6 HOMOLOGADA: auditoria tributária de NF-e (parser captura todas as alíquotas; modal exibe Base × Alíquota = Valor com explicação automática de divergências).
IMEDIATO: Sprint F7 = Endpoint consolidado GET /fiscal/invoices/tax-rates-by-product (tabela de alíquotas médias por NCM/produto para análise de padrões tributários).
DEPOIS: A4→A7, Fases B→E (ordem do §7).
Sprint A5 HOMOLOGADA: white-label de propostas (cores/logo/rodapé por tenant via CSS variables, fallback Conta Certa).
Fase A (Comercial): A1 ✅ • A2 ✅ • A3 ✅ • A4 ✅ • A5 ✅ • A6 PDF v2+PNG • A7 dashboard desempenho.


- FD-1 Fundação: 6 tabelas + dashboard + menu + crons ↔ toggles.
- FD-2 COMPLETA: 4 skills + Central de Aprovações + Relatórios Mensais (99 PDFs) + UI.
- FD-3a COMPLETA (18/08): NFS-e ABRASF + NfseImportSkill + upload/lista + UI.
- **Sprints F4–F7 (Enriquecimento Fiscal) COMPLETAS E HOMOLOGADAS (18/08):**
  - F4: Base ICMS total e por item no modal de detalhe.
  - F5: Coluna "Produtos" na listagem + ordenação A–Z (ADR-025) + busca por nome
    do produto (`items.description` case-insensitive).
  - F6: Auditoria tributária por item (TaxAuditTable: Base × Alíquota = Valor p/
    ICMS/IPI/PIS/COFINS c/ selo ✓ OK / ⚠ diverge + explicação do esperado).
  - F6.1: Selo "Qtd: N UN" por item + resumo "X itens • Y unidades" no modal.
  - F7: Impressão/salvar PDF do detalhe da NF-e via portal + CSS injetado (ADR-026),
    com chave de acesso (44 dígitos) no rodapé fiscal.
  - Arquivos: `invoice.service.ts`, `invoice.controller.ts`, `notas/page.tsx`,
    `components/fiscal/TaxAuditTable.tsx`. Zero migrações Prisma.
- Aurora com 5 skills em produção controlada (98 clientes reais).

### 🚧 Notas técnicas (dívida consciente)
- Postgres 18 local: radar_user sem CREATEDB → SQL manual + GRANT + resolve.
- Backend: jspdf 2.5.2 / autotable 3.8.2 pinados; fast-xml-parser p/ NFS-e.
- FD-3b (IMAP) e FD-3c (portal/OCR) adiados; `source` já preparado (ADR-037).
### 🚀 IMEDIATO (escolher 1)
- FD-5: Cobrança CNAB remessa/retorno (SkillKey BILLING já reservada).
- A4: Fechamento com Ganho (plano comercial 2.0).
- FD-3b real: configurar credenciais IMAP no .env e testar com caixa Gmail/Outlook.

### 📋 DEPOIS
- FD-6→FD-9; A5→A7; Fases B→E (ordem do §7).

## 10) COMANDOS ÚTEIS (PowerShell)
docker compose up -d --build | docker compose ps | docker compose logs -f backend
npm run test -- --testPathPattern=plan-inheritance (backend)
<!-- Aurora: login + disparo manual de skill (botão "Rodar agora" via API) -->
$login = Invoke-RestMethod -Uri http://localhost:3001/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aurora.com","password":"123456"}'
$token = $login.token
Invoke-RestMethod -Uri http://localhost:3001/digital-employee/skills/RECONCILIATION/run -Method POST -Headers @{ Authorization = "Bearer $token" }

## 11) INSTRUÇÃO PARA A NOVA IA
Leia este arquivo, confirme com "Yes", e continue EXATAMENTE do §9.
Não reimplementar sprints concluídas; não mudar stack; seguir método do §1.

## 12) FUNCIONÁRIO DIGITAL AURORA — DOSSIÊ
<!-- Seção numerada criada em 17/08 para organizar o bloco que antes ficava
     solto após o §11. Checklist atualizado ao estado real. -->
Nome: AURORA = Automação Unificada de Rotinas e Obrigações, com Revisão e Auditoria 🌅
(o "JARVIS contábil": acorda às 02:00 e prepara tudo; nunca decide sozinha o que é legal).

### Status atual (18/08/2026)
- [x] FD-1 Fundação: 6 tabelas Prisma + módulo NestJS completo + endpoint "Rodar agora"
- [x] Dashboard /dashboard/funcionario-digital + item de menu 🤖 (seção INTELIGÊNCIA)
- [x] ReconciliationSkill: reusa motor da Sprint 29 (≥80% auto, 50–79% fila 🟡)
- [x] ClassificationSkill: memória de aprendizado via BankingService.classify
- [x] AccountingBridgeSkill: ponte via AccountingService.promoteFromBanking
- [x] Crons ↔ toggles: ON agenda, OFF desagenda; boot registra as skills ligadas
- [x] Auditoria completa (automation_audits) + ApprovalRecord (trava de transmissão)
- [x] MonthlyReportSkill (PDF mensal) — FD-2
- [x] UI de aprovação de pendências — FD-2
- [x] NFS-e ABRASF 2.0 + NfseImportSkill (parser + upload + lista) — FD-3a
- [ ] Teste com dados reais (Academia do Renan)

Cliente-piloto: Academia do Renan.

### Fases FD-3b → FD-9
- FD-3b: Monitoramento IMAP (caixa nfse@...) — coleta sem intervenção humana.
- FD-3c: Portal + OCR (adiado; `source` já preparado ADR-037).
- FD-4: Emissão de guias (DAS/ISS/DARF) com memória de cálculo.
- FD-5: Faturamento CNAB 240/400 + régua de cobrança.
- FD-6: SPED/obrigações + certificado A1 criptografado.
- FD-7: Integração com Domínio/Questor/Sage.
- FD-8: Legalização (cofre de senhas, procurações, eCAC) — AES-256-GCM (ADR-032).
- FD-9: DP (integração leve com folha existente — NÃO construir do zero).

### Regras inegociáveis (Regra de Ouro — ADR-030)
- A automação prepara, calcula, organiza e recomenda
- O humano aprova tudo que gera obrigação legal, pagamento ou transmissão
- Ações com riskLevel = LEGAL sempre passam por aprovação, mesmo com score 100%

### Stack utilizada (FD)
- Backend: NestJS 10 + @nestjs/schedule + cron + Prisma (módulo digital-employee)
- Frontend: /dashboard/funcionario-digital (Next.js 16 + Zustand + Axios)
- RPA (fases futuras): Playwright • Cofres: AES-256-GCM (chave em env, nunca em código)