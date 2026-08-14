# 📋 CHANGELOG - Radar Clone

## 🎯 Objetivo do Projeto
Clone do sistema Radar Fora da Curva para gestão de escritórios contábeis.

---

## 📅 Histórico de Alterações

### Fase 1: Fundação & Autenticação (30/07/2026)

#### Backend (NestJS + Prisma + PostgreSQL)
- ✅ Configuração do projeto NestJS manual (sem CLI)
- ✅ Instalação de dependências: @nestjs/*, Prisma, bcryptjs, JWT, Passport
- ✅ Configuração do TypeScript (`tsconfig.json`)
- ✅ Configuração do NestJS CLI (`nest-cli.json`)
- ✅ Criação da estrutura de pastas (`src/auth`, `src/prisma`)

#### Banco de Dados (PostgreSQL via Docker)
- ✅ Criação do `docker-compose.yml` com PostgreSQL 16
- ✅ Configuração de credenciais: `radar_user` / `radar_password` / `radar_db`
- ⚠️ **Problema resolvido:** Porta 5432 estava ocupada por outro projeto (evolution_postgres)
- ✅ **Solução:** Mudamos para porta 5434 no `docker-compose.yml` e `.env`

#### Schema do Prisma
- ✅ Criação do `prisma/schema.prisma` com models `User` e `Company`
- ️ **Problema resolvido:** Erro de relação faltando entre User e Company
- ✅ **Solução:** Adicionado campo `company` no model `User` com `@relation`

#### Módulo de Autenticação
- ✅ Criação do `PrismaModule` e `PrismaService` (conexão com banco)
- ✅ Criação do `AuthModule` com JWT e Passport
- ✅ DTOs de validação: `LoginDto` e `RegisterDto` (class-validator)
- ✅ Estratégia JWT (`JwtStrategy`) para validar tokens
- ✅ Guard de autenticação (`JwtAuthGuard`)
- ✅ Service de autenticação com hash de senha (bcryptjs)
- ✅ Controller com rotas `POST /auth/register` e `POST /auth/login`

#### Configurações de Ambiente
- ✅ `.env` do backend com DATABASE_URL, JWT_SECRET, JWT_EXPIRATION
- ✅ CORS configurado para aceitar `http://localhost:3000`
- ✅ ValidationPipe global para validação automática de DTOs

---

### Fase 1: Frontend (Next.js 14 + TypeScript + Tailwind)

#### Configuração do Projeto
- ✅ Criação do projeto Next.js com App Router
- ✅ Instalação de dependências: zustand, axios, lucide-react
- ✅ Configuração do `.env.local` com `NEXT_PUBLIC_API_URL`

#### Estado Global e API
- ✅ Criação do `authStore` (Zustand) com persistência no localStorage
- ✅ Configuração do cliente Axios com interceptor para token JWT

#### Páginas
- ✅ Página de Login/Cadastro (`/login`)
  - Formulário com validação
  - Toggle entre login e registro
  - Integração com API de autenticação
  - Redirecionamento automático após login
- ✅ Layout do Dashboard (`/dashboard/layout.tsx`)
  - Sidebar com menu de navegação
  - Proteção de rotas (redirect para /login se não autenticado)
  - Exibição do usuário logado
  - Botão de logout
- ✅ Página do Dashboard (`/dashboard/page.tsx`)
  - Cards de Status, Plano e Módulos
  - Grid de módulos disponíveis com links

#### Problemas Resolvidos
- ⚠️ **Erro:** `TrendingUp is not defined` na página Minha Empresa
- ✅ **Solução:** Adicionado import faltante do lucide-react
- ⚠️ **Erro:** WebSocket errors ao acessar por IP (172.16.0.2)
- ✅ **Solução:** Acessar via `localhost:3000` para evitar problemas de CORS

---

### Fase 2: Módulo Minha Empresa (30/07/2026) - EM ANDAMENTO

#### Frontend
- ✅ Criação da página `/dashboard/minha-empresa`
- ✅ Formulário completo com:
  - Dados da empresa (Razão Social, CNPJ)
  - Localização (Estado)
  - Softwares utilizados (checkboxes)
  - Visão de futuro (metas de clientes e funcionários)
  - Campos de texto para visão, desafios e compromisso
- ✅ Validação de formulário
- ✅ Feedback visual de sucesso/erro

#### Backend (PRÓXIMO PASSO)
- ⏳ Atualizar `schema.prisma` com model `CompanyProfile`
-  Criar módulo `Company` no backend
- ⏳ Criar endpoints `POST /company` e `GET /company`
- ⏳ Conectar frontend ao backend real

---

## 📌 Decisões Técnicas Importantes

1. **Porta do PostgreSQL:** Usamos 5434 (não 5432) para evitar conflito com projeto existente
2. **Autenticação:** JWT simples (sem refresh token) - suficiente para MVP
3. **Estado global:** Zustand (mais simples que Redux)
4. **Validação:** class-validator no backend + validação nativa do HTML no frontend
5. **Estilização:** Tailwind CSS (rápido e consistente)

---

## 🚧 Próximos Passos

- [ ] Implementar backend do módulo Minha Empresa
- [ ] Criar módulo Gestão de Pessoas (Turnover)
- [ ] Criar módulo Clientes (Churn, Receita Recorrente)
- [ ] Criar módulo Precificação
- [ ] Criar módulo Planejamento Estratégico
- [ ] Adicionar testes automatizados
- [ ] Deploy em produção

---

## 👥 Equipe
- Desenvolvedor: [Seu nome]
- Início do projeto: 30/07/2026

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