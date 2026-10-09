# 🎯 RADAR CONTA CERTA

<div align="center">

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-10-red?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=for-the-badge)
![Sprints](https://img.shields.io/badge/Sprints_Entregues-32+-f97316?style=for-the-badge)

**O cérebro digital do escritório contábil**

*Um SaaS que transforma 4 horas de trabalho manual em 15 minutos — do extrato do banco ao DRE do cliente, com segurança, rastreabilidade e automação inteligente.*

</div>

---

## 📌 Resumo Executivo

O **Radar Conta Certa** é um SaaS multi-tenant que automatiza a rotina contábil de ponta a ponta:

| Antes (manual) | Com o Radar |
|---|---|
| Digitar extrato: 2-4h/cliente | Importar CSV: 10 segundos |
| Classificar lançamentos: 1-2h | Automático (memória de aprendizado) |
| Conferir Pix × NF-e: 1-3h | Motor de score com confiança % |
| Montar DRE no Excel: 1h | 1 clique (exporta CSV/PDF) |

---

## 🗺️ Mapa do Sistema
┌─────────────────────────────────────────────────────────────┐
│ 📊 OPERACIONAL │
│ Dashboard • Pessoas/Turnover • Clientes • Projetos/Tarefas │
├─────────────────────────────────────────────────────────────┤
│ 💼 COMERCIAL │
│ Precificação • Propostas • Planos (START/PRIME/BLACK) │
├─────────────────────────────────────────────────────────────┤
│ 🧾 FISCAL │
│ NF-e • Estoque Kardex • Apuração ICMS • SPED Bloco H │
├─────────────────────────────────────────────────────────────┤
│ 🏦 BANCÁRIO │
│ Extrato CSV • Classificação c/ Memória • Fechamento Mensal │
├─────────────────────────────────────────────────────────────┤
│ 📒 CONTÁBIL │
│ Plano SCI • Partidas Dobradas • DRE Oficial • Export SCI │
├─────────────────────────────────────────────────────────────┤
│ 📈 INTELIGÊNCIA │
│ DRE Escritório • Ponto Fora da Curva • Simulador Tributário│
│ 🤖 AURORA (Funcionário Digital) • Score do Escritório │
├─────────────────────────────────────────────────────────────┤
│ 📧 COMUNICAÇÕES │
│ Watch Folder • Envio c/ Tracking • Templates • Retry │
└─────────────────────────────────────────────────────────────┘


---
## 🚀 Status Atual (Outubro/2026)

### ✅ Funcionalidades em Produção

#### 📧 Central de Envios com Tracking (Sprint OB-6)
- Watch folder monitora pasta `A_Processar/` e detecta novos arquivos automaticamente
- Parser extrai CNPJ do nome do arquivo e vincula ao cliente
- **Ponte automática** com módulo de Obrigações: arquivo detectado → obrigação correspondente marcada
- Aprovação humana obrigatória antes do envio (Human-in-the-loop)
- Envio real via SMTP (Gmail) com templates Handlebars editáveis
- **Tracking completo**: pixel de abertura + proxy de download
- Lote de obrigações exibe: Situação (CUMPRIDA/PENDENTE), Enviado, Aberto, Baixado com timestamps

####  Infraestrutura Cloudflare Tunnel
- 5 domínios públicos ativos via túnel criptografado:
  - `www.contacerta.com.br` → Site institucional (Vite, porta 5173)
  - `api.contacerta.com.br` → Backend do site (Node, porta 4000)
  - `radar.contacerta.com.br` → Frontend do Radar (Next.js 16, porta 3000)
  - `radar-api.contacerta.com.br` → API do Radar (NestJS, porta 3001)
  - `extrator.contacerta.com.br` → Frontend do Extrator Bancário (Vite, porta 5174)
- SSL automático, CDN global, proteção DDoS
- Túnel instalado como serviço do Windows (persistente)

#### 🛠️ Script Unificado de Inicialização
- `.\iniciar-radar.ps1` sobe todos os serviços com 1 comando
- Menu interativo: escolhe modo (dev/prod) e serviços opcionais (Site, Extrator)
- Liberação automática de portas (mata processos zumbis)
- Healthcheck do Postgres antes de subir apps
- Logs em arquivo para auditoria

---

## ️ Arquitetura

### Stack Tecnológica
- **Frontend Radar:** Next.js 16 (Turbopack) + TypeScript + Tailwind + Zustand + Lucide
- **Backend Radar:** NestJS + Prisma + PostgreSQL 16 (Docker)
- **Site Institucional:** React + Vite + TypeScript
- **Extrator Bancário:** FastAPI (Python) + Vite (React)
- **Infra:** Docker Desktop + Cloudflare Tunnel + Gmail SMTP

### Estrutura de Pastas
C:\radar-clone
├── backend/ # NestJS (porta 3001)
├── frontend/ # Next.js (porta 3000)
├── docs/adrs/ # 129 ADRs documentadas
├── Envios/
│ ├── A_Processar/ # Watch folder (entrada)
│ └── Enviados/ # Arquivos enviados (isolados por tenant/competência)
├── iniciar-radar.ps1 # Script unificado de boot
└── README.md
C:\Site conta-certa\ # Site institucional (porta 5173)


## ✨ Módulos e Funcionalidades

### 🔐 Segurança & Plataforma
- [x] Login JWT + refresh token, multi-tenant single-database (ADR-004)
- [x] RBAC em 3 camadas (Middleware + UI + RolesGuard)
- [x] Soft delete em entidades críticas

### 📊 Dashboard Executivo
- [x] KPIs em tempo real, gráficos CSS puro (ADR-001, zero deps pesadas)

### 💼 Comercial 2.0 (Plano 2.0 - Fase A)
- [x] Motor de herança de planos (ADR-020)
- [x] Simulador "Dinheiro na Mesa" (ADR-027)
- [x] Versionamento imutável de propostas (ADR-028)
- [x] White-label via CSS variables (ADR-043)
- [x] PDF v2 + PNG de capa no cliente (ADR-045, ADR-046)
- [x] Dashboard de desempenho comercial

### 👥 Pessoas (Fase B)
- [x] Tipos contratuais (CLT/Estagiário/Terceirizado/Sócio)
- [x] Distribuição por setor validada vs benchmark contábil
- [x] KPIs de novatos e colaboradores críticos
- [x] Entrevista de desligamento com motor intercambiável (ADR-050)
- [x] Benchmark de cargos por setor

### 📈 Mentoria e Gamificação (Fases C/D)
- [x] Benchmark de softwares e serviços extras
- [x] Indicadores customizados com parser AST seguro (ADR-054)
- [x] Score 0-100 do escritório (5 dimensões ponderadas, ADR-055)
- [x] Visão de Futuro e Checklist "Meu Plano"
- [x] Ranking de níveis (Bronze → Diamante)

### 🧾 Fiscal
- [x] Upload de NF-e em lote com parser XML 4.0
- [x] Estoque Kardex com custo médio ponderado móvel
- [x] Apuração de ICMS mensal + SPED Bloco H
- [x] Relatório H010 estendido (17 colunas com tributos)
- [x] Unificação de códigos por similaridade (Dice)

### 🏦 Bancário
- [x] Parser CSV multi-formato (separador, milhares BR/US, datas)
- [x] Classificação com memória de aprendizado
- [x] Naturezas dinâmicas por cliente
- [x] Fechamento mensal com trava de compliance

### 📒 Contábil
- [x] Plano de contas SCI 90113 (1.207 contas)
- [x] Ponte Bancário → Contábil (partida dobrada idempotente)
- [x] DRE Oficial do Cliente com confronto Contábil × Bancário
- [x] Exportação SCI-Único v3

### 🔗 Conciliação Inteligente (Sprint 29)
- [x] Motor de score: valor (60%) + nome Jaccard (30%) + data (10%)
- [x] Thresholds: 🟢 ≥80% / 🟡 50-79% / 🔴 <50%
- [x] Revisão humana obrigatória (ADR-030)

### 🤖 Aurora — Funcionário Digital
- [x] Skills: Conciliação, Classificação, Ponte Contábil, Relatório Mensal
- [x] Importação NFS-e (XML ABRASF com adaptadores, ADR-036)
- [x] Guias de imposto (DAS/ISS) com memória de cálculo (ADR-038)
- [x] Cofre AES-256-GCM para credenciais (ADR-032, ADR-059)
- [x] Régua de cobrança + CNAB 240 v1 (Itaú)
- [x] Central de Aprovações (régua 80/50)

###  Sistema de Envio com Tracking (Sprints F13-F17)
[x] Watch Folder via chokidar (ADR-113)
[x] Parser de CNPJ no nome do arquivo (ADR-118)
[x] Envio plugável: SendGrid / SMTP / MODO LOG (ADR-116)
[x] Tracking pixel 1x1 + link proxy determinístico (ADR-114)
[x] Templates Handlebars editáveis (ADR-115)
[x] Retry automático com backoff exponencial
[x] Aprovação humana obrigatória (ADR-117)

### 📋 Gestão de Obrigações Unificada (Sprints OB-1/OB-2)
[x] Página unificada com 5 abas (Visão Geral, Catálogo, Lotes, Por Cliente, Por Responsável)
[x] Modal completo de configuração com Watch Folder (ADR-123)
[x] Toggle dia fixo vs dia útil (1º, 2º, ..., 5º dia útil)
[x] Ordenação alfabética A-Z/Z-A
[x] Sincronização bidirecional cliente ↔ obrigações (ADR-122)
[x] Importação CSV de clientes com agrupamento por CNPJ (ADR-120)
[x] Schema alterado: `@@unique([companyId, cnpj])` permite filiais

### 🏦 Extrator Bancário (App Irmã em Python)
- [x] FastAPI + Mistral OCR como fallback universal (ADR-107)
- [x] Parsers nativos: Banrisul (stateful), Sicredi, BB, Itaú PJ
- [x] IA de regras contábeis (aprende com correções do contador)
- [x] CSV contábil padrão BR (UTF-8+BOM, delimitador `;`)

---

## 🏗️ Arquitetura

┌─────────────────────────────────────────┐
│ Frontend — Next.js 16 (App Router) │
│ React 19 + TypeScript + Tailwind │
│ Zustand • Sonner • Axios • Lucide │
└──────────────────┬──────────────────────┘
│ REST + JWT
┌──────────────────▼──────────────────────┐
│ Backend — NestJS 10 │
│ Controllers → Services → DTOs │
│ JwtAuthGuard • RolesGuard • RBAC │
└──────────────────┬──────────────────────┘
│ Prisma ORM
┌──────────────────▼──────────────────────┐
│ PostgreSQL 15+ (Multi-Tenant) │
│ ~80 tabelas • isolamento companyId │
│ Índices • Soft delete • Enums fortes │
└─────────────────────────────────────────┘
├─────────────────────────────────────────────────────────────┤
│ 📋 OBRIGAÇÕES │
│ Catálogo • Lotes • Watch Folder • Por Cliente • Por Resp. │


**Princípios adotados:**
- Multi-tenant single-database (ADR-004)
- Enums como fonte da verdade
- Idempotência por upsert (ADR-066/067)
- Revisão humana obrigatória (ADR-030)
- Cálculo tributário determinístico (ADR-031)
- Zero dependências pesadas de gráfico (ADR-001)

---

---

## 🚦 Como Iniciar (Desenvolvimento)

### Pré-requisitos
- Docker Desktop rodando
- Node.js 18+
- Python 3.11+ (apenas se usar Extrator)
- Cloudflare Tunnel instalado como serviço (apenas para acesso remoto)

### Inicialização Rápida
```powershell
cd C:\radar-clone
.\iniciar-radar.ps1
O script vai:
Subir o Postgres no Docker (porta 5433)
Liberar portas de processos zumbis
Iniciar Backend Radar (3001) + Frontend Radar (3000)
(Opcional) Site Conta Certa + Extrator Bancário


Acessos
Serviço
Local
Público
Radar Frontend
http://localhost:3000
https://radar.contacerta.com.br
Radar API
http://localhost:3001
https://radar-api.contacerta.com.br
Site Conta Certa
http://localhost:5173
https://www.contacerta.com.br
API do Site
http://localhost:4000
https://api.contacerta.com.br
Extrator
http://localhost:5174
https://extrator.contacerta.com.br

Credenciais Seed
Email: admin@contacerta.com.br
Senha: Trocar@2026


Documentação
ADRs: 129 decisões técnicas em docs/adrs/
Índice: docs/adrs/00-INDICE-ADRs.md
Inventário: docs/adrs/Inventário do Projeto.md

Testes
# Backend
cd C:\radar-clone\backend
npm run test

# Frontend
cd C:\radar-clone\frontend
npm run test


## 🚀 Instalação (3 passos)

```bash
# 1) Backend
cd backend && npm i && cp .env.example .env
npx prisma migrate deploy && npx prisma generate && npm run start:dev   # → :3001

# 2) Frontend
cd frontend && npm i && cp .env.example .env.local
npm run dev                                                              # → :3002

# 3) Acessar http://localhost:3002 e entrar com o usuário admin do seed
Boot unificado (Docker):

.\Iniciar-Tudo.ps1

🎨 Identidade Visual

🟩 Teal #0d9488                 🟧 Laranja #f97316         ⬜ Cinza #475569
Cor primária (ações, sidebar)    Destaques e alertas        Textos neutros


🗺️ Roadmap

✅ Concluído

Sprints 1-30: Fundação, BI, Fiscal, Bancário, Contábil, Conciliação
Sprint 31: Containerização (Docker Compose)
Sprint 32: Produção local (Cloudflare Tunnel)
Sprints A1-A7: Plano 2.0 — Ciclo Comercial completo
Sprints FD-1 a FD-8: Aurora (Funcionário Digital)
Sprints F13-F17: Sistema de Envio com Tracking completo
Extrator Bancário v1.0: Mistral OCR + parsers stateful

🔜 Próximos Passos

Sprint CT-1: Entrada de Dados Contábil (CSV/OFX) + Balancete Visual
Sprint F18: Portal do Cliente (download de documentos)
Sprint 33: CI/CD (GitHub Actions)
Sprint 34: Monitoramento (Sentry) + Backup automático

📚 Documentação

A documentação completa está organizada em:

🧠 CONTEXTO_PROJETO.md — Estado atual, stack, ADRs ativos, próximos passos
📋 CHANGELOG.md — Histórico cronológico de sprints
🤝 CONTRIBUTING.md — Padrões de código, commits, PRs
📂 docs/ — ADRs, módulos e sprints detalhadas

docs/adrs/ — Architecture Decision Records (67+ identificadas)
docs/modules/ — Documentação profunda de módulos complexos
docs/sprints/ — Histórico detalhado de sprints específicas

📖 Glossário

Termo                      Significado
SaaS                       Software assinado e usado pela internet
Multi-tenant               Vários escritórios no mesmo sistema, isolamento por tenant
DRE                        Demonstração do Resultado do Exercício
NF-e                       Nota Fiscal eletrônica (XML oficial)
Kardex                     "Extrato do estoque" com custo médio
SPED                       Arquivo oficial exigido pela Receita Federal
Partidas dobradas          Regra contábil: todo débito tem um crédito igual
Conciliação                Conferir se o que saiu no banco bate com a nota fiscal
Score                      Nota de confiança (0-100%) do motor de matching

🤝 Licença & Autor
Proprietary License — Copyright © 2026 Conta Certa Soluções Empresariais.
👨‍💻 Autor: Marcos Toledo — Desenvolvedor Full Stack
📧 Contato: dev@contacerta.com.br
🌐 Website: www.contacerta.com.br
<div align="center">

Feito com ❤️ para transformar a contabilidade brasileira
</div>