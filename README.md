# 🎯 Radar Conta Certa - Sistema de Gestão Empresarial

<div align="center">

![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19-blue)
![NestJS](https://img.shields.io/badge/NestJS-latest-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-Proprietary-green)

**Sistema SaaS completo de gestão empresarial para escritórios contábeis**

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Documentação](#-documentação) • [Roadmap](#-roadmap)

</div>

---

## 📖 Sobre o Projeto

O **Radar Conta Certa** é um sistema SaaS (Software as a Service) de gestão empresarial desenvolvido especificamente para escritórios contábeis. A plataforma oferece uma solução completa para administrar clientes, colaboradores, precificação de serviços, planejamento estratégico e business intelligence, tudo em uma interface moderna e intuitiva.

### 🎯 Objetivo

Transformar a gestão de escritórios contábeis através de:
- **Automação** de processos administrativos
- **Inteligência de dados** com BI contábil integrado
- **Precificação inteligente** baseada em horas e margens
- **Gestão de pessoas** com controle de turnover
- **Planejamento estratégico** com metas e KPIs

### 🏢 Identidade Visual

O sistema foi desenvolvido com a identidade visual da **Conta Certa Soluções Empresariais**, utilizando uma paleta de cores profissional baseada em:
- **Teal Principal** (#0d9488) - Cor primária
- **Laranja Vibrante** (#f97316) - Cor secundária/destaque
- **Cinza Escuro** (#475569) - Textos e elementos neutros

---

##  Funcionalidades

### 🔐 Autenticação e Segurança
- [x] Login e cadastro de usuários
- [x] Autenticação JWT com refresh token
- [x] Persistência de sessão com Zustand + localStorage
- [x] Proteção de rotas no frontend e backend
- [x] Arquitetura multi-tenant (separação por empresa)

### 📊 Dashboard Executivo
- [x] KPIs em tempo real (clientes ativos, faturamento, colaboradores, metas)
- [x] Gráficos nativos com CSS puro (rosca e barras)
- [x] Visualização de métricas financeiras
- [x] Cards de status dos módulos

### 👥 Gestão de Pessoas
- [x] CRUD completo de colaboradores
- [x] Controle de admissões e demissões
- [x] Cálculo automático de Turnover (rotatividade)
- [x] Distribuição por setores (DP, Fiscal, Contábil, etc.)
- [x] Métricas mensais de movimentação
- [x] Exportação de dados para CSV

###  Gestão de Clientes
- [x] Cadastro completo de clientes (razão social, CNPJ, contato)
- [x] Classificação por tipo de serviço (Contábil, Fiscal, Pessoal, Completo)
- [x] Controle de status (Ativo, Prospect, Inativo)
- [x] Cálculo de honorários mensais e ticket médio
- [x] Faturamento mensal consolidado
- [x] Busca e filtragem em tempo real
- [x] Exportação de carteira para CSV

### 💰 Precificação de Serviços
- [x] Modelos de precificação baseados em horas
- [x] Cálculo automático: (Horas × Valor Hora) + Software + Margem
- [x] Classificação por complexidade (Baixa, Média, Alta)
- [x] Status de aprovação (Rascunho, Aprovado, Rejeitado)
- [x] Valor médio de mercado
- [x] Exportação de modelos para CSV

### 🎯 Planejamento Estratégico
- [x] Gestão de metas e objetivos
- [x] Categorias (Comercial, Operacional, Financeiro, Pessoas, Tecnologia)
- [x] Controle de progresso (%)
- [x] Prazos e status (Pendente, Em Andamento, Concluído)
- [x] Métricas de conclusão
- [x] Exportação de planos para CSV

### 🏢 Minha Empresa
- [x] Cadastro de dados da empresa
- [x] Configuração de setores obrigatórios
- [x] Gestão de motivos de desligamento
- [x] Configurações administrativas

###  Business Intelligence (BI) Contábil
- [x] DRE Gerencial Visual (Demonstração do Resultado do Exercício)
- [x] Evolução mensal de receitas e despesas
- [x] Ponto Fora da Curva (detecção de despesas anormais)
- [x] Simulador de Regimes Tributários (Simples, Lucro Presumido, Lucro Real)
- [x] Análise de economia potencial por regime
- [x] Gráficos comparativos em CSS puro

### 📦 Planos Comerciais
- [x] Configuração de planos (Essencial, Profissional, Premium)
- [x] Multiplicadores de preço
- [x] Associação de itens de serviço por categoria
- [x] Gestão de categorias e itens
- [x] Propostas comerciais

### 🔧 Painel Administrativo
- [x] Gestão de empresas (multi-tenant)
- [x] Gestão de usuários e roles
- [x] Proteção de empresa admin (não deletável)
- [x] Métricas globais do sistema

### 🎨 Experiência do Usuário (UX)
- [x] Notificações Toast elegantes (Sonner)
- [x] Confirmações interativas (substituindo `confirm()` nativo)
- [x] Feedback visual em todas as ações (criar, editar, deletar, exportar)
- [x] Design responsivo (desktop e mobile)
- [x] Animações suaves e transições
- [x] Tema consistente com identidade Conta Certa

### 📤 Exportação de Dados
- [x] Exportação CSV com UTF-8 + BOM (acentos corretos no Excel)
- [x] Exportação inteligente (respeita filtros ativos)
- [x] Feedback visual da quantidade exportada
- [x] Formato compatível com Excel, Google Sheets e LibreOffice

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 16.2.12 | Framework React com App Router |
| **React** | 19 | Biblioteca de interface |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.x | Estilização utility-first |
| **Zustand** | 4.x | Gerenciamento de estado global |
| **Sonner** | 1.x | Sistema de notificações Toast |
| **Axios** | 1.x | Cliente HTTP |
| **Lucide React** | 0.x | Biblioteca de ícones |
| **Turbopack** | - | Bundler nativo do Next.js |

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **NestJS** | 10.x | Framework Node.js enterprise |
| **TypeScript** | 5.x | Tipagem estática |
| **Prisma** | 5.x | ORM moderno |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **JWT** | - | Autenticação |
| **class-validator** | - | Validação de DTOs |
| **bcrypt** | - | Hash de senhas |

### Infraestrutura
| Tecnologia | Propósito |
|------------|-----------|
| **Node.js** | Runtime JavaScript |
| **npm** | Gerenciador de pacotes |
| **Git** | Controle de versão |

---

## 🏗️ Arquitetura

### Arquitetura Multi-Tenant

O sistema utiliza uma arquitetura **multi-tenant single-database**, onde todos os dados de todas as empresas são armazenados no mesmo banco, mas isolados logicamente através do campo `companyId`.

┌─────────────────────────────────────────┐

│            Frontend (Next.js)           │

│  ┌───────────────────────────────────┐  │

│  │  React 19 + TypeScript + Tailwind │  │

│  │       Zustand (Estado Global)     │  │

│  │        Sonner (Notificações)      │  │

│  └───────────────────────────────────┘  │

└──────────────────┬──────────────────────┘ 

│ HTTP/REST (Axios)
▼

┌─────────────────────────────────────────┐

│ Backend (NestJS) │

│ ┌───────────────────────────────────┐ │

│ │ Controllers + Services + DTOs │ │

│ │ Guards (JWT) + Interceptors │ │

│ │ Prisma ORM │ │

│ └───────────────────────────────────┘ │

──────────────────┬──────────────────────┘

│ SQL

▼
┌─────────────────────────────────────────┐

│ PostgreSQL Database │

│ ┌───────────────────────────────────┐ │

│ │ Tabelas com companyId │ │

│ │ Índices para performance │ │

│ │ Relações e constraints │ │

│ └───────────────────────────────────┘ │

└─────────────────────────────────────────┘



### Estrutura de Pastas
radar-clone/
├── frontend/ # Aplicação Next.js
│ ├── public/ # Assets estáticos (logotipo, imagens)
│ │ └── logo-conta-certa.png
│ └── src/
│ ├── app/ # App Router (páginas e layouts)
│ │ ├── layout.tsx # Layout raiz (Toaster global)
│ │ ├── login/ # Tela de login/cadastro
│ │ └── dashboard/ # Área logada
│ │ ├── layout.tsx # Sidebar + proteção de rota
│ │ ├── page.tsx # Dashboard executivo
│ │ ├── clientes/
│ │ ├── pessoas/
│ │ ├── precificacao/
│ │ ├── planejamento/
│ │ └── minha-empresa/
│ ├── components/ # Componentes reutilizáveis
│ │ └── DashboardCharts.tsx
│ ├── lib/ # Utilitários
│ │ ├── axios.ts # Instância Axios configurada
│ │ └── exportToCSV.ts # Função de exportação CSV
│ └── store/ # Estado global
│ └── authStore.ts # Zustand (autenticação)
│
├── backend/ # API NestJS
│ ├── prisma/ # Schema e migrações
│ │ ├── schema.prisma
│ │ └── seed.ts # Dados iniciais
│ └── src/
│ ├── auth/ # Módulo de autenticação
│ ├── clients/ # Módulo de clientes
│ ├── employees/ # Módulo de colaboradores
│ ├── pricings/ # Módulo de precificação
│ ├── plannings/ # Módulo de planejamento
│ ├── turnover/ # Módulo de turnover
│ ├── financial/ # Módulo financeiro (DRE)
│ ├── bi/ # Business Intelligence
│ ├── admin/ # Painel administrativo
│ ── common/ # Módulos compartilhados
│
└── README.md # Este arquivo

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **PostgreSQL** 15+
- **npm** 9+
- **Git**

### Passo a Passo

#### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/radar-conta-certa.git
cd radar-conta-certa

2. Configurar o Backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Editar o arquivo .env com suas credenciais do PostgreSQL
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/radar_conta_certa"

# Gerar o Prisma Client
npx prisma generate

# Rodar as migrações
npx prisma migrate deploy

# (Opcional) Popular o banco com dados de teste
npx prisma db seed

3. Configurar o Frontend
cd ../frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Editar o arquivo .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

4. Iniciar o Desenvolvimento
Abra dois terminais:

Terminal 1 - Backend:
cd backend
npm run start:dev

Terminal 2 - Frontend:
cd frontend
npm run dev

O sistema estará disponível em:
Frontend: http://localhost:3000
Backend: http://localhost:3001

🔐 Variáveis de Ambiente
Backend (backend/.env)
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/radar_conta_certa?schema=public"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
JWT_EXPIRATION="7d"

# Aplicação
PORT=3001
NODE_ENV=development


Frontend (frontend/.env.local)
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Aplicação
NEXT_PUBLIC_APP_NAME="Radar Conta Certa"

📜 Scripts Disponíveis
Backend


Comando                             Descrição
npm run start:dev               Inicia o servidor em modo desenvolvimento (watch)
npm run build                   Compila o projeto para produção
npm run start:prod              Inicia o servidor em produção
npx prisma migrate dev          Cria e aplica migrações
npx prisma migrate deploy       Aplica migrações em produção
npx prisma generate             Gera o Prisma Client
npx prisma studio               Abre o Prisma Studio (GUI do banco)
npx prisma db seed              Popula o banco com dados iniciais

Frontend
Comando                             Descrição
npm run dev                     Inicia o servidor de desenvolvimento (Turbopack)
npm run build                   Compila o projeto para produção
npm run start                   Inicia o servidor de produção
npm run lint                    Executa o linter (ESLint)

🎨 Decisões Técnicas Importantes
1. Gráficos Nativos com CSS (sem Recharts)

Problema: O Recharts 2.x apresentou incompatibilidade com React 19 + Turbopack, causando erros de NaN e minPointSize is not a function.

Solução: Substituímos por gráficos nativos usando:

conic-gradient                  para gráficos de rosca
divs                            com altura proporcional para barras
Tailwind                        CSS para animações

Benefícios:
Zero dependências externas pesadas
Performance superior
Compatibilidade 100% com Next.js 16
Bundle menor (~200KB economizados)

2. Exportação CSV com UTF-8 + BOM
Problema: O Excel abre arquivos CSV assumindo codificação ANSI, quebrando acentos (ex: "Contábil" vira "ContÃ¡bil").
Solução: Adicionamos o caractere BOM (\uFEFF) no início do arquivo, forçando o Excel a reconhecer UTF-8.

3. Zustand com Persistência localStorage
Problema: O Next.js renderiza no servidor (SSR), onde localStorage não existe.
Solução: Usamos createJSONStorage(() => localStorage) do Zustand, garantindo que a leitura só ocorra no browser, evitando erros de "window is not defined".

4. Arquitetura Multi-Tenant Single-Database
Decisão: Todas as empresas compartilham o mesmo banco, isoladas por companyId.

Vantagens:
Simplicidade operacional (um único banco)
Custo reduzido
Manutenção centralizada
Migrações sincronizadas
Segurança: Todas as queries do backend filtram por companyId do usuário autenticado.

5. Notificações Toast (Sonner)
Problema: O alert() e confirm() nativos do navegador são feios e travam a interface.
Solução: Implementamos o Sonner, que oferece:
Notificações elegantes no canto da tela
Confirmações interativas com botões
Auto-dismiss após 4 segundos
Cores semânticas (verde=success, vermelho=error)

📊 Módulos do Sistema

### 📦 Catálogo de Serviços e Contratos (Enterprise)
O sistema possui um motor robusto de produtos e contratos, permitindo a criação de planos comerciais complexos e controle rigoroso de escopo.

*   **Service Catalog (`ServiceCategory`, `ServiceItem`)**: Permite cadastrar serviços (ex: IRPF, MEI, Folha) com definição clara de escopo, *out-of-scope*, SLA (prazos) e documentos necessários. Evita o "escopo aberto" que gera prejuízo contábil.
*   **Commercial Plans (`CommercialPlan`, `PlanServiceItem`)**: Agrupamento de serviços em pacotes (Ex: Plano Essencial, Plano Premium) com multiplicadores de margem.
*   **Client Contracts (`ClientContract`)**: Histórico de vigência, honorários e planos contratados por cliente. Essencial para cálculo de MRR, LTV e Churn.
*   **Client Services (`ClientService`)**: Gestão de serviços avulsos (one-off) ou recorrentes contratados fora do plano principal (Ex: Venda de IRPF para cliente do plano mensal).
*   **Relational Proposals (`Proposal`, `ProposalItem`)**: Propostas comerciais 100% relacionais, permitindo BI avançado sobre quais serviços e planos estão sendo mais vendidos e convertidos.

Módulo de Autenticação
Responsável por: Login, cadastro, refresh token, proteção de rotas
Tecnologias: JWT, bcrypt, Zustand
Endpoints: /auth/login, /auth/register, /auth/me

Módulo de Clientes
Responsável por: CRUD de clientes, métricas de faturamento
Features: Busca, filtros, exportação CSV
Endpoints: /clients, /clients/metrics

Módulo de Pessoas
Responsável por: CRUD de colaboradores, controle de turnover
Features: Admissões, demissões, setores, motivos
Endpoints: /employees, /employees/metrics

Módulo de Precificação
Responsável por: Modelos de precificação de serviços
Features: Cálculo automático, complexidade, margens
Endpoints: /pricings, /pricings/metrics

Módulo de Planejamento
Responsável por: Metas e objetivos estratégicos
Features: Progresso, categorias, prazos
Endpoints: /plannings, /plannings/metrics

Módulo Financeiro (DRE)
Responsável por: Receitas e despesas
Features: Categorias, evolução mensal, DRE gerencial
Endpoints: /financial/transactions, /financial/dre

Módulo de BI
Responsável por: Business Intelligence
Features: Ponto fora da curva, simulador tributário
Endpoints: /bi/outliers, /bi/tax-simulator

Módulo Admin
Responsável por: Gestão global do sistema
Features: Empresas, usuários, métricas globais
Endpoints: /admin/companies, /admin/users

### 🛒 Motor de Catálogo e Contratos (SaaS Contábil)
O Radar Conta Certa evoluiu de um simples CRM para um **Motor de Vendas e Contratos** para escritórios contábeis.

*   **Catálogo Rico (Rich Catalog)**: Serviços não são apenas "nomes". Cada item (ex: *IRPF Completo*, *Abertura de MEI*) possui escopo detalhado, lista de documentos necessários, SLA (prazo de entrega) e definição rigorosa do que *não* está incluso (evitando *Scope Creep*).
*   **Venda de Add-ons Sazonais**: Suporte nativo para venda de serviços avulsos (MEI, IRPF, Legalização) para clientes que já possuem planos recorrentes, através do módulo `ClientService`.
*   **Seed Idempotente**: O banco é populado automaticamente com um portfólio completo de 7 categorias e dezenas de serviços pré-configurados com preços base e horas estimadas, acelerando o *Time-to-Value* para novos escritórios que adotam a plataforma.
*   **Geração de Propostas Relacionais**: As propostas comerciais puxam o escopo direto do banco de dados, garantindo que o cliente assine exatamente o que o escritório se propôs a entregar.

🧪 Testes
Testes Manuais
Autenticação:
Criar conta → Fazer login → Verificar redirect para dashboard
Logout → Tentar acessar rota protegida → Verificar redirect para login
CRUD de Clientes:
Criar cliente → Editar → Exportar CSV → Deletar
Verificar toast de sucesso em cada ação
Exportação CSV:
Exportar dados → Abrir no Excel → Verificar acentos corretos
Dashboard:
Verificar KPIs → Verificar gráficos → Verificar carregamento
Testes Automatizados (Futuro)
Testes unitários com Jest
Testes de integração com Supertest
Testes E2E com Playwright

️ Roadmap
✅ Fase 1 - Fundação (Concluída)
Autenticação e autorização
Dashboard executivo
Gestão de Pessoas
Gestão de Clientes
Precificação
Planejamento Estratégico
Exportação CSV
Notificações Toast
Rebranding Conta Certa

✅ Fase 2 - BI Contábil (Concluída)
DRE Gerencial
Ponto Fora da Curva
Simulador Tributário
Planos Comerciais
Painel Admin

✅ Fase 3 - Produção (Em Andamento)
Deploy em produção (VPS/Render/Railway)
CI/CD com GitHub Actions
Monitoramento (Sentry, LogRocket)
Backup automático do banco

📋 Fase 4 - Expansão (Planejada)
Relatórios em PDF
Integração com APIs contábeis (Sintegra, eSocial)
Módulo de tarefas e projetos
Chat interno entre contador e cliente
App mobile (React Native)
Multi-idioma (i18n)
White-label (personalização por empresa)

🤝 Contribuição
Este é um projeto proprietário. Contribuições externas não são aceitas no momento.
Para reportar bugs ou sugerir melhorias, entre em contato com a equipe de desenvolvimento.

📄 Licença
Proprietary License
Copyright © 2026 Conta Certa Soluções Empresariais. Todos os direitos reservados.
Este software é propriedade intelectual da Conta Certa e não pode ser copiado, modificado ou distribuído sem autorização expressa.

👨‍💻 Autor
Marcos - Desenvolvedor Full Stack
Projeto: Radar Conta Certa
Stack: Next.js 16 + NestJS + PostgreSQL
Ano: 2026

🙏 Agradecimentos
Next.js Team - Framework excepcional
Vercel - Por manter o Next.js
NestJS Team - Framework enterprise robusto
Prisma - ORM moderno e intuitivo
Tailwind CSS - Estilização utility-first incrível
Lucide - Ícones bonitos e consistentes
Sonner - Notificações elegantes

📞 Suporte
Para dúvidas, suporte técnico ou informações comerciais:
Email: contato@contacerta.com.br
Website: www.contacerta.com.br
<div align="center">

Feito com ❤️ por Marcos e equipe Conta Certa
⭐ Se este projeto foi útil, considere dar uma estrela!
</div>
---

Atualização: Exportação de Relatórios (PDF e Excel)

Descrição:
Implementação de funcionalidades de exportação de dados do CRM, permitindo que os usuários gerem relatórios completos em PDF (com formatação profissional) e planilhas CSV/Excel (para manipulação de dados).

Funcionalidades Adicionadas:

* Exportação para PDF: Gera um relatório formatado com:
   * Cabeçalho com período selecionado e data de geração
   * Resumo executivo com todos os KPIs (total, enviadas, fechadas, perdidas, conversão, ganho total)
   * Tabela detalhada de todas as propostas do período
   * Numeração de páginas automática

* Exportação para Excel/CSV: Gera uma planilha com:
   * Todas as colunas da tabela de propostas
   * Dados formatados para compatibilidade com Excel e Google Sheets
   * Valores em formato brasileiro (R$ com vírgula)
* Nomes de arquivos automáticos: Incluem a data atual (ex: relatorio-propostas-2026-08-04.pdf)

Arquivos Alterados:

frontend/src/app/dashboard/precificacao/page.tsx

Dependências Instaladas:
 * jspdf - Geração de PDFs
 * jspdf-autotable - Criação de tabelas formatadas em PDF

Detalhes das Alterações Técnicas:
* Frontend:
  * Adição dos imports jsPDF e autoTable
  * Criação da função exportToPDF() que monta o documento com cabeçalho, KPIs em tabela e lista de propostas
  * Criação da função exportToCSV() que gera arquivo CSV com BOM para suportar caracteres especiais em português
  * Adição de dois botões na interface (PDF em vermelho, Excel em verde) com ícones
  * Integração com toast para feedback de sucesso após download

Atualização: Carteira de Clientes (Gestão de Carteira)

Descrição:
* Implementação do módulo de gestão de carteira de clientes, permitindo o cadastro, edição e acompanhamento de todos os clientes do escritório, com métricas financeiras estratégicas.
  * Funcionalidades Adicionadas:
  * Dashboard de KPIs: Total de clientes, MRR (Monthly Recurring Revenue), Taxa de Churn e Ticket Médio.
  * CRUD Completo: Criar, editar e remover clientes com modal dedicado.
  * Busca Inteligente: Filtro por nome da empresa, contato ou tipo de serviço.
  * Exportação CSV: Download da carteira completa em formato compatível com Excel.
  * Status de Cliente: Acompanhamento de clientes Ativos, Inativos e em Churn.

Arquivos Criados/Alterados:

  * backend/src/client/client.service.ts
  * backend/src/client/client.controller.ts
  * backend/src/client/client.module.ts
  * frontend/src/app/dashboard/clientes/page.tsx

Detalhes das Alterações Técnicas:

Backend:
  * Criação do módulo ClientModule completo com Service e Controller.
  * Implementação do método getDashboard() que calcula MRR, Churn Rate e Ticket Médio em tempo real.
  * Endpoints REST: GET /clients, GET /clients/dashboard, POST /clients, PUT /clients/:id, DELETE /clients/:id.

Frontend:
  * Página completa com layout profissional e responsivo.
  * Integração com API para carregamento dinâmico de dados.
  * Modal de cadastro/edição com validação de campos obrigatórios.
  * Função de exportação CSV com formatação brasileira (valores com vírgula).

  Novas Alterações e Funcionalidades - 05/08/2026

  ### 🚀 Motor de Onboarding (Wizard de 3 Etapas)
A tela de clientes evoluiu de um formulário simples para um **Construtor de Contratos SaaS**:

*   **Aba 1 - Empresa**: Dados cadastrais, sócios e contatos.
*   **Aba 2 - Plano Mensal (MRR)**: Seleção visual de Planos Comerciais (START, PRIME, BLACK) que gera automaticamente um `ClientContract` no banco.
*   **Aba 3 - Add-ons (Serviços Avulsos)**: Venda cruzada de serviços sazonais (IRPF, MEI, Legalização) ou recorrentes extras.
*   **Calculadora em Tempo Real**: O honorário final é calculado dinamicamente (Plano + Add-ons) antes mesmo de salvar.
*   **Soft Delete Compliance**: A "exclusão" de um cliente na verdade o marca como `CHURN`, preservando o histórico contábil exigido pela legislação brasileira.

### 🔧 Decisões de Arquitetura (ADRs)

*   **ADR-11: Zero dependências opcionais em DTOs**: Os DTOs não utilizam `@nestjs/swagger` ou `@nestjs/mapped-types` para reduzir a superfície de dependências e acelerar o build. A documentação Swagger pode ser adicionada posteriormente via pacote separado.
*   **ADR-12: Enums como fonte da verdade**: Todos os campos de status (`ProposalStatus`, `ClientStatus`, `AccountType`, etc.) utilizam Enums do Prisma. Isso garante:
    *   Tipagem forte no TypeScript
    *   Validação automática no banco de dados
    *   Prevenção de strings inválidas em produção
*   **ADR-13: Propostas Relacionais**: O antigo campo JSON `includedPlans` foi substituído pela tabela `ProposalItem`, permitindo:
    *   BI avançado (quais serviços mais vendem)
    *   Integridade referencial com o catálogo
    *   Escopo automático em PDFs

### 🎯 Motor de Propostas Comerciais (Enterprise)
O módulo de propostas foi refatorado para suportar análises avançadas de vendas:

*   **Propostas Relacionais**: Itens vinculados a `CommercialPlan` e `ServiceItem` (fim do JSON solto).
*   **BI de Vendas**: Endpoints para taxa de conversão, motivos de perda e tendências mensais.
*   **Links Públicos**: Clientes visualizam propostas via slug único, com tracking de engajamento (views, WhatsApp clicks).
*   **Status Enterprise**: Enums `DRAFT`, `SENT`, `VIEWED`, `CLOSED_WON`, `CLOSED_LOST` garantem integridade.


### 🚀 Motor de Propostas Comerciais (Enterprise)
A tela de Precificação evoluiu para um **Construtor de Propostas Comerciais** completo:

*   **Wizard de 5 Passos**: Prospect → Plano Comercial → Add-ons → Textos → Revisão
*   **Calculadora em Tempo Real**: Valor total calculado dinamicamente (Valor Base × Multiplicador do Plano + Add-ons)
*   **Propostas Relacionais**: Itens salvos na tabela `ProposalItem`, permitindo BI de vendas avançado
*   **Funil de Vendas**: Status `DRAFT → SENT → VIEWED → CLOSED_WON / CLOSED_LOST` com tracking de métricas
*   **BI Integrado**: Dashboard com taxa de conversão, receita ganha e motivos de perda
*   **Link Público**: Cada proposta gera um slug único para visualização externa pelo cliente
*   **Exportação**: PDF profissional (jsPDF) e CSV com UTF-8 + BOM (acentos corretos no Excel)
┌─────────────────────────────────────────────────┐
│           ADMIN DE CATÁLOGO (Frontend)          │
│  ┌──────────┬──────────┬──────────────────┐    │
│  │ Aba 1    │ Aba 2    │ Aba 3            │    │
│  │Categorias│ Serviços │ Planos + Matriz  │    │
│  └──────────┴──────────┴──────────────────┘    │
└────────────────────┬────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────┐
│              BACKEND (NestJS)                   │
│  ┌────────────────┐  ┌─────────────────┐       │
│  │service-categories│ │ service-items   │       │
│  │  controller     │  │  controller     │       │
│  │  service        │  │  service        │       │
│  │  dto            │  │  dto            │       │
│  └────────────────┘  └─────────────────┘       │
│  ┌────────────────┐  ┌─────────────────┐       │
│  │commercial-plans │  │plan-service-items│      │
│  │  controller     │  │  controller     │       │
│  │  service        │  │  service        │       │
│  └────────────────┘  └─────────────────┘       │
└────────────────────┬────────────────────────────┘
                     │ Prisma
                     ▼
┌─────────────────────────────────────────────────┐
│              POSTGRESQL                         │
│  service_categories | service_items             │
│  commercial_plans   | plan_service_items        │
└─────────────────────────────────────────────────┘

backend/src/service-categories/
├── dto/create-service-category.dto.ts
├── dto/update-service-category.dto.ts
├── service-categories.controller.ts
├── service-categories.service.ts
└── service-categories.module.ts

backend/src/service-items/
├── dto/create-service-item.dto.ts
├── dto/update-service-item.dto.ts
├── service-items.controller.ts
├── service-items.service.ts
└── service-items.module.ts

### 🛡️ Módulo de Planos Comerciais (Enterprise)
O módulo de catálogo foi refatorado para atender padrões de segurança e integridade de SaaS B2B:

*   **Proteção Rigorosa de Tenant**: Todas as operações de update/delete validam `companyId`, prevenindo Cross-Tenant Access.
*   **Soft Delete Enterprise**: Categorias, planos e itens usam `deletedAt` em vez de exclusão física, preservando histórico contábil.
*   **Validação de Integridade**: Impede exclusão de categorias com itens vinculados ou planos com contratos ativos.
*   **DTOs Tipados**: Uso de `class-validator` para garantir integridade dos dados na borda da API.
*   **API Completa**: Endpoints para listar, criar, atualizar e deletar planos, categorias e itens de serviço.


┌──────────────────────────────────────────────────────┐
│  🛠️ ADMIN: CATÁLOGO DE SERVIÇOS                      │
├──────────────────────────────────────────────────────┤
│  [📁 Categorias]  [📦 Serviços]  [👑 Planos]         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ABA 1 — CATEGORIAS                                  │
│  • Tabela: Nome | Ícone | Ordem | # Serviços | Ações │
│  • Modal CRUD (nome, ícone, ordem, descrição)        │
│                                                      │
│  ABA 2 — SERVIÇOS                                    │
│  • Filtro por categoria                              │
│  • Tabela: Nome | Categoria | Preço | Recorrência    │
│  • Modal rico (escopo, documentos, SLA, preço)       │
│                                                      │
│  ABA 3 — PLANOS COMERCIAIS                           │
│  • Cards visuais (START, PRIME, BLACK)               │
│  • Modal de edição com multiplicador                 │
│  • Modal de vinculação plano × serviços              │
│                                                      │
└──────────────────────────────────────────────────────┘
### 🛡️ Sistema de Permissões e Menu Dinâmico
O layout do dashboard possui um sistema avançado de controle de acesso:

*   **Menu Dinâmico por Role**: Usuários ADMIN veem todos os itens; demais usuários veem apenas os módulos em `allowedModules`.
*   **Grupos com Submenu**: Módulos complexos (Gestão de Pessoas, Lançamentos, Administração) agrupam funcionalidades relacionadas.
*   **Itens Admin-Only**: Funcionalidades sensíveis (Catálogo de Serviços, Logs) são marcadas com `adminOnly: true` e invisíveis para não-admins.
*   **Expansão Inteligente**: Submenus expandem automaticamente conforme o contexto do usuário.
*   **Responsividade Total**: Sidebar colapsável em mobile com overlay e transições suaves.