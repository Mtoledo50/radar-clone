# 🎯 Radar Conta Certa - Sistema de Gestão Empresarial

<div align="center">

![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19-blue)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.x-teal)
![License](https://img.shields.io/badge/license-Proprietary-green)

**Sistema SaaS completo de gestão empresarial para escritórios contábeis**

[Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Arquitetura](#-arquitetura) • [Roadmap](#-roadmap)

</div>

---

## 📖 Sobre o Projeto

O **Radar Conta Certa** é um sistema SaaS (Software as a Service) de gestão empresarial desenvolvido especificamente para escritórios contábeis. A plataforma oferece uma solução completa para administrar clientes, colaboradores, precificação de serviços, planejamento estratégico, business intelligence contábil e gestão multi-tenant, tudo em uma interface moderna e intuitiva alinhada com a identidade visual da **Conta Certa Soluções Empresariais**.

### 🎯 Objetivo

Transformar a gestão de escritórios contábeis através de:
- **Automação** de processos administrativos e contábeis
- **Inteligência de dados** com BI contábil integrado (DRE, Ponto Fora da Curva, Simulador Tributário)
- **Precificação inteligente** baseada em horas, custos e margens
- **Gestão de pessoas** com controle de turnover e motivos de desligamento
- **Planejamento estratégico** com metas, KPIs e acompanhamento de progresso
- **Gestão comercial** com planos, propostas e motivos de perda

### 🏢 Identidade Visual

O sistema foi desenvolvido com a identidade visual da **Conta Certa Soluções Empresariais**, utilizando uma paleta de cores profissional baseada no logotipo oficial:

| Cor | Hex | Uso no Sistema |
|-----|-----|----------------|
| **Teal Principal** | `#0d9488` | Cor primária (botões, sidebar, destaques) |
| **Teal Escuro** | `#0f766e` | Hover states, headers, profundidade |
| **Laranja Vibrante** | `#f97316` | Cor secundária (CTAs, badges, alertas) |
| **Cinza Escuro** | `#475569` | Textos e elementos neutros |

---

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- [x] Login e cadastro de usuários com validação
- [x] Autenticação JWT com refresh token
- [x] Persistência de sessão com Zustand + localStorage (SSR-safe)
- [x] Proteção de rotas no frontend e backend (Guards JWT)
- [x] Arquitetura multi-tenant (separação por `companyId`)
- [x] Controle de roles (Admin da empresa, usuário padrão)

### 📊 Dashboard Executivo
- [x] KPIs em tempo real (clientes ativos, faturamento, colaboradores, metas)
- [x] Gráficos nativos com CSS puro (rosca e barras) - sem dependências pesadas
- [x] Visualização de métricas financeiras consolidadas
- [x] Cards de status dos módulos com acesso rápido
- [x] Saudação dinâmica baseada no horário do dia

### 👥 Gestão de Pessoas
- [x] CRUD completo de colaboradores
- [x] Controle de admissões e demissões com datas
- [x] Cálculo automático de **Turnover** (rotatividade)
- [x] Distribuição por setores (DP, Fiscal, Contábil, etc.)
- [x] Motivos de desligamento configuráveis
- [x] Métricas mensais de movimentação
- [x] Exportação de dados para CSV (UTF-8 com BOM)

### 🤝 Gestão de Clientes
- [x] Cadastro completo (razão social, CNPJ, contatos)
- [x] Classificação por tipo de serviço (Contábil, Fiscal, Pessoal, Completo)
- [x] Controle de status (Ativo, Prospect, Inativo)
- [x] Cálculo de honorários mensais e ticket médio
- [x] Faturamento mensal consolidado
- [x] Busca e filtragem em tempo real
- [x] Exportação de carteira para CSV

### 💰 Precificação de Serviços
- [x] Modelos de precificação baseados em horas
- [x] Cálculo automático: `(Horas × Valor Hora) + Software + Margem`
- [x] Classificação por complexidade (Baixa, Média, Alta)
- [x] Status de aprovação (Rascunho, Aprovado, Rejeitado)
- [x] Valor médio de mercado
- [x] Exportação de modelos para CSV

### 🎯 Planejamento Estratégico
- [x] Gestão de metas e objetivos estratégicos
- [x] Categorias (Comercial, Operacional, Financeiro, Pessoas, Tecnologia)
- [x] Controle de progresso (%) com barras visuais
- [x] Prazos e status (Pendente, Em Andamento, Concluído)
- [x] Métricas de conclusão e progresso médio
- [x] Exportação de planos para CSV

### 📈 Business Intelligence (BI) Contábil
- [x] **DRE Gerencial Visual** (Demonstração do Resultado do Exercício)
- [x] Evolução mensal de receitas e despesas (últimos 6 meses)
- [x] **Ponto Fora da Curva** (detecção de despesas anormais via análise estatística)
- [x] **Simulador de Regimes Tributários**:
  - Simples Nacional
  - Lucro Presumido
  - Lucro Real
- [x] Análise de economia potencial por regime
- [x] Gráficos comparativos em CSS puro
- [x] Lançamento de transações financeiras (receitas/despesas)

### 📦 Planos Comerciais
- [x] Configuração de planos (Essencial, Profissional, Premium)
- [x] Multiplicadores de preço configuráveis
- [x] Associação de itens de serviço por categoria
- [x] Gestão de categorias e itens de serviço
- [x] Propostas comerciais com itens selecionados
- [x] Motivos de perda de proposta (Loss Reasons)

### 🏢 Minha Empresa
- [x] Cadastro de dados da empresa
- [x] Configuração de setores obrigatórios
- [x] Gestão de motivos de desligamento
- [x] Controle de módulos ativos por empresa
- [x] Configurações administrativas

### 🔧 Painel Administrativo (Multi-Tenant)
- [x] Gestão de empresas cadastradas
- [x] Gestão de usuários e roles
- [x] Proteção de empresa admin (não deletável)
- [x] Métricas globais do sistema
- [x] Ativação/desativação de módulos por empresa

### 🎨 Experiência do Usuário (UX)
- [x] Notificações **Toast** elegantes (Sonner) substituindo `alert()` e `confirm()`
- [x] Confirmações interativas com botões estilizados
- [x] Feedback visual em todas as ações (criar, editar, deletar, exportar)
- [x] Design responsivo (desktop e mobile)
- [x] Sidebar com sub-itens e destaque de rota ativa
- [x] Animações suaves e transições
- [x] Tema consistente com identidade Conta Certa (teal/laranja)

### 📤 Exportação de Dados
- [x] Exportação CSV com **UTF-8 + BOM** (acentos corretos no Excel)
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
| **Axios** | 1.x | Cliente HTTP com interceptors |
| **Lucide React** | 1.x | Biblioteca de ícones |
| **Turbopack** | - | Bundler nativo do Next.js |

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **NestJS** | 10.x | Framework Node.js enterprise |
| **TypeScript** | 5.x | Tipagem estática |
| **Prisma** | 5.x | ORM moderno |
| **PostgreSQL** | 15+ | Banco de dados relacional |
| **JWT** | - | Autenticação e autorização |
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

### Arquitetura Multi-Tenant Single-Database

O sistema utiliza uma arquitetura **multi-tenant single-database**, onde todos os dados de todas as empresas são armazenados no mesmo banco, mas isolados logicamente através do campo `companyId`.
┌─────────────────────────────────────────┐
│ Frontend (Next.js) │
│ ┌───────────────────────────────────┐ │
│ │ React 19 + TypeScript + Tailwind │ │
│ │ Zustand (Estado Global) │ │
│ │ Sonner (Notificações) │ │
│ └───────────────────────────────────┘ │
└──────────────────┬──────────────────────┘
│ HTTP/REST (Axios + JWT)
▼
┌─────────────────────────────────────────┐
│ Backend (NestJS) │
│ ┌───────────────────────────────────┐ │
│ │ Controllers + Services + DTOs │ │
│ │ Guards (JWT) + Interceptors │ │
│ │ Prisma ORM │ │
│ ───────────────────────────────────┘ │
└──────────────────┬──────────────────────┘
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
│ ├── public/ # Assets estáticos
│ │ └── logo-conta-certa.png # Logotipo oficial
│ └── src/
│ ├── app/ # App Router (páginas e layouts)
│ │ ├── layout.tsx # Layout raiz (Toaster global)
│ │ ├── login/ # Tela de login/cadastro
│ │ └── dashboard/ # Área logada
│ │ ├── layout.tsx # Sidebar + proteção de rota
│ │ ├── page.tsx # Dashboard executivo
│ │ ├── minha-empresa/
│ │ ├── pessoas/
│ │ ├── clientes/
│ │ ├── precificacao/
│ │ └── planejamento/
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
│ │ ├── schema.prisma # Modelos do banco
│ │ └── seed.ts # Dados iniciais realistas
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
│ ├── proposals/ # Módulo de propostas
│ └── common/ # Módulos compartilhados
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
Comando                         Descrição
npm run start:dev               Inicia o servidor em modo desenvolvimento (watch)
npm run build                   Compila o projeto para produção
npm run start:prod              Inicia o servidor em produção
npx prisma migrate dev          Cria e aplica migrações
npx prisma migrate deploy       Aplica migrações em produção
npx prisma generate             Gera o Prisma Client
npx prisma studio               Abre o Prisma Studio (GUI do banco)
npx prisma db seed              Popula o banco com dados iniciais

Frontend
Comando                         Descrição
npm run dev                     Inicia o servidor de desenvolvimento (Turbopack)
npm run build                   Compila o projeto para produção
npm run start                   Inicia o servidor de produção
npm run lint                    Executa o linter (ESLint)

🎨 Decisões Técnicas Importantes
1. Gráficos Nativos com CSS (sem Recharts)

Problema: O Recharts 2.x apresentou incompatibilidade com React 19 + Turbopack, causando erros de NaN e minPointSize is not a function.

Solução: Substituímos por gráficos nativos usando:
* conic-gradient para gráficos de rosca
* divs com altura proporcional para barras
* Tailwind CSS para animações

Benefícios:
* Zero dependências externas pesadas
* Performance superior
* Compatibilidade 100% com Next.js 16
* Bundle menor (~200KB economizados

2. Exportação CSV com UTF-8 + BOM
Problema: O Excel abre arquivos CSV assumindo codificação ANSI, quebrando acentos (ex: "Contábil" vira "ContÃ¡bil").
Solução: Adicionamos o caractere BOM (\uFEFF) no início do arquivo, forçando o Excel a reconhecer UTF-8.

3. Zustand com Persistência localStorage SSR-Safe
Problema: O Next.js renderiza no servidor (SSR), onde localStorage não existe.
Solução: Usamos createJSONStorage(() => localStorage) do Zustand, garantindo que a leitura só ocorra no browser, evitando erros de "window is not defined".

4. Arquitetura Multi-Tenant Single-Database
Decisão: Todas as empresas compartilham o mesmo banco, isoladas por companyId.

Vantagens:
* Simplicidade operacional (um único banco)
* Custo reduzido
* Manutenção centralizada
* Migrações sincronizadas
* Segurança: Todas as queries do backend filtram por companyId do usuário autenticado.

5. Notificações Toast (Sonner)

Problema: O alert() e confirm() nativos do navegador são feios e travam a interface.
Solução: Implementamos o Sonner, que oferece:
* Notificações elegantes no canto da tela
* Confirmações interativas com botões
* Auto-dismiss após 4 segundos
* Cores semânticas (verde=success, vermelho=error)

6. Correção de Inputs Invisíveis
Problema: Inputs com texto branco em fundo branco tornavam o texto invisível.
Solução: Aplicamos a classe text-slate-900 explicitamente em todos os inputs, garantindo contraste adequado.

7. Schema Prisma - Comentários de Linha
Problema: O Prisma não aceita comentários no formato JSDoc (/** ... */).
Solução: Todos os comentários do schema foram convertidos para formato de linha única (//).

📊 Módulos do Sistema
Módulo de Autenticação (/auth)
* Responsável por: Login, cadastro, refresh token, proteção de rotas
* Tecnologias: JWT, bcrypt, Zustand
* Endpoints: /auth/login, /auth/register, /auth/me

Módulo de Clientes (/clients)
* Responsável por: CRUD de clientes, métricas de faturamento
* Features: Busca, filtros, exportação CSV
* Endpoints: /clients, /clients/metrics

Módulo de Pessoas (/employees)
* Responsável por: CRUD de colaboradores, controle de turnover
* Features: Admissões, demissões, setores, motivos
* Endpoints: /employees, /employees/metrics

Módulo de Turnover (/turnover)
* Responsável por: Análise de rotatividade de pessoal
* Features: Motivos de desligamento, cálculo de turnover rate
* Endpoints: /turnover/metrics, /turnover/reasons

Módulo de Precificação (/pricings)
* Responsável por: Modelos de precificação de serviços
* Features: Cálculo automático, complexidade, margens
* Endpoints: /pricings, /pricings/metrics

Módulo de Planejamento (/plannings)
* Responsável por: Metas e objetivos estratégicos
* Features: Progresso, categorias, prazos
* Endpoints: /plannings, /plannings/metrics

Módulo Financeiro (/financial)
* Responsável por: Receitas e despesas
* Features: Categorias, evolução mensal, DRE gerencial
* Endpoints: /financial/transactions, /financial/dre

Módulo de BI (/bi)
* Responsável por: Business Intelligence contábil
* Features: Ponto fora da curva, simulador tributário
* Endpoints: /bi/outliers, /bi/tax-simulator

Módulo de Planos (/plans)
* Responsável por: Planos comerciais e itens de serviço
* Features: Categorias, itens, multiplicadores
* Endpoints: /plans, /plans/categories, /plans/items

Módulo de Propostas (/proposals)
* Responsável por: Propostas comerciais e motivos de perda
* Features: Associação de itens, loss reasons
* Endpoints: /proposals, /proposals/loss-reasons

Módulo Admin (/admin)
* Responsável por: Gestão global do sistema
* Features: Empresas, usuários, métricas globais
* Endpoints: /admin/companies, /admin/users

🧪 Testes
Testes Manuais
1 - Autenticação:
* Criar conta → Fazer login → Verificar redirect para dashboard
* Logout → Tentar acessar rota protegida → Verificar redirect para login

2- CRUD de Clientes:
* Criar cliente → Editar → Exportar CSV → Deletar
* Verificar toast de sucesso em cada ação
3 - Exportação CSV:
* Exportar dados → Abrir no Excel → Verificar acentos corretos
4- Dashboard:
* Verificar KPIs → Verificar gráficos → Verificar carregamento
5- BI Contábil:
* Lançar transações → Ver DRE → Testar simulador tributário

Testes Automatizados (Futuro)
* Testes unitários com Jest
* Testes de integração com Supertest
* Testes E2E com Playwright

️ Roadmap
✅ Fase 1 - Fundação (Concluída)
* *utenticação e autorização
* Dashboard executivo
* Gestão de Pessoas
* Gestão de Clientes
* Precificação
* Planejamento Estratégico
* Exportação CSV
* Notificações Toast
* Rebranding Conta Certa

✅ Fase 2 - BI e Comercial (Concluída)
* DRE Gerencial
* Ponto Fora da Curva
* Simulador Tributário
* Planos Comerciais
* Propostas e Loss Reasons
* Módulo de Turnover
* Painel Admin Multi-Tenant

Fase 3 - Produção (Em Andamento)
* Docker e docker-compose
* Deploy em produção (VPS/Render/Railway)
* CI/CD com GitHub Actions
* Monitoramento (Sentry, LogRocket)
* Backup automático do banco
* Variáveis de ambiente de produção

Fase 4 - Expansão (Planejada)
* Relatórios em PDF
* Integração com APIs contábeis (Sintegra, eSocial)
* Módulo de tarefas e projetos
* Chat interno entre contador e cliente
* App mobile (React Native)
* Multi-idioma (i18n)
* White-label (personalização por empresa)

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
Stack: Next.js 16 + NestJS + PostgreSQL + Prisma
Ano: 2026

🙏 Agradecimentos
Next.js Team - Framework excepcional
Vercel - Por manter o Next.js
NestJS Team - Framework enterprise robusto
Prisma - ORM moderno e intuitivo
Tailwind CSS - Estilização utility-first incrível
Lucide - Ícones bonitos e consistentes
Sonner - Notificações elegantes
Conta Certa Soluções Empresariais - Pela visão e identidade visual

📞 Suporte
Para dúvidas, suporte técnico ou informações comerciais:
Email: contato@contacerta.com.br
Website: www.contacerta.com.br
<div align="center">

Feito com ❤️ por Marcos e equipe Conta Certa
⭐ Se este projeto foi útil, considere dar uma estrela!
</div>

📊 Atualização: Filtros de Período no CRM de Propostas

Descrição:
Implementação de filtros de período interativos no Dashboard Comercial (CRM), permitindo que o usuário visualize o desempenho das propostas (enviadas, fechadas, perdidas e receita) em diferentes janelas de tempo.

Funcionalidades Adicionadas:
* Seleção de Período: Botões para filtrar os dados por 3 Meses, 6 Meses, 1 Ano e Todo o Período.
* Atualização Dinâmica: Todos os gráficos (Barras, Área e Pizza) e os KPIs são recalculados instantaneamente ao mudar o período selecionado.
* Filtro de Motivos de Perda: O gráfico de pizza (Motivos de Perda) agora reflete apenas as propostas perdidas dentro do período escolhido.

Arquivos Alterados:
* backend/src/proposals/proposals.service.ts
* backend/src/proposals/proposals.controller.ts
* frontend/src/app/dashboard/precificacao/page.tsx

Alterações Técnicas:
* Backend (proposals.service.ts):
  * Atualização dos métodos getTrendData e getLossReasonsData para receber e processar o parâmetro period.
  * Lógica de cálculo de data dinâmica baseada no período selecionado (3, 6, 12 meses ou ilimitado).
* Backend (proposals.controller.ts):
  * Adição do decorador @Query('period') nos endpoints /trend-data e /loss-reasons.
* Frontend (precificacao/page.tsx):
  * Criação do estado period e da interface de botões de seleção.
  * Integração do parâmetro period nas requisições da API via useEffect.

📈 Atualização: Gráfico de Taxa de Conversão no CRM
Descrição:
Implementação de um novo gráfico de linha no Dashboard Comercial (CRM) para visualizar a evolução da taxa de conversão de propostas ao longo do tempo, permitindo identificar tendências de melhoria ou queda no desempenho comercial.
Funcionalidades Adicionadas:

* Gráfico de Linha Interativo: Visualização da taxa de conversão (%) mês a mês, com pontos destacados e tooltip detalhado.
* Integração com Filtros de Período: O gráfico de conversão responde dinamicamente aos filtros já existentes (3 Meses, 6 Meses, 1 Ano, Todo Período).
* Cálculo Automático: A taxa é calculada em tempo real com base nas propostas enviadas vs. fechadas em cada mês, com precisão de 2 casas decimais.

Arquivos Alterados:
* backend/src/proposals/proposals.service.ts
* backend/src/proposals/proposals.controller.ts
* frontend/src/app/dashboard/precificacao/page.tsx

Detalhes das Alterações Técnicas:

* Backend (proposals.service.ts):
Adição do método getConversionTrendData que agrupa propostas por mês e calcula a taxa de conversão (closed / sent * 100).
Suporte ao parâmetro period para filtrar os dados conforme o período selecionado.
* Backend (proposals.controller.ts):
Adição do endpoint GET /proposals/conversion-trend com suporte ao decorador @Query('period').
* Frontend (precificacao/page.tsx):
Importação dos componentes LineChart e Line do Recharts.
Adição do estado conversionData e nova requisição à API no loadData.
Inserção do novo card de gráfico entre o gráfico de Pizza (Motivos de Perda) e o gráfico de Área (Receita).

---

## 🤖 Módulo de Conciliação Bancária Automática

### Visão Geral
Sistema inteligente de conciliação bancária que realiza matching automático entre o controle de caixa (Excel) e a base contábil (CSV), sugerindo as contas de Débito e Crédito corretas com base no plano de contas padrão (SCI 90113).

### Funcionalidades
- **Upload de 2 arquivos**: Excel (controle de caixa) + CSV (base contábil)
- **Matching automático** em 2 etapas:
  1. Por **VALOR EXATO** (tolerância de R$ 0,01)
  2. Por **SIMILARIDADE DE TEXTO** (Jaccard similarity > 60%)
- **Sugestão de contas contábeis** do plano padrão
- **Revisão manual** no frontend antes de salvar

### Status
✅ **Passo 1 Concluído**: Service de Conciliação criado
- ✅ Parser de Excel (controle de caixa)
- ✅ Parser de CSV (base contábil)
- ✅ Lógica de matching por valor
- ✅ Lógica de matching por similaridade de texto
- ✅ Integração com plano de contas global
- ✅ Endpoint POST `/accounting/reconcile`

### Próximos Passos
⏳ **Passo 2**: Criar componente React para revisão manual
⏳ **Passo 3**: Implementar salvamento no banco de dados
⏳ **Passo 4**: Adicionar filtros e relatórios

### Como Testar
1. Backend rodando: `npm run start:dev`
2. Usar Postman ou frontend para enviar POST para `/accounting/reconcile`
3. Enviar 2 arquivos: `files[0]` (Excel) e `files[1]` (CSV)
4. Receber JSON com lançamentos conciliados

---

## 🤖 Módulo de Conciliação Bancária Automática

### Visão Geral
Sistema inteligente de conciliação bancária que realiza matching automático entre o controle de caixa (Excel) e a base contábil (CSV), sugerindo as contas de Débito e Crédito corretas com base no plano de contas padrão (SCI 90113).

### Funcionalidades
- **Upload de 2 arquivos**: Excel (controle de caixa) + CSV (base contábil)
- **Matching automático** em 2 etapas:
  1. Por **VALOR EXATO** (tolerância de R$ 0,01)
  2. Por **SIMILARIDADE DE TEXTO** (Jaccard similarity > 60%)
- **Sugestão de contas contábeis** do plano padrão
- **Revisão manual** no frontend antes de salvar
- **Salvamento em lote** dos lançamentos confirmados

### Status
✅ **Passo 1 Concluído**: Service e Controller de Conciliação
- ✅ Parser de Excel (controle de caixa)
- ✅ Parser de CSV (base contábil)
- ✅ Lógica de matching por valor
- ✅ Lógica de matching por similaridade de texto
- ✅ Integração com plano de contas global
- ✅ Endpoint POST `/accounting/reconcile`

✅ **Passo 2 Concluído**: Interface React para Revisão
- ✅ Componente de upload de arquivos
- ✅ Tabela de resultados com edição inline
- ✅ Dropdowns para seleção de contas
- ✅ Botão de salvar lançamentos
- ✅ Integração com endpoint de salvamento

### Como Usar
1. Acesse `/dashboard/lancamentos/conciliacao`
2. Faça upload do Excel (controle de caixa) e CSV (base contábil)
3. Clique em "Processar Conciliação"
4. Revise os lançamentos e ajuste as contas quando necessário
5. Clique em "Salvar Lançamentos"

### Próximos Passos
⏳ **Passo 3**: Adicionar filtros e relatórios de conciliação
⏳ **Passo 4**: Implementar exportação de resultados em PDF/Excel

---

## 🤖 Módulo de Conciliação Bancária Automática (v2.0)

### Melhorias da Versão 2.0
✅ **Detecção automática de formato** - Aceita tanto "Controle de Caixa" quanto "Conciliação Bancária"
✅ **Normalização de colunas** - Aceita Data/DATA/data, Valor/VALOR/valor, etc.
✅ **Suporte a múltiplos formatos** - Excel com ENTRADA/SAÍDA/VALOR ou DÉBITO/CRÉDITO separados
✅ **Logs de debug** - Facilita diagnóstico de problemas
✅ **Tratamento de erros** - Mensagens claras quando arquivos estão vazios ou em formato inválido

### Formatos Suportados

#### Formato 1: Controle de Caixa
| DATA | HISTÓRICO | CPF/CNPJ | ENTRADA | SAÍDA | VALOR |
|------|-----------|----------|---------|-------|-------|
| 01/08/2025 | Recebimento cliente | 12.345.678/0001-90 | SIM | NÃO | R$ 1.000,00 |

#### Formato 2: Conciliação Bancária
| DATA | HISTÓRICO | DÉBITO | CRÉDITO |
|------|-----------|--------|---------|
| 01/08/2025 | Recebimento cliente | | R$ 1.000,00 |
| 02/08/2025 | Pagamento fornecedor | R$ 500,00 | |

### Como Usar
1. Acesse `/dashboard/lancamentos/conciliacao`
2. Faça upload do Excel (controle de caixa ou conciliação bancária)
3. Faça upload do CSV (base contábil do SCI)
4. Clique em "Processar Conciliação"
5. Revise os lançamentos e ajuste as contas quando necessário
6. Clique em "Salvar Lançamentos"

### Logs de Debug
O backend agora exibe logs detalhados no terminal:

---

## 🆕 ATUALIZAÇÃO — Módulo Fiscal Completo: NF-e, Estoque, ICMS e SPED (Sprints 8–14)

### 🎯 O QUE FOI IMPLEMENTADO

Ciclo completo do módulo fiscal para escritórios contábeis **multi-cliente**:

1. **Sprint 8 — Seletor de Cliente Fiscal**: estado global (Zustand + localStorage) que segrega notas, estoque, apuração e SPED por cliente.
2. **Sprint 9 — Gestão de Notas**: exclusão de NF-e com **estorno de estoque** (recálculo de custo médio por replay), atribuição de cliente em lote, limpeza de produtos órfãos e wipe total com trava de confirmação (`EXCLUIR`).
3. **Sprint 10 — Estoque Inicial**: importação de saldo inicial via PDF (texto colado) ou CSV, com **tabela de revisão editável** e movimento `SALDO_INICIAL`.
4. **Sprint 11 — Comparativo**: conciliação `Inicial (PDF) × Entradas NF-e × Saldo Atual` com divergências destacadas para auditoria.
5. **Sprint 12 — Exportação Selecionável**: CSV com colunas escolhidas pelo usuário (persistido por contexto); SPED `.txt` permanece com **layout legal fixo**.
6. **Sprint 13 — Relatório H010**: inventário fiscal estendido (17 colunas) com tributos das aquisições (ICMS, ST, IPI, PIS, COFINS, IR).
7. **Sprint 14 — Unificação de Códigos**: substituição dos códigos do catálogo pelo "Código Unificado" da planilha, casando por **descrição normalizada**, com proteção anti-colisão.

### 📁 ARQUIVOS CRIADOS/MODIFICADOS

**Backend (NestJS + Prisma):**
- `src/fiscal/services/invoice.service.ts` — upload resiliente (`DUPLICATE`), `assignClient`, `remove` com estorno
- `src/fiscal/services/inventory.service.ts` — `wipe`, `importInitialStock`, `getComparison`, `getInventoryTaxReport`, `unifyCodes`
- `src/fiscal/services/icms.service.ts` / `sped.service.ts` — apuração e Bloco H por cliente
- `src/fiscal/controllers/*` — rotas `assign-client`, `wipe`, `initial-import`, `compare`, `report/tax`, `unify-codes`
- `prisma/schema.prisma` — `clientId` em `FiscalInvoice`/`FiscalProduct`/`FiscalInventoryMovement`; enum `SALDO_INICIAL`

**Frontend (Next.js):**
- `src/store/fiscalClientStore.ts` — estado global do cliente fiscal
- `src/components/fiscal/` — `FiscalClientSelector`, `InitialStockImportModal`, `ColumnPickerModal`, `UnifyCodesModal`
- `src/lib/` — `parseInitialStock.ts`, `columnExport.ts`
- Páginas — `estoque`, `notas`, `apuracao`, `sped`, `comparativo`, `relatorio-inventario`

### 🔧 DECISÕES TÉCNICAS

- **Estorno por replay**: ao excluir NF-e, recalcula saldo + custo médio reprocessando as movimentações restantes (não apenas subtrai).
- **Exclusão sequencial**: DELETE de notas em lote é sequencial para preservar integridade do Kardex (evita race condition no custo médio).
- **Parse → Revisão → Confirmar**: importações (inicial e unificação) nunca aplicam cegamente; o usuário revisa antes de gravar.
- **Anti-colisão**: unificação de códigos pula códigos já em uso (respeita constraint `unique [companyId, clientId, code]`).
- **Compliance**: SPED `.txt` fixo (H001/H005/H010/H990); CSV customizável apenas para conferência interna.
- **Multi-tenant**: todos os endpoints validam `companyId` e aceitam `clientId` opcional.

### ✅ COMO TESTAR

1. Selecionar cliente no seletor fiscal → importar XML → estoque/apuração segregados.
2. Estoque → "Importar estoque inicial" → colar texto do PDF → revisar → confirmar.
3. Comparativo → validar conciliação (OK / Movimentado por NF-e / Divergente / Sem saldo).
4. Estoque → "Unificar códigos" → CSV (coluna E + W) → revisar → aplicar.
5. Relatório Inventário → códigos unificados + coluna "Referência" = nome do produto.
6. Exportar CSV com campos selecionáveis; SPED `.txt` mantém layout fixo.

🏗️ Nova Arquitetura do Menu (visão CTO)
Vou introduzir seções visuais (section headers) que agrupam os itens por domínio contábil, seguindo a ordem natural do trabalho de um escritório:

📊 OPERACIONAL      Dashboard, Empresa, Pessoas, Clientes, Projetos
💼 COMERCIAL        Precificação, Planejamento
🧾 FISCAL           NF-e, Estoque, Apuração, SPED (7 filhos)
🏦 BANCÁRIO         Fechamento Mensal ← movido e renomeado visualmente
📒 CONTÁBIL         Lançamentos, SCI, Revisão, Plano de Contas
📈 INTELIGÊNCIA     BI, Indicadores, Tributário
⚙️ SISTEMA          Administração

OPERACIONAL ─────────────
📊 Dashboard
🏢 Minha Empresa
👥 Gestão de Pessoas ▼
👥 Clientes
📁 Operacional ▼

COMERCIAL ─────────────
🧮 Precificação
📅 Planejamento

FISCAL ─────────────
🧾 Fiscal ▼

BANCÁRIO ─────────────
🏦 Fechamento Mensal           ← ícone Landmark

CONTÁBIL ─────────────
📒 Lançamentos Contábeis ▼
🧮 Contábil ▼

INTELIGÊNCIA ─────────────
📊 B.I. Contábil
⚠️ Ponto Fora da Curva
📈 Indicadores
⚖️ Planejamento Tributário
⚖️ Reforma Tributária

SISTEMA ─────────────
🛡️ Administração ▼

---

## Atualização: Módulo de Fechamento Mensal Bancário (Sprints 21–24)

**Descrição:**
Implementação do ciclo completo de fechamento bancário por cliente: importação do extrato, classificação por naturezas, DRE gerencial, relatório de confronto e fechamento do mês com trava de compliance.

**Funcionalidades Adicionadas:**
* Importação de extrato CSV com parser robusto: detecção automática de separador (`;`, `,`, TAB), milhares BR (`2.818,00`) e US (`2,818.00`), datas DD/MM/YYYY vs MM/DD/YY pela máscara, colunas de valor detectadas pelo conteúdo (aceita cabeçalhos sem nome), linhas "Saldo do dia" ignoradas.
* Classificação automática em 3 camadas: regras aprendidas (memória por contraparte) → regras built-in → pendente de revisão.
* Naturezas dinâmicas por cliente (`BankCategory`): cada cliente tem suas próprias categorias agrupadas em 6 grupos DRE (Receita, Financeira, Despesa, Imposto, Sócio, Pendente), com seed automático, edição, renomeação e exclusão protegida (categoria em uso não pode ser excluída).
* Reclassificação em lote com checkbox "Aprender p/ próximo mês"; edição manual sempre alimenta a memória.
* DRE gerencial por categoria com exportação CSV e impressão profissional.
* Relatório detalhado por natureza com quantidade e subtotais por grupo, para confronto com o DRE.
* Filtro por grupo/natureza na tabela de transações com totais filtrados no rodapé.
* Fechar/Reabrir mês: mês FECHADO bloqueia edição, exclusão e reimportação (trava de compliance).
* Autosoma (saldo acumulado) opcional por transação.

**Arquivos Criados/Alterados:**
* `backend/src/banking/banking.service.ts`, `banking.controller.ts`, `banking.module.ts`
* `frontend/src/app/dashboard/fechamento/page.tsx`
* `frontend/src/lib/parseBankCsv.ts`
* `prisma/schema.prisma` — modelos `BankStatement`, `BankTransaction`, `BankClassificationRule`, `BankCategory`

**Decisões Técnicas:**
* Naturezas como `String` (não enum) para permitir categorias personalizadas por cliente; grupos DRE fixos garantem que o DRE sempre feche.
* Memória de classificação persistida em `BankClassificationRule` (pattern = contraparte normalizada), ordenada por hits.
* Idempotência na reimportação: reimportar o mês substitui as transações anteriores.

---

## Atualização: Importação em Massa de Clientes (Sprint 23)

**Descrição:**
Importação da carteira de clientes do escritório a partir da planilha de contratos/honorários, com revisão prévia e atualização sem duplicidade.

**Funcionalidades Adicionadas:**
* Parser de planilha CSV com detecção de colunas por cabeçalho (acentos opcionais) e datas flexíveis.
* Modal de revisão com contagem de clientes e soma de honorários/mês antes de confirmar.
* Upsert por razão social (case-insensitive): reimportar atualiza honorários e dados contratuais sem duplicar.
* Novos campos no modelo `Client`: `lastPaymentDate`, `installments`, `openAmount`, `paidAmount`, `overdueAmount`.

**Arquivos Criados/Alterados:**
* `backend/src/client/client-import.service.ts`, `client-import.controller.ts`, `client-import.module.ts`
* `frontend/src/lib/parseClientsCsv.ts`
* `frontend/src/components/clients/ImportClientsModal.tsx`
* `frontend/src/app/dashboard/clientes/page.tsx` — botão "Importar CSV" + ordenação A→Z

---

## Atualização: Ponte Bancário→Contábil e DRE do Cliente (Sprints 25–26)

**Descrição:**
Fechamento do ciclo contábil: meses FECHADOS no bancário são promovidos a lançamentos contábeis de partida dobrada, e o novo "DRE do Cliente" exibe o resultado oficial com confronto automático contra o DRE bancário (gerencial).

**Funcionalidades Adicionadas:**
* Botão "Promover p/ Contábil" (visível apenas em mês FECHADO): transforma cada transação classificada em lançamento contábil — crédito bancário → D Banco/C Receita; débito bancário → D Despesa/C Banco.
* Idempotência por `bankTransactionId`: promover duas vezes não duplica lançamentos.
* Criação inline de conta bancária no Plano de Contas (ex: PAGBANK) com **upsert** por `(companyId, code)` — duplo clique não gera erro.
* Inferência automática de `type` (ATIVO/PASSIVO/PL/RECEITA/DESPESA) e `nature` (DEVEDORA/CREDORA) pelo prefixo do código.
* Autocomplete de contas (`AccountCombobox`): filtra por código OU nome sem sensibilidade a acentos, navegação por teclado (↑↓/Enter/Esc) e botão limpar.
* Página "DRE do Cliente" (`/dashboard/bi/dre-cliente`): KPIs contábeis, receitas/despesas por conta, status de conciliação e tabela de confronto Contábil × Bancário com diferença destacada.
* Classificação do DRE pelo **sinal da transação bancária original**, independente da convenção do plano de contas do escritório.

**Arquivos Criados/Alterados:**
* `backend/src/accounting/accounting.service.ts` — `promoteFromBanking`, `getClientDRE`, `createAccount` (upsert)
* `backend/src/accounting/accounting.controller.ts` — `POST /accounting/promote-from-banking`, `GET /accounting/dre`
* `frontend/src/components/accounting/AccountCombobox.tsx`
* `frontend/src/app/dashboard/bi/dre-cliente/page.tsx`
* `prisma/schema.prisma` — `AccountingEntry.bankTransactionId`

**Os 3 DREs do Sistema (arquitetura):**
| DRE | Fonte | Dono dos dados | Onde |
|---|---|---|---|
| Gerencial do escritório | `FinancialTransaction` | Escritório | BI → DRE Gerencial |
| Bancário do cliente | `BankTransaction` + `BankCategory` | Cliente | Fechamento Mensal |
| Contábil oficial | `AccountingEntry` | Cliente | BI → DRE do Cliente |

📋 Checklist da Sprint 27
[ ] Edição 1: 3 módulos novos em "Módulos do Sistema"
[ ] Edição 2: "Fase 2.5" no Roadmap
[ ] Edição 3: 3 blocos "Atualização" no final do README
[ ] README renderiza corretamente (tabelas e código íntegros)

ocumento
Conteúdo Principal
README.md
Documentação completa do projeto (Fases 1 + 2 + 2.5 + 3 + Arquitetura de Menu)
Skill_Arquiteto_de_Software_SaaS_Enterprise.txt
Padrões de qualidade, multi-tenant, decisões técnicas
062026.csv / 072026.csv
Extratos reais do cliente Renan (base para testes de parser)
Contratos - Hon. mensais.xlsx
Carteira de ~100 clientes para importação

📊 Status Atual do Projeto

Sprints concluídas (última homologada):
✅ Sprint 26 — DRE do Cliente com confronto Contábil × Bancário
✅ Sprint 27 — Documentação Enterprise (README atualizado)
Próxima sprint da Trilha B (arquitetura já documentada no README):
⏭️ Sprint 28 — Reorganização do Menu com as 7 seções visuais já desenhadas:

  📊 OPERACIONAL • 💼 COMERCIAL • 🧾 FISCAL • 🏦 BANCÁRIO
  📒 CONTÁBIL    • 📈 INTELIGÊNCIA • ⚙️ SISTEMA
