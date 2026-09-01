# 🎯 Radar Conta Certa — SaaS de Gestão para Escritórios Contábeis

<div align="center">

![status](https://img.shields.io/badge/status-produção_beta-yellow) ![Next](https://img.shields.io/badge/Next.js-16.2-black) ![React](https://img.shields.io/badge/React-19-blue) ![Nest](https://img.shields.io/badge/NestJS-10-red) ![Prisma](https://img.shields.io/badge/Prisma-5-blue) ![PG](https://img.shields.io/badge/PostgreSQL-15-blue)

**Dois produtos em uma plataforma: a gestão do escritório contábil e a operação mensal completa dos seus clientes.**

</div>

---

## 📖 Sobre o Projeto

O **Radar Conta Certa** é um SaaS multi-tenant desenvolvido para a **Conta Certa Soluções Empresariais**. Ele resolve dois problemas centrais de um escritório contábil:

### 🏢 Produto 1 — Gestão do Escritório
Centraliza **clientes, contratos e honorários**, mostra **onde o escritório perde dinheiro** e transforma serviços prestados em **planos monetizáveis** (precificação por horas, complexidade e margem).

### 📒 Produto 2 — Operação Mensal do Cliente
Automatiza a rotina contábil de cada cliente em um fluxo linear e auditável:

```
1. Plano de Contas → 2. Ciclo Contábil → 3. Importar Extrato →
4. Conciliação → 5. Extrato/Razão + DRE → 6. Guias + Exportar SCI
```

---

## 🧭 Rotina Contábil Mensal (fluxo central)

| Passo | Tela | Rota | O que faz |
|---|---|---|---|
| 1 | Plano de Contas (SCI) | `/dashboard/contabil/plano-contas` | Planos por cliente (ADR-072) |
| 2 | Ciclo Contábil | `/dashboard/contabil/ciclo-contabil` | Balancete inicial + Razão/Livro Caixa |
| 3 | Integração SCI | `/dashboard/contabil` | Importa extrato (CSV ou ponte bancária) — **idempotente** |
| 4 | Conciliação | Automática na Integração + Manual em `/dashboard/lancamentos/revisao` | Sugestões por histórico + busca por **código unificado** |
| 5 | Extrato / Razão Analítico | `/dashboard/contabil/extrato` | Consulta, filtros e impressão PDF |
| 6 | DRE, Guias e SCI | `/dashboard/bi/dre-cliente` + Integração | DRE/Balancete PDF white-label + TXT p/ SCI-Único |

O **FlowStepper** (barra visual no topo da Integração SCI) guia o contador pelo fluxo com status real de cada passo — sem "telas misteriosas".

---

## 🗂️ Módulos do Sistema

| Área | Módulo | Rotas principais |
|---|---|---|
| Operacional | Dashboard Executivo, Minha Empresa, Pessoas/Turnover, Carteira de Clientes, Projetos/Tarefas | `/dashboard`, `/dashboard/clientes`, `/dashboard/pessoas` |
| Comercial | Precificação, Propostas, Planos, Planejamento | `/dashboard/precificacao/*`, `/dashboard/planejamento` |
| Contábil | Plano de Contas, Ciclo Contábil, Integração SCI, Extrato/Razão, Conciliação, Lançamentos | `/dashboard/contabil/*`, `/dashboard/lancamentos/*` |
| Fiscal | NF-e, NFS-e, Estoque, Apuração ICMS, SPED | `/dashboard/fiscal/*` |
| Bancário | Fechamento Mensal, Naturezas, DRE Bancário, Cobrança CNAB | `/dashboard/fechamento`, `/dashboard/funcionario-digital/cobranca` |
| Inteligência | Aurora (Funcionário Digital), Relatórios PDF, Guias, BI, DRE do Escritório/Cliente, Score | `/dashboard/funcionario-digital/*`, `/dashboard/bi/*` |
| Cliente Final | Portal do Cliente (token seguro, 90 dias) | `/portal/[token]` |
| Sistema | Administração (empresas, usuários, catálogo) | `/dashboard/admin/*` |

---

## 🧠 Decisões de Arquitetura (ADRs)

| ADR | Decisão |
|---|---|
| 004 | Multi-tenant single-database com isolamento por `companyId` |
| 030 | Regra de Ouro: ações com risco legal **nunca** são automáticas (human-in-the-loop) |
| 066/067 | Reimportação idempotente (overlap + anti-duplicidade) |
| 070/072 | Plano de contas SCI por cliente, com código unificado (`seq`/`reducedCode`) |
| 075 | Layout oficial de exportação SCI-Único v3 (TAB, UTF-8 BOM, contas 8 dígitos) |
| 076 | **Importação de extrato idempotente**: auto-limpeza de duplicados PENDENTES + bloqueio de linhas já existentes |
| 077 | **Cliente Ativo**: contexto global persistido (Zustand) — todas as telas da rotina abrem com o cliente em trabalho |
| 078 | **Ponte Bancário→Contábil**: o Fechamento Mensal alimenta o contábil sem reimportar CSV |
| 079 | **Busca unificada de contas**: nome + classificação + unificado + SCI + reduzido (ignora pontuação) |
| 097 | Motor de PDF white-label no backend (`@react-pdf/renderer`) com cores do tenant |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind, Zustand (persist), Sonner, Lucide, jsPDF |
| Backend | NestJS 10, TypeScript, Prisma 5, JWT, class-validator, bcrypt, `@react-pdf/renderer`, csv-parser |
| Banco | PostgreSQL 15+ |
| Infra | Node 20+, npm, Git |

---

## 🚀 Instalação

```bash
# Backend
cd backend
npm install
cp .env.example .env          # DATABASE_URL, JWT_SECRET, PORT=3001
npx prisma generate
npx prisma migrate deploy
npm run seed                  # popula dados de teste
npm run start:dev

# Frontend
cd frontend
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

**Credenciais (seed):** `admin@contacerta.com.br` / `Admin@123456`

> ⚠️ **Nota técnica:** o backend usa JSX nos templates de PDF. O `tsconfig.json` do backend **deve** conter `"jsx": "react"` e `@types/react` em devDependencies.

---

## 📂 Estrutura de Pastas (principais)

```text
radar-clone/
├── frontend/src/
│   ├── app/dashboard/
│   │   ├── contabil/            # Integração SCI, ciclo, plano, extrato
│   │   ├── lancamentos/revisao/ # Conciliação Manual + Automática
│   │   ├── fechamento/          # Fechamento Mensal (bancário)
│   │   ├── fiscal/  bi/  funcionario-digital/  clientes/  precificacao/
│   ├── components/contabil/FlowStepper.tsx
│   └── store/{authStore,clientContextStore}.ts
├── backend/src/
│   ├── accounting/   # history, import, reconciliation, ledger, trial-balance, smart-import
│   ├── banking/      # fechamento mensal, naturezas, DRE bancário
│   ├── reports/      # templates PDF (DRE, Balancete, Proposta)
│   ├── fiscal/  digital-employee/  clients/  pricing/  ...
│   └── prisma/{schema.prisma,seed.ts}
```

---

## 🗺️ Roadmap

- ✅ **Fases 1–2** — Fundação + BI Contábil
- ✅ **Fase 3** — Fiscal, Bancário, Aurora, Portal do Cliente
- ✅ **Fase 4** — Projetos/Tarefas + Portal com DRE real
- ✅ **Fase 5** — Relatórios PDF white-label + reorganização do fluxo contábil (ADRs 076–079)
- 🔜 **Fase 6** — Envio automático de PDFs por e-mail, integrações Domínio/Questor, CI/CD + deploy, testes automatizados

---

<div align="center">Feito com ❤️ pela equipe Conta Certa • Copyright © 2026</div>