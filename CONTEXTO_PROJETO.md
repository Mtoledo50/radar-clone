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

9) STATUS ATUAL E PRÓXIMOS PASSOS
Sprint A1 CONCLUÍDA: domínio puro testado (6 testes verdes).
Sprint 31 (Docker) HOMOLOGADA: ambiente estável.
Sprint A2 COMPLETA: GET /resolved + POST /insights (Dinheiro na Mesa R$ 19.200/ano validado).
Sprint A3 HOMOLOGADA: versões de proposta (version/isCurrent/originalProposalId + endpoints de listagem e duplicação).
IMEDIATO: Sprint A4 = Fechamento com Ganho (desconto + argumento de venda).
  - Endpoint: POST /proposals/:id/close com desconto e cálculo de ganho vs preço cheio.
  - Frontend: modal de fechamento com slider de desconto e "quanto você ganhou".
DEPOIS: A5→A7, Fases B→E (ordem do §7).


## 10) COMANDOS ÚTEIS (PowerShell)
docker compose up -d --build | docker compose ps | docker compose logs -f backend
npm run test -- --testPathPattern=plan-inheritance (backend)

## 11) INSTRUÇÃO PARA A NOVA IA
Leia este arquivo, confirme com "Yes", e continue EXATAMENTE do §9.
Não reimplementar sprints concluídos; não mudar stack; seguir método do §1.