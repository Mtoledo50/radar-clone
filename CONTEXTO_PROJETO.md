# 🧠 CONTEXTO_PROJETO.md — Radar Conta Certa
> Arquivo de injeção de contexto. Cole INTEIRO no início de toda conversa nova.
> Última atualização: 14/08/2026 (pós-Sprint 31 + Sprint A1 do plano 2.0).

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
- Docker Desktop já teve daemon.json corrompido (\x00); resolvido com reset completo
  (wsl --shutdown + remoção de .docker/AppData + reboot).

## 5) MÓDULOS ENTREGUES (operacionais)
Auth multi-tenant • Dashboard executivo (gráficos CSS puro) • Pessoas/Turnover •
Clientes • Carteira de Clientes (MRR/Churn/Ticket) • Precificação (horas, regras,
calculadora, planos START/PRIME/BLACK, propostas c/ link público + tracking + PDF/Excel) •
Planejamento (metas/KPIs/ações) • Minha Empresa • BI (DRE gerencial, ponto fora da
curva, simulador tributário) • Fiscal (NF-e/estoque/ICMS/SPED) • Bancário (extrato,
conciliação) • Operações (projetos/tarefas) • Admin • Exportação CSV UTF-8+BOM.

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
Sprint A1 CONCLUÍDA: domínio puro testado (6 testes verdes).
Sprint 31 (Docker) HOMOLOGADA: ambiente estável.
Sprint A2 COMPLETA: GET /resolved + POST /insights (Dinheiro na Mesa R$ 19.200/ano validado).
Sprint A3 HOMOLOGADA: versões de proposta (version/isCurrent/originalProposalId + endpoints de listagem e duplicação).
IMEDIATO: Sprint A4 = Fechamento com Ganho (desconto + argumento de venda).
  - Endpoint: POST /proposals/:id/close com desconto e cálculo de ganho vs preço cheio.
  - Frontend: modal de fechamento com slider de desconto e "quanto você ganhou".
DEPOIS: A5→A7, Fases B→E (ordem do §7).
Sprint FD-1 CONCLUÍDA (15/08/2026): Funcionário Digital Aurora — fundação completa
(6 tabelas, módulo digital-employee, orquestrador, auditoria, ReconciliationSkill e
dashboard em /dashboard/funcionario-digital).
IMEDIATO: FD-2 = ClassificationSkill + AccountingBridgeSkill + crons em produção controlada.
DEPOIS: FD-3→FD-9 (ver FUNCIONARIO_DIGITAL.md) • A4→A7 e Fases B→E (ordem do §7).


## 10) COMANDOS ÚTEIS (PowerShell)
docker compose up -d --build | docker compose ps | docker compose logs -f backend
npm run test -- --testPathPattern=plan-inheritance (backend)

## 11) INSTRUÇÃO PARA A NOVA IA
Leia este arquivo, confirme com "Yes", e continue EXATAMENTE do §9.
Não reimplementar sprints concluídos; não mudar stack; seguir método do §1.

### 🤖 FUNCIONÁRIO DIGITAL AURORA (Sprint FD-1 concluída em 15/08/2026)

**Status atual:** Backend 100% funcional (orquestador + auditoria + 1ª skill)
**Próximo passo:** Dashboard frontend (Passo 4/6 em andamento)
**Cliente-piloto:** Academia do Renan

#### Módulos entregues
- [x] **FD-1 Fundação**: 6 tabelas Prisma, módulo NestJS completo, endpoint "Rodar agora"
- [x] **ReconciliationSkill**: reusa motor da Sprint 29, auto-aprova score ≥80%, fila 50-79%
- [x] **Auditoria completa**: toda ação registrada em `automation_audits`

#### Em desenvolvimento (FD-1 frontend)
- [ ] Dashboard da Aurora (header + KPIs + timeline + fila + skills + audit)

#### Próximas fases (FD-2 a FD-9)
- [ ] **FD-2**: ClassificationSkill + AccountingBridgeSkill + Relatórios PDF mensais
- [ ] **FD-3**: Importação automática NFS-e (e-mail + portal + OCR)
- [ ] **FD-4**: Emissão de guias (DAS/ISS/DARF) com memória de cálculo
- [ ] **FD-5**: Faturamento CNAB 240/400 + régua de cobrança
- [ ] **FD-6**: SPED/obrigações + certificado A1 criptografado
- [ ] **FD-7**: Integração com Domínio/Questor/Sage
- [ ] **FD-8**: Legalização (cofre de senhas, procurações, eCAC)
- [ ] **FD-9**: DP (integração leve com folha existente — NÃO construir do zero)

#### Regras inegociáveis (Regra de Ouro)
- A automação **prepara, calcula, organiza e recomenda**
- O humano **aprova** tudo que gera obrigação legal, pagamento ou transmissão
- Ações com `riskLevel = LEGAL` **sempre** passam por aprovação, mesmo com score 100%

#### Stack utilizada (FD-1)
- Backend: NestJS 10 + `@nestjs/schedule` + `cron` + Prisma
- Worker RPA: Playwright (em fases futuras)
- Cofres: AES-256-GCM (chave em env, nunca em código)