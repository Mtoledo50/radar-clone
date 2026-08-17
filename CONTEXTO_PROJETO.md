# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa
> Arquivo de injeção de contexto. Cole INTEIRO no início de toda conversa nova.
> Última atualização: 17/08/2026 (pós-Sprint FD-2 parcial — Aurora autônoma com crons ativos).

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
curva, simulador tributário) • Fiscal (NF-e/estoque/ICMS/SPED) • Bancário (extrato,
conciliação) • Operações (projetos/tarefas) • Admin • Exportação CSV UTF-8+BOM •
🤖 Funcionário Digital Aurora (conciliação/classificação/ponte + dashboard + auditoria + crons).

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
- Fase A (Comercial): A1 herança de planos ✅(domínio) • A2 valor ref. + dinheiro na
  mesa • A3 versões de proposta • A4 fechamento c/ ganho • A5 white-label • A6 PDF v2+PNG • A7 dashboard desempenho.
- Fase B (Pessoas): B1 tipos contratuais • B2 distribuição por setor validada •
  B3 KPIs novatos/crítico • B4 entrevista de desligamento (IA) • B5 cargos p/ setor.
- Fase C (Mercado): C1 benchmark softwares • C2 serviços extras c/ preço médio •
  C3 indicadores c/ fórmula • C4 score 0–100.
- Fase D (Mentoria): D1 Visão de Futuro • D2 checklist/Meu Plano • D3 ranking níveis.
- Fase E (UX): E1 command palette • E2 boas-vindas/"onde parou" • E3 notificações.

## 8) ADRs ATIVOS (resumo)
ADR-001 Gráficos CSS puro (Recharts incompatível c/ React 19+Turbopack).
ADR-002 CSV com UTF-8+BOM (acentos no Excel).
ADR-003 Zustand persist p/ SSR seguro.
ADR-004 Multi-tenant single-database por companyId.
ADR-020 Herança de planos derivada em memória; independente não herda E não doa;
        ordem por multiplicador; preços com round2.
ADR-021 Ícones Lucide: tooltip via <span title> wrapper (title não existe no tipo).
ADR-022 Proibido arquivo de backup dentro de src/ (quebra next build).
ADR-023 Optional chaining (?.) em .map de opcionais no JSX.
ADR-024 Sonner: action/cancel exigem onClick (usar () => {} p/ só fechar).
ADR-030 Regra de Ouro: ações riskLevel=LEGAL nunca são AUTO (aprovação humana sempre).
ADR-031 Cálculo tributário determinístico no backend; IA apenas sugere/classifica.
ADR-032 LGPD: cofres de credenciais AES-256-GCM (implementação em FD-8).
ADR-033 Perfis de aprovação por tipo de tarefa (Auxiliar/Analista/Supervisor/Contador).
ADR-034 Arquivos estruturais (app.module.ts, schema.prisma): entregar sempre o delta.

9) STATUS ATUAL E PRÓXIMOS PASSOS

### ✅ Concluído
- **Sprint A1**: domínio puro testado (6 testes verdes)
- **Sprint 31 (Docker)**: ambiente estável
- **Sprint A2**: GET /resolved + POST /insights (Dinheiro na Mesa R$ 19.200/ano validado)
- **Sprint A3**: versões de proposta (version/isCurrent/originalProposalId + endpoints)
- **FD-1 Fundação**: 6 tabelas + dashboard + menu lateral + crons ↔ toggles
- **FD-2 Parcial**: 3 skills (RECONCILIATION, CLASSIFICATION, ACCOUNTING_BRIDGE) + Central de Aprovações
- **Entrega C**: Aurora em produção controlada com dados reais

### 🎯 Entrega C — Aurora operacional (17/08/2026)
- **98 clientes reais** importados do CSV de honorários
- **18 transações bancárias** criadas (seed de demonstração)
- **CLASSIFICATION**: 18 items processados, 18 auto-aprovados, 540 segundos salvos
- **RECONCILIATION**: executada (sem NF-e - comportamento esperado)
- **ACCOUNTING_BRIDGE**: executada (skipped - mês não fechado - trava funcionando)
- **Auditoria completa** registrada

### 🚀 IMEDIATO
Escolher entre:
- **Opção A**: MonthlyReportSkill (PDF mensal automático dos clientes)
- **Opção B**: Seed de NF-e + fechamento bancário para testar RECONCILIATION + ACCOUNTING_BRIDGE com dados reais

### 📋 DEPOIS
- FD-3: Importação automática NFS-e (e-mail + portal + OCR)
- FD-4: Emissão de guias (DAS/ISS/DARF) com memória de cálculo
- FD-5: Faturamento CNAB 240/400 + régua de cobrança
- FD-6: SPED/obrigações + certificado A1 criptografado
- FD-7: Integração com Domínio/Questor/Sage
- FD-8: Legalização (cofre de senhas, procurações, eCAC)
- FD-9: DP leve (integração com folha existente)
- A4→A7 e Fases B→E (ordem do §7)

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

### Status atual (17/08/2026)
- [x] FD-1 Fundação: 6 tabelas Prisma + módulo NestJS completo + endpoint "Rodar agora"
- [x] Dashboard /dashboard/funcionario-digital + item de menu 🤖 (seção INTELIGÊNCIA)
- [x] ReconciliationSkill: reusa motor da Sprint 29 (≥80% auto, 50–79% fila 🟡)
- [x] ClassificationSkill: memória de aprendizado via BankingService.classify
- [x] AccountingBridgeSkill: ponte via AccountingService.promoteFromBanking
- [x] Crons ↔ toggles: ON agenda, OFF desagenda; boot registra as skills ligadas
- [x] Auditoria completa (automation_audits) + ApprovalRecord (trava de transmissão)
- [ ] MonthlyReportSkill (PDF mensal)
- [ ] UI de aprovação de pendências
- [ ] Teste com dados reais (Academia do Renan)

Cliente-piloto: Academia do Renan.

### Fases FD-2 final → FD-9
- FD-2 final: MonthlyReportSkill + UI de pendências + teste com dados reais
- FD-3: Importação automática NFS-e (e-mail + portal + OCR)
- FD-4: Emissão de guias (DAS/ISS/DARF) com memória de cálculo
- FD-5: Faturamento CNAB 240/400 + régua de cobrança
- FD-6: SPED/obrigações + certificado A1 criptografado
- FD-7: Integração com Domínio/Questor/Sage
- FD-8: Legalização (cofre de senhas, procurações, eCAC) — AES-256-GCM (ADR-032)
- FD-9: DP (integração leve com folha existente — NÃO construir do zero)

### Regras inegociáveis (Regra de Ouro — ADR-030)
- A automação prepara, calcula, organiza e recomenda
- O humano aprova tudo que gera obrigação legal, pagamento ou transmissão
- Ações com riskLevel = LEGAL sempre passam por aprovação, mesmo com score 100%

### Stack utilizada (FD)
- Backend: NestJS 10 + @nestjs/schedule + cron + Prisma (módulo digital-employee)
- Frontend: /dashboard/funcionario-digital (Next.js 16 + Zustand + Axios)
- RPA (fases futuras): Playwright • Cofres: AES-256-GCM (chave em env, nunca em código)