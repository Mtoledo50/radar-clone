# 🐳 Sprint 31: Containerização e Blindagem de Ambiente

**Data:** 29/09/2026 | **Status:** ✅ HOMOLOGADA

## 🎯 Objetivo
Empacotar o sistema em containers para garantir consistência entre ambientes (local e produção) e eliminar o "funciona na minha máquina".

## 📦 O que foi entregue
- `docker-compose.yml` unificado (Postgres 5433, Backend 3001, Frontend 3000).
- `backend/Dockerfile`: Multi-stage com `node:20-slim` + OpenSSL (evita erro de Prisma no Alpine).
- `frontend/Dockerfile`: Multi-stage com `output: "standalone"` do Next.js.
- Script `Iniciar-Tudo.ps1` reescrito: mata processos por porta, aguarda healthcheck do Postgres, não mata containers Docker.

## 🛠️ Correções de Build (Dívida Técnica)
- Removido `layout copy.tsx` (quebrava o build, ADR-022).
- Corrigido `item.children?.map` com optional chaining (ADR-023).
- Corrigido Sonner `cancel` exigindo `onClick` (ADR-024).
- Removido `charset` do Metadata do Next 16 (já é UTF-8 por padrão).
- Arquivado código órfão `TaxAnalysis` (Express não plugado no Nest).

## 🧠 Decisões Técnicas (ADRs)
- **ADR-025:** Scripts de infra em ASCII puro (PowerShell 5.1 corrompe Unicode).
- **ADR-027:** Boot em 2 modos (dev/prod); Cloudflare Tunnel adiado para Sprint 32.
- **Postgres:** Porta 5433 no Docker para não conflitar com o Postgres local (5432) do Marcos.

## 📂 Localização do Código
- Raiz: `docker-compose.yml`, `Iniciar-Tudo.ps1`
- Backend: `backend/Dockerfile`, `backend/.dockerignore`
- Frontend: `frontend/Dockerfile`, `frontend/next.config.mjs`