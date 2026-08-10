# 🎯 Radar Conta Certa

<div align="center">

![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-Proprietary-green)

**Sistema SaaS Enterprise de gestão empresarial para escritórios contábeis**

[🚀 Começar](#-instalação) • [📖 Documentação](#-documentação) • [🗺️ Roadmap](#️-roadmap) • [📞 Suporte](#-suporte)

</div>

---

## 📖 Sobre

O **Radar Conta Certa** é uma plataforma SaaS completa que transforma a gestão de escritórios contábeis. Desenvolvido com arquitetura Enterprise (multi-tenant, RBAC, catálogo dinâmico), permite administrar clientes, colaboradores, propostas comerciais e inteligência de negócios em uma única interface moderna.

### 🎯 Para quem é?

- **Escritórios contábeis** que querem escalar operações
- **Contadores** que precisam de precificação inteligente
- **Gestores** que buscam BI contábil integrado
- **Equipes** que precisam de automação de processos

### ✨ Diferenciais

| Recurso | Benefício |
|---------|-----------|
| 🛡️ **Multi-Tenant Seguro** | Isolamento total por empresa com RBAC em 3 camadas |
| 📦 **Catálogo Dinâmico** | Venda MEI, IRPF, serviços avulsos com escopo detalhado |
| 💼 **Motor de Contratos** | Propostas → Contratos → Clientes em fluxo automatizado |
| 📊 **BI Contábil** | DRE, Ponto Fora da Curva e Simulador Tributário nativos |
| 🎲 **Dados Demo** | 12 meses de dados fictícios para demonstrações comerciais |

---

## 🚀 Principais Funcionalidades

### 🔐 Segurança & Acesso
- ✅ Autenticação JWT com refresh token
- ✅ Proteção de rotas em 3 camadas (Middleware + UI + RolesGuard)
- ✅ RBAC com decorator `@Roles('ADMIN')`
- ✅ Soft Delete (preserva histórico contábil)
- ✅ Multi-tenant single-database

### 📊 Dashboards & BI
- ✅ Dashboard executivo com KPIs em tempo real
- ✅ Admin Overview (visão estratégica do sistema)
- ✅ DRE Gerencial Visual
- ✅ Ponto Fora da Curva (detecção de anomalias)
- ✅ Simulador de Regimes Tributários

### 💼 Comercial
- ✅ **Motor de Propostas**: Wizard de 5 passos com calculadora em tempo real
- ✅ **Funil de Vendas**: DRAFT → SENT → VIEWED → CLOSED_WON / CLOSED_LOST
- ✅ **Catálogo Rico**: Serviços com escopo, fora-do-escopo, SLA e documentos
- ✅ **Planos Comerciais**: START, PRIME, BLACK com multiplicadores
- ✅ **Link Público**: Propostas compartilháveis com tracking de engajamento

### 👥 Gestão
- ✅ **Clientes**: Onboarding em 3 etapas (Empresa → Plano → Add-ons)
- ✅ **Colaboradores**: CRUD + controle de turnover
- ✅ **Lançamentos Contábeis**: Plano de contas hierárquico
- ✅ **Planejamento Estratégico**: OKRs, metas e planos de ação

### 🛠️ Administrativa
- ✅ **Admin de Catálogo**: CRUD completo de categorias, serviços e planos
- ✅ **Painel Super Admin**: Gestão de empresas e usuários (multi-tenant)
- ✅ **Onboard Automático**: Cria empresa + usuário admin em transação

---

## 🛠️ Stack Tecnológica

<div align="center">

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | Next.js + React + TypeScript | 16 + 19 + 5.x |
| **Estilização** | Tailwind CSS | 3.x |
| **Estado** | Zustand + localStorage | 4.x |
| **Notificações** | Sonner | 1.x |
| **Backend** | NestJS + TypeScript | 10 + 5.x |
| **ORM** | Prisma | 5.x |
| **Banco** | PostgreSQL | 15+ |
| **Auth** | JWT + bcrypt | - |

</div>

---

## 🏗️ Arquitetura

### Visão Geral
┌─────────────────────────────────────────┐
│ Frontend (Next.js 16 + React 19) │
│ Tailwind + Zustand + Sonner + Axios │
└──────────────────┬──────────────────────┘
│ HTTP/REST
▼
┌─────────────────────────────────────────┐
│ Backend (NestJS 10 + TypeScript) │
│ Controllers + Services + DTOs + Guards │
└──────────────────┬──────────────────────┘
│ Prisma ORM
▼
┌─────────────────────────────────────────┐
│ PostgreSQL (Multi-Tenant) │
│ Tabelas isoladas por companyId │
└─────────────────────────────────────────┘


### 🛡️ Camadas de Segurança (Defense in Depth)

| Camada | Onde roda | Função |
|--------|-----------|--------|
| **1. Middleware Next.js** | Borda (Edge) | Redireciona não-admins (UX rápida) |
| **2. Sidebar Dinâmica** | UI | Esconde itens admin do menu |
| **3. RolesGuard (NestJS)** | Backend | Validação real (fonte da verdade) |

### 📁 Estrutura do Projeto
radar-clone/
├── 📂 frontend/ # Next.js 16
│ └── src/
│ ├── app/
│ │ ├── dashboard/ # Área logada
│ │ │ ├── admin/ # Painel admin (Overview + Catálogo)
│ │ │ ├── clientes/ # Motor de onboarding
│ │ │ ├── precificacao/# Motor de propostas
│ │ │ ├── bi/ # Business Intelligence
│ │ │ └── ...
│ │ ├── login/
│ │ ├── forbidden/ # Página 403
│ │ └── proposta/[slug]/ # Link público
│ ├── middleware.ts # Proteção de rotas
│ ├── lib/axios.ts
│ └── store/authStore.ts
│
├── 📂 backend/ # NestJS 10
│ ├── prisma/
│ │ ├── schema.prisma # ~30 tabelas
│ │ └── seed.ts # Catálogo rico
│ └── src/
│ ├── admin/ # Super Admin
│ ├── auth/ # JWT + Guards
│ ├── client/ # Clientes + Contratos
│ ├── commercial-plans/ # Catálogo Enterprise
│ ├── proposals/ # Propostas comerciais
│ ├── common/ # Decorators + Guards
│ └── ...
│
└── README.md


---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ (recomendado 20+)
- PostgreSQL 15+
- npm 9+

### Passo a Passo

**1. Clonar e preparar**
```bash
git clone https://github.com/seu-usuario/radar-conta-certa.git
cd radar-conta-certa

2. Configurar Backend
cd backend
npm install
cp .env.example .env

# Editar .env com suas credenciais PostgreSQL
# DATABASE_URL="postgresql://user:pass@localhost:5432/radar_conta_certa"

npx prisma generate
npx prisma migrate deploy
npx prisma db seed              # (Opcional) dados iniciais
npm run start:dev               # http://localhost:3001

3. Configurar Frontend
bash

cd ../frontend
npm install
cp .env.example .env.local

# NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev                     # http://localhost:3000

🎲 Usar Dados de Demonstração
Para uma demo completa com 28 clientes, 15 propostas e 12 meses de histórico:
cd backend
npx ts-node src/seed-demo.ts

Credenciais de acesso:
📧 Email: admin@demo.com
🔑 Senha: 123456

🔐 Variáveis de Ambiente
Backend (backend/.env)
# Banco
DATABASE_URL="postgresql://user:pass@localhost:5432/radar_conta_certa?schema=public"

# JWT
JWT_SECRET="sua-chave-super-segura"
JWT_EXPIRATION="7d"

# App
PORT=3001
NODE_ENV=development

Frontend (frontend/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="Radar Conta Certa"

📜 Scripts
Backend                              
Comando                     Descrição
npm run start:dev           Servidor em modo dev (watch)
npm run build               Build de produção
npm run start:prod          Servidor em produção
npx prisma migrate dev      Criar migração
npx prisma studio           GUI do banco
npm run seed:demo           Dados fictícios

Frontend

Comando                      Descrição
npm run dev                  Dev server (Turbopack)
npm run build                Build de produção
npm run start                Servidor de produção
npm run lint                 Executar ESLint

🗺️ Roadmap
✅ Fase 1 - Fundação (Concluída)
Autenticação JWT multi-tenant
Dashboard executivo
Gestão de Clientes, Pessoas, Precificação
Exportação CSV com UTF-8 + BOM
Notificações Toast (Sonner)
✅ Fase 2 - BI & Comercial (Concluída)
DRE Gerencial + Ponto Fora da Curva
Simulador Tributário
Motor de Propostas (Wizard 5 passos)
Catálogo Enterprise (MEI, IRPF, etc.)
Admin de Catálogo + Overview
✅ Fase 3 - Segurança Enterprise (Concluída)
RBAC com RolesGuard
Proteção de rotas em 3 camadas
Soft Delete em entidades críticas
Seed demo com 12 meses de histórico
🚧 Fase 4 - Produção (Em andamento)
Deploy em VPS/Render/Railway
CI/CD com GitHub Actions
Monitoramento (Sentry, LogRocket)
Backup automático
📋 Fase 5 - Expansão (Planejada)
Relatórios em PDF
Integração com APIs contábeis (Sintegra, eSocial)
Módulo de tarefas e projetos
Chat interno contador ↔ cliente
App mobile (React Native)
White-label
📖 Documentação
Decisões Técnicas (ADRs)
Principais decisões arquiteturais documentadas:
ADR-01: Enums como fonte da verdade (fim das strings soltas)
ADR-11: Zero dependências opcionais em DTOs
ADR-13: Propostas relacionais (fim do JSON solto)
ADR-15: Idempotência via UPSERT em seeds
ADR-25: RBAC com decorator @Roles()
ADR-27: Cookie espelho para middleware Next.js
🎨 Identidade Visual
Teal Principal: #0d9488 (cor primária)
Laranja Vibrante: #f97316 (destaque)
Cinza Escuro: #475569 (textos)
🤝 Contribuição
Este é um projeto proprietário. Contribuições externas não são aceitas no momento.
Para reportar bugs ou sugerir melhorias, entre em contato com a equipe de desenvolvimento.
📄 Licença
Proprietary License
Copyright © 2026 Conta Certa Soluções Empresariais. Todos os direitos reservados.
Este software é propriedade intelectual da Conta Certa e não pode ser copiado, modificado ou distribuído sem autorização expressa.
📞 Suporte
Dúvidas, suporte técnico ou informações comerciais:
📧 Email: contato@contacerta.com.br
🌐 Website: www.contacerta.com.br
👨‍💻 Autor
Marcos - Desenvolvedor Full Stack
Projeto: Radar Conta Certa
Stack: Next.js 16 + NestJS 10 + PostgreSQL 15
Ano: 2026
🙏 Agradecimentos
Next.js Team - Framework excepcional
Vercel - Por manter o Next.js
NestJS Team - Framework enterprise robusto
Prisma - ORM moderno e intuitivo
Tailwind CSS - Estilização utility-first incrível
Lucide - Ícones bonitos e consistentes
Sonner - Notificações elegantes
<div align="center">

Feito com ❤️ por Marcos e equipe Conta Certa
⭐ Se este projeto foi útil, considere dar uma estrela!
</div>


---

## 📊 O que mudou (resumo das melhorias)

### ❌ Removido

| Item | Motivo |
|------|--------|
| Seções "Atualização: ..." (changelogs) | README não é CHANGELOG — movi para seção separada |
| ADRs detalhados | Vão para `docs/ARCHITECTURE.md` ou `docs/decisions/` |
| Diagramas ASCII duplicados | Simplifiquei para 1 diagrama limpo |
| Tabelas técnicas gigantes | Substituídas por tabelas focadas no leitor |
| Repetições de "Motor de Propostas" | Consolidado em uma seção |
| Lista de 30+ arquivos modificados | Removida — pertence a CHANGELOG.md |

### ✅ Adicionado

| Item | Benefício |
|------|-----------|
| **"Para quem é?"** | Define público-alvo claramente |
| **Tabela de diferenciais** | Escaneamento rápido |
| **Credenciais demo destacadas** | Onboarding em 10 segundos |
| **Roadmap com emojis** | Status visual imediato |
| **Seção "Documentação"** | Aponta para docs externos |

### 🔄 Reorganizado

- Funcionalidades **agrupadas por domínio** (Segurança, Comercial, Gestão)
- Instalação em **3 passos claros** (não 4 sub-seções)
- Variáveis de ambiente **consolidadas** em uma seção
- Scripts em **tabelas únicas** (não 2 seções separadas)

---

## 💡 Recomendações Finais

Para um projeto profissional, sugiro criar estes arquivos **separados** do README:
📂 docs/
├── ARCHITECTURE.md # ADRs completos + diagramas detalhados
├── API.md # Documentação da API (ou Swagger)
├── DEPLOYMENT.md # Guia de deploy em produção
└── CONTRIBUTING.md # (quando abrir para contribuições)
CHANGELOG.md # Histórico de versões (padrão Keep a Changelog)

📂 H:\radar-clone\
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 admin/                          ← 🆕 Service + DTOs
│   │   │   ├── admin.controller.ts            ← 🔧 Refatorado
│   │   │   ├── admin.service.ts               ← 🆕 NOVO
│   │   │   └── 📂 dto/                        ← 🆕 Pasta criada
│   │   │       ├── onboard-client.dto.ts
│   │   │       ├── update-company.dto.ts
│   │   │       └── update-user-role.dto.ts
│   │   │
│   │   ├── 📂 common/                         ← 🆕 Compartilhado
│   │   │   ├── 📂 decorators/
│   │   │   │   ├── roles.decorator.ts         ← 🆕 @Roles()
│   │   │   │   └── current-user.decorator.ts  ← 🆕 @CurrentUser()
│   │   │   └── 📂 guards/
│   │   │       └── roles.guard.ts             ← 🆕 RBAC Guard
│   │   │
│   │   ├── 📂 client/                         ← 🔧 Refatorado
│   │   │   ├── client.service.ts              ← + transação
│   │   │   ├── client.controller.ts           ← + @CurrentUser
│   │   │   └── 📂 dto/
│   │   │       ├── create-client.dto.ts       ← + commercialPlanId
│   │   │       └── update-client.dto.ts       ← refatorado
│   │   │
│   │   ├── 📂 commercial-plans/               ← 🔧 Refatorado
│   │   │   ├── commercial-plans.service.ts    ← + soft delete
│   │   │   ├── commercial-plans.controller.ts ← + @Roles
│   │   │   └── 📂 dto/                        ← 🆕 3 DTOs
│   │   │
│   │   ├── 📂 proposals/                      ← 🔧 Refatorado
│   │   │   ├── proposals.service.ts           ← + findBySlug, trends
│   │   │   └── proposals.controller.ts        ← + @CurrentUser
│   │   │
│   │   ├── seed-demo.ts                       ← 🆕 Dados fictícios
│   │   ├── seed-accounts.ts                   ← 🆕 Plano de contas
│   │   └── seed-global-accounts.ts            ← 🆕 Contas globais
│   │
│   └── 📂 prisma/
│       ├── schema.prisma                      ← 🔧 Expandido
│       └── seed.ts                            ← 🔧 Catálogo rico
│
└── 📂 frontend/
    └── 📂 src/
        ├── middleware.ts                      ← 🆕 Proteção de rotas
        ├── 📂 app/
        │   ├── 📂 forbidden/
        │   │   └── page.tsx                   ← 🆕 Página 403
        │   │
        │   └── 📂 dashboard/
        │       ├── layout.tsx                 ← 🔧 Menu admin
        │       ├── 📂 admin/
        │       │   ├── page.tsx               ← 🆕 Overview KPIs
        │       │   └── 📂 catalogo/
        │       │       └── page.tsx           ← 🆕 CRUD completo
        │       ├── 📂 clientes/
        │       │   └── page.tsx               ← 🔧 Wizard 3 passos
        │       └── 📂 precificacao/
        │           └── page.tsx               ← 🔧 Motor de propostas
        │
        └── 📂 store/
            └── authStore.ts                   ← 🔧 + cookies

### 🌐 Página Pública da Proposta
O cliente do escritório visualiza a proposta comercial por um link compartilhado:

*   **Acesso Público**: Sem necessidade de login (rota `/proposta/[slug]`)
*   **Design Premium**: Identidade visual Conta Certa com gradiente teal/laranja
*   **Itens Detalhados**: Plano comercial + serviços avulsos com escopo
*   **Seções Ricas**: Sobre o escritório, diferenciais, onboarding, termos
*   **CTA WhatsApp**: Botão com mensagem pré-definida e tracking de cliques
*   **Tracking de Engajamento**: Contadores de views e cliques alimentam o BI
*   **Segurança**: Slug não-sequencial, sem exposição de IDs internos
*   **Estados Completos**: Loading, erro (não encontrada) e sucesso

### 📦 Catálogo Completo de Serviços
O sistema inclui um catálogo profissional com **17 departamentos** e **~200 serviços** pré-configurados:

*   **Departamentos**: Contábil, Fiscal, Pessoal, Legalização, Consultoria, BPO, Controladoria, Auditoria, LGPD, Tecnologia, Premium
*   **Dados Ricos**: Cada serviço possui escopo, fora-do-escopo, SLA, documentos necessários e preço base
*   **Importação em Massa**: Botão "Importar Catálogo Padrão" na tela Admin popula todos os dados automaticamente
*   **Execução via Seed**: `npx ts-node src/seed-full-catalog.ts` para importar via terminal
*   **Prevenção de Scope Creep**: Definição clara do que está incluso e o que é cobrado à parte

### 🔐 Sistema de Autenticação com Sincronização de Cookies
O sistema implementa autenticação JWT com sincronização automática de cookies para proteção de rotas:

*   **AuthStore (Zustand)**: Gerencia estado de autenticação + persistência em localStorage
*   **Sincronização de Cookies**: Cookies `radar_auth_token` e `radar_auth_role` criados automaticamente no login
*   **Middleware Next.js**: Proteção de rotas `/dashboard/admin/*` com verificação de role ADMIN
*   **Redirect Inteligente**: Após login, redireciona para o destino original (ex: `/dashboard/admin/catalogo`)
*   **Logout Limpo**: Remove cookies + localStorage ao sair

📊 Resultado Visual na Sidebar
Após aplicar as alterações, o menu ficará assim:
📊 Dashboard
🏢 Minha Empresa
👥 Gestão de Pessoas ▼
   ├─ Colaboradores
   └─ Turnover
👥 Clientes
📒 Lançamentos Contábeis ▼
   ├─ Todos os Lançamentos
   └─ Revisão Manual
🧮 Precificação
📅 Planejamento
📁 Operacional ▼           ← 🆕 NOVO
   ├─ Projetos              ← 🆕 NOVO
   └─ Tarefas               ← 🆕 NOVO
📊 B.I. Contábil
⚠️ Ponto Fora da Curva
📈 Indicadores
⚖️ Planejamento Tributário
⚖️ Reforma Tributária
🧮 Contábil ▼
   ├─ Importar / Exportar SCI
   ├─ Revisão de Lançamentos
   └─ Plano de Contas
🛡️ Administração ▼ (Admin only)
   ├─ Visão Geral
   └─ Catálogo de Serviços

---
Atualização: Módulo de Gestão Operacional (Projetos e Tarefas)
Descrição:
* Implementação do módulo operacional para organizar entregas, obrigações e demandas
  internas do escritório contábil, com visão de progresso, prazos e prioridades.
Funcionalidades Adicionadas:
* Projetos: CRUD com status (Planejamento, Ativo, Pausado, Concluído, Cancelado),
  prioridade, cor de identificação, vínculo opcional com cliente e progresso
  calculado automaticamente pelas tarefas concluídas.
* Tarefas: CRUD com fluxo Kanban (Backlog, A Fazer, Em Andamento, Revisão,
  Bloqueada, Concluída), prioridade, categoria (Fiscal, Contábil, DP, Societário,
  Financeiro, Comercial, Interno), responsável, prazo e horas estimadas/realizadas.
* Indicadores: KPIs de projetos (ativos, atrasados, concluídos, progresso geral)
  e de tarefas (atrasadas, para hoje, em andamento, bloqueadas, concluídas na semana).
* Frontend: página /dashboard/projetos com cards de KPI, filtros, tabela com barra
  de progresso, modal de criação/edição e confirmação de exclusão.
* Navegação: grupo "Operacional" na sidebar com atalhos para Projetos e Tarefas.
Arquivos Criados/Alterados:
* backend/src/projects/ (module, controller, service, DTOs)
* backend/src/tasks/ (module, controller, service, DTOs)
* backend/prisma/schema.prisma (models Project e Task + enums de status/prioridade)
* backend/src/app.module.ts (registro dos módulos)
* frontend/src/app/dashboard/projetos/page.tsx
* frontend/src/components/projects/ (ProjectModal, ProjectStatusBadge, ProjectPriorityBadge)
* frontend/src/types/projects.ts
* frontend/src/app/dashboard/layout.tsx (menu Operacional)
Endpoints:
* GET/POST /projects • GET/PATCH/DELETE /projects/:id • GET /projects/metrics
* GET/POST /tasks • PATCH/DELETE /tasks/:id • PATCH /tasks/:id/status
* GET /tasks/kanban • GET /tasks/metrics
Detalhes das Alterações Técnicas:
* Multi-tenant: todas as queries filtradas por companyId do usuário autenticado.
* Soft delete (deletedAt) para preservação de histórico operacional.
* Integridade: projeto com tarefas pendentes não pode ser excluído (Restrict + validação).
* completedAt preenchido automaticamente ao concluir tarefa ou projeto.
* Índices compostos (companyId + status/prazo/responsável) para performance.

---
Atualização: Módulo Fiscal — Estoque e Apuração de ICMS (Fase 1 — Backend Homologado)
Descrição:
* Primeira fase do módulo fiscal para clientes do Lucro Presumido e Simples Nacional:
  base para upload de NF-e de entrada, catálogo de produtos com NCM, controle de
  fornecedores, kardex de estoque e futura apuração de ICMS / Bloco H do SPED.
Funcionalidades Adicionadas:
* Fornecedores Fiscais: CRUD com CNPJ único por empresa e criação automática
  (findOrCreateByCnpj) para uso pelo parser de XML.
* Produtos Fiscais: CRUD com validação de NCM (8 dígitos), EAN, unidade de medida,
  custo médio e saldo de estoque; busca por descrição, código, NCM ou EAN.
* Modelagem completa para as próximas fases: NF-e de entrada, itens com impostos
  (ICMS, ICMS-ST, IPI, PIS, COFINS, CST/CSOSN), movimentações de kardex e
  saldo mensal de estoque.
Arquivos Criados/Alterados:
* backend/src/fiscal/fiscal.module.ts
* backend/src/fiscal/controllers/supplier.controller.ts e product.controller.ts
* backend/src/fiscal/services/supplier.service.ts e product.service.ts
* backend/src/fiscal/dto/ (create/update-product.dto.ts)
* backend/prisma/schema.prisma (6 models fiscais + 4 enums)
* backend/src/app.module.ts (registro do FiscalModule)
Endpoints Homologados (Postman — todos 200/201):
* GET/POST /fiscal/suppliers • GET/PUT/DELETE /fiscal/suppliers/:id
* GET/POST /fiscal/products • GET/PUT/DELETE /fiscal/products/:id
Detalhes das Alterações Técnicas:
* Multi-tenant rigoroso (companyId em todas as queries).
* Soft delete com bloqueio de exclusão quando há movimentações/itens vinculados.
* Normalização de CNPJ/NCM/EAN (somente dígitos) com validação de formato.
* Precisão fiscal: Decimal(12,4) para quantidades/custos e Decimal(12,2) para valores.
* accessKey única por empresa para impedir NF-e duplicada (upload em massa na Fase 2).
Status: Backend da Fase 1 homologado. Parser de XML, estoque antigo (CSV),
relatórios personalizados e frontend do módulo nas próximas sprints.

Módulo Operacional (Projetos e Tarefas)
Responsável por: organizar entregas e demandas do escritório
Features: Kanban, prioridades, categorias, prazos, progresso automático
Endpoints: /projects, /tasks

Módulo Fiscal (em evolução)
Responsável por: estoque fiscal e apuração de ICMS
Features (Fase 1): fornecedores, catálogo de produtos com NCM
Endpoints: /fiscal/suppliers, /fiscal/products

Módulo Fiscal (Fase 1 concluída)
Responsável por: estoque fiscal, apuração de ICMS e SPED
Features: upload de NF-e em lote, kardex, custo médio, apuração mensal, Bloco H
Endpoints: /fiscal/suppliers, /fiscal/products, /fiscal/invoices,
/fiscal/inventory, /fiscal/icms, /fiscal/sped

---
Atualização: Módulo Fiscal — Estoque, Apuração de ICMS e SPED (Fase 1)
Descrição:
* Implementação completa do módulo fiscal para escritórios que atendem
  clientes do Lucro Presumido e Simples Nacional: importação de NF-e de
  entrada, catálogo de produtos com NCM, kardex com custo médio ponderado,
  apuração mensal de ICMS com fechamento de competência e exportação do
  Bloco H do SPED Fiscal.
Funcionalidades Adicionadas:
* Importar NF-e: upload em lote (até 50 XMLs) com parser de layout 4.0,
  criação automática de fornecedores por CNPJ, casagem de produtos por
  código/EAN e rejeição de notas duplicadas pela chave de acesso.
* Notas Fiscais: consulta paginada com KPIs por período, busca por número/
  chave/fornecedor e modal de detalhe com itens, CST/CSOSN e impostos.
* Estoque: saldo por produto com custo médio ponderado móvel, filtros por
  NCM/descrição, kardex completo (histórico de movimentações) e ajuste
  manual de inventário com justificativa obrigatória.
* Apuração de ICMS: grade dos 12 meses com créditos automáticos das NF-e de
  entrada, débitos manuais (vendas × alíquota), saldo a pagar/crédito
  acumulado, fechamento de mês com trava de compliance e reabertura.
* SPED Fiscal: inventário físico na data-base (reconstrução histórica pelo
  kardex) com exportação em arquivo pipe-delimited (H001/H005/H010/H990)
  e CSV para Excel.
Arquivos Criados/Alterados:
* backend/src/fiscal/fiscal.module.ts
* backend/src/fiscal/controllers/ (supplier, product, invoice, inventory,
  icms, sped)
* backend/src/fiscal/services/ (supplier, product, invoice, xml-parser,
  inventory, icms, sped)
* backend/src/fiscal/dto/ (create/update-product)
* backend/prisma/schema.prisma (7 models fiscais + 4 enums)
* backend/src/app.module.ts (registro do FiscalModule)
* frontend/src/app/dashboard/fiscal/page.tsx (Importar NF-e)
* frontend/src/app/dashboard/fiscal/notas/page.tsx
* frontend/src/app/dashboard/fiscal/estoque/page.tsx
* frontend/src/app/dashboard/fiscal/apuracao/page.tsx
* frontend/src/app/dashboard/fiscal/sped/page.tsx
* frontend/src/app/dashboard/layout.tsx (menu Fiscal com 5 submenus)
Endpoints:
* /fiscal/suppliers e /fiscal/products (CRUD completo)
* /fiscal/invoices/upload • /fiscal/invoices • /fiscal/invoices/metrics
  • /fiscal/invoices/:id
* /fiscal/inventory/metrics • /balance • /movements/:id • /adjust
* /fiscal/icms • /fiscal/icms/detail • /fiscal/icms (PUT) • /close • /reopen
* /fiscal/sped/bloco-h • /fiscal/sped/bloco-h/export (sped|csv)
Dependências Instaladas:
* fast-xml-parser — parser de XML de NF-e (tolerante a namespaces)
Detalhes das Alterações Técnicas:
* Parser NF-e layout 4.0 com suporte a CST (Presumido/Real) e CSOSN
  (Simples Nacional), extraindo ICMS, ICMS-ST, IPI, PIS e COFINS por item.
* Custo médio ponderado móvel calculado a cada entrada (exigência fiscal),
  com precisão Decimal(12,4) para quantidades/custos e Decimal(12,2) valores.
* Transações atômicas ($transaction) garantindo consistência entre nota,
  itens, kardex e saldo do produto.
* Mês fiscal fechado é imutável (BadRequest em edição) — integridade p/ SPED.
* Exportação CSV com BOM UTF-8 e SPED com separador pipe e datas ddmmaaaa.
* Multi-tenant rigoroso: todas as queries filtradas por companyId.

---

## 🆕 ATUALIZAÇÃO — Módulo Fiscal Completo: NF-e, Estoque, ICMS e SPED (Sprints 8–20)

### 🎯 Descrição

Implementação do módulo fiscal completo para escritórios contábeis (SaaS multi-tenant + multi-cliente por escritório). O módulo cobre o ciclo completo da **NF-e de entrada**: importação de XML → catálogo de produtos → estoque com custo médio ponderado → apuração de ICMS → SPED Fiscal (Bloco H) → relatório de inventário estendido (H010, 17 colunas) → conciliação e auditoria.

### 📦 Sprints entregues

| Sprint | Funcionalidade |
|---|---|
| 8 | Seletor de cliente fiscal (segregação de notas/estoque/apuração por cliente) |
| 9 | Gestão de NF-e: exclusão com estorno de estoque (replay), atribuição de cliente em lote, limpeza de órfãos, wipe com trava |
| 10 | Importação de estoque inicial (PDF/CSV) com tabela de revisão editável e movimento `SALDO_INICIAL` |
| 11 | Comparativo: Inicial × NF-e × Atual com divergências |
| 12 | Exportação CSV selecionável por contexto (preferência persistida) |
| 13 | Relatório de Inventário Fiscal H010 estendido (17 colunas) com tributos |
| 14 | Unificação de códigos via planilha (descrição → código unificado) |
| 15 | Drill-down da conciliação (evidências por origem + flags de procedência) |
| 16 | Manutenção manual de produtos (edição de todos os campos, soft delete) |
| 17 | Procedência no estoque: COD_EST × COD_NF × Unificado, origem, NF-e e datas |
| 18 | Unificação por similaridade (Dice sobre tokens) com % de match revisável |
| 19 | Código Unificado como coluna extra (`unifiedCode`), sem alterar o código do catálogo |
| 20 | Documentação viva: painel "Como funciona esta página" em todas as páginas fiscais |

### 📁 Arquivos criados/alterados

**Backend (NestJS + Prisma):**
- `src/fiscal/**` — controllers e services: `invoice`, `inventory`, `icms`, `sped`, `product`
- `prisma/schema.prisma` — `clientId` nos modelos fiscais; enum `SALDO_INICIAL`; `code String?` e `unifiedCode String?` no `FiscalProduct`

**Frontend (Next.js):**
- `src/store/fiscalClientStore.ts` — estado global do cliente fiscal (Zustand + localStorage)
- `src/components/fiscal/` — `FiscalClientSelector`, `InitialStockImportModal`, `ColumnPickerModal`, `UnifyCodesModal`, `ProductEditModal`, `ComparisonDetailModal`, `FiscalInfoPanel`
- `src/lib/` — `columnExport.ts` (CSV selecionável), `parseInitialStock.ts`
- Páginas: `fiscal/` (importação), `notas`, `estoque`, `apuracao`, `sped`, `comparativo`, `relatorio-inventario`

### 🔧 Decisões técnicas

- **Multi-cliente**: todos os endpoints fiscais aceitam `clientId` opcional; a UI segrega por seletor global.
- **Estorno por replay**: excluir uma NF-e recalcula saldo e custo médio reprocessando as movimentações restantes (integridade do Kardex).
- **Exclusão sequencial**: DELETEs em lote são sequenciais para evitar race condition no custo médio.
- **Parse → Revisão → Confirmar**: importações nunca aplicam cegamente; o usuário revisa antes de gravar.
- **Anti-colisão**: unificação e edição respeitam a constraint unique `[companyId, clientId, code]`.
- **Compliance vs flexibilidade**: SPED `.txt` com layout legal fixo (H001/H005/H010/H990); CSV customizável apenas para conferência interna.
- **Matching fuzzy**: unificação por similaridade (coeficiente de Dice sobre tokens), limiar configurável a partir de 10%, com % de match exibido para auditoria.
- **Unificação não destrutiva**: código unificado em coluna extra `unifiedCode` (Sprint 19), sem sobrescrever `code`.
- **Documentação viva**: `FiscalInfoPanel` embute métricas, fórmulas e interpretação de resultados em cada página.

### ✅ Como testar

1. Selecionar cliente no seletor fiscal → importar XML de NF-e de entrada → estoque e apuração segregados.
2. Estoque → conferir colunas COD_EST, COD_NF, Cód. Unificado, Origem, NF-e e datas.
3. Comparativo → drill-down (👁) exibe evidências por origem (inicial, NF-es com fornecedor, ajustes).
4. Unificar códigos → CSV da planilha → revisar % de match → aplicar → `unifiedCode` preenchido.
5. SPED → exportar `.txt` (fixo) e CSV (selecionável).
6. Relatório Inventário → 17 colunas com tributos das aquisições.
7. Abrir o painel "Como funciona..." em cada página fiscal.

### 🚧 Próximos passos (Fase 4 do Fiscal)

- [ ] **NF-e de SAÍDA** (vendas) com débito de ICMS automático e baixa de estoque
- [ ] Dashboard Fiscal Consolidado (créditos × débitos × saldo a pagar)
- [ ] Conciliação automática de divergências
- [ ] SPED completo (blocos 0, C, D, E, G, K)
