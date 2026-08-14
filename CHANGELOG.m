# Changelog — Radar Conta Certa
Formato: Keep a Changelog. Sprints 1–30 reconstruídos da documentação do projeto.

## [Sprint A1 — Plano 2.0] 2026-08
### Added
- Domínio puro de herança de planos e matemática de preço (3 arquivos + 6 testes).
### Decisions
- ADR-020 (herança em memória, independente isolado, round2).

## [Sprint 31] 2026-08 — Containerização
### Added
- docker-compose.yml (postgres 5433, backend 3001, frontend 3000, volume pgdata).
- backend/Dockerfile (multi-stage + `prisma migrate deploy` no boot), backend/.dockerignore.
- frontend/Dockerfile (standalone), frontend/.dockerignore, next.config `output: "standalone"`.
### Fixed (erros TS do build de produção)
- revisao/page.tsx: +handleSelectDebit/Credit e handleClearDebit/Credit.
- revisao/page.tsx: Lucide `title` → wrapper `<span title>` (ADR-021).
- Removido `layout copy.tsx` (backup quebrava o build; ADR-022).
- layout.tsx: `item.children?.map` (ADR-023).
- planejamento/page.tsx: Sonner cancel com `onClick` (ADR-024).

## [Sprints 26–30] 2026 — Hardening e UX
- Soft deletes, validações de DTO, índices, empty states, confirmações Sonner,
  paginação/otimizações, tendências de propostas.

## [Sprints 22–25] 2026 — Módulos operacionais (vantagem competitiva)
- Fiscal (NF-e/estoque/ICMS/SPED) • Bancário (extrato/conciliação) •
  Operações (projetos/tarefas) • SCI/contábil.

## [Sprints 18–21] 2026 — Ciclo comercial v1
- Carteira de Clientes (MRR/Churn/Ticket) • Propostas (wizard, link público,
  tracking) • PDF/Excel de propostas • Regras de horas + calculadora.

## [Sprints 13–17] 2026 — BI e administração
- DRE gerencial • Ponto fora da curva • Simulador tributário •
  Planos comerciais v1 (multiplicadores) • Painel Admin.

## [Sprints 8–12] 2026 — Identidade e módulos de gestão
- Rebranding Conta Certa + Sonner • Precificação • Planejamento •
  Minha Empresa • CSV UTF-8+BOM (ADR-002).

## [Sprints 1–7] 2026 — Fundação
- Monorepo • Auth multi-tenant JWT+refresh • Frontend Next.js+Zustand •
- Dashboard executivo (gráficos CSS, ADR-001) • Pessoas/Turnover • Clientes.