# 🎯 RADAR CONTA CERTA

**O cérebro digital do escritório contábil**

<div align="center">

![Status](https://img.shields.io/badge/🚀_PRODUÇÃO_EM_BREVE-0d9488?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-10-red?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=for-the-badge)
![Sprints Entregues](https://img.shields.io/badge/Sprints_Entregues-31-f97316?style=for-the-badge)

Um SaaS que transforma 4 horas de trabalho manual em 15 minutos — importando extratos e notas fiscais, classificando sozinho, conciliando com inteligência e entregando DREs prontos para o cliente e para a diretoria.

[Para Diretores](#-resumo-executivo-para-quem-não-programa) • [Mapa do Sistema](#️-mapa-do-sistema) • [Jornada das Sprints](#-jornada-de-desenvolvimento-sprints-131) • [Arquitetura](#️-arquitetura-para-a-equipe-técnica) • [Roadmap](#️-roadmap-onde-chegamos-e-onde-vamos)

</div>

---

## 📌 Resumo Executivo (para quem não programa)

💡 **Em uma frase:** o Radar Conta Certa é um sistema na nuvem (SaaS) que automatiza a rotina contábil de ponta a ponta — do extrato do banco ao relatório final do cliente — com segurança, rastreabilidade e inteligência artificial de regras.

### 😫 Antes (como é hoje nos escritórios)

| Atividade | Tempo mensal | Risco |
|-----------|--------------|-------|
| Digitar extrato bancário planilha por planilha | 2–4 h por cliente | Erros de digitação |
| Classificar cada lançamento "na mão" | 1–2 h por cliente | Inconsistência |
| Conferir Pix × Nota Fiscal olho a olho | 1–3 h por cliente | Pagamentos esquecidos |
| Montar DRE no Excel | 1 h por cliente | Fórmulas quebradas |

### ✅ Com o Radar Conta Certa

| Atividade | Tempo | Como |
|-----------|-------|------|
| Importar extrato | 10 segundos | 1 clique no CSV do banco |
| Classificar lançamentos | automático | O sistema aprende com o contador |
| Conferir Banco × NF-e | automático | Motor de score com confiança % |
| DRE pronto p/ cliente | 1 clique | Exporta CSV / imprime profissional |

### 🔢 Resultados reais medidos (cliente-piloto: Academia do Renan)

- ✅ +74 transações importadas e classificadas em segundos (junho/2026)
- ✅ DRE fechado: Receita R$ 9.404,71 × Despesas R$ 10.832,75 (bate com o banco)
- ✅ Julho/2026: 90% classificado SOZINHO pela memória de aprendizado
- ✅ Conciliação Banco × NF-e com sugestões de 80–90% de confiança

---

## 🗺️ Mapa do Sistema
┌─────────────────────────────────────────────────────────────┐
│ OPERACIONAL │
│ Dashboard → Pessoas & Turnover → Clientes & CRM → Projetos │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ COMERCIAL │
│ Precificação → Propostas & Planos → Motor de Herança (A1) │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ FISCAL │
│ NF-e de Entrada → Estoque Kardex → Apuração ICMS → SPED │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ BANCÁRIO │
│ Extrato CSV → Classificação c/ Memória → DRE Bancário │
│ → Fechamento do Mês → Conciliação Banco × NF-e │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ CONTÁBIL │
│ Plano de Contas SCI → Lançamentos → Ponte Bancário→Contábil│
│ → DRE Oficial do Cliente → Exportação SCI │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ INTELIGÊNCIA (BI) │
│ DRE do Escritório → Ponto Fora da Curva → Simulador Trib. │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ 🤖 FUNCIONÁRIO DIGITAL AURORA │
│ Conciliação → Classificação → Ponte Contábil → Relatórios │
│ (Execução automática + Revisão humana obrigatória) │
└─────────────────────────────────────────────────────────────┘

---

## ✨ Módulos e Funcionalidades

### 🔐 Segurança & Plataforma
- [x] Login com JWT + refresh token e proteção de rotas
- [x] Multi-tenant: cada escritório vê APENAS os seus dados (`companyId`)
- [x] Papéis de acesso (Super Admin, Admin, Gerente, Usuário, Cliente)
- [x] Módulos liberados por plano de assinatura (`allowedModules`)

### 📊 Dashboard Executivo
- [x] KPIs em tempo real (clientes, faturamento, pessoas, metas)
- [x] Gráficos nativos em CSS puro (zero dependências pesadas)

### 👥 Pessoas & Clientes
- [x] CRUD de colaboradores + Turnover automático por setor
- [x] Carteira de clientes com honorários, status e ticket médio
- [x] Importação em massa da carteira (~100 clientes de uma planilha) sem duplicar

### 💼 Comercial
- [x] Precificação por horas + margem
- [x] Planos e propostas com link público
- [x] **Motor de Herança de Planos** (Sprint A1): planos herdam itens automaticamente
- [x] CRM com funil, motivos de perda e taxa de conversão

🧾 Fiscal (Sprints 8–20 + F4/F5)
[x] Upload de NF-e em lote com parser próprio de XML
[x] Estoque Kardex com custo médio por replay e saldo inicial importado
[x] Apuração de ICMS mensal + SPED Bloco H (layout legal fixo)
[x] Relatório H010 com 17 colunas e tributos (ICMS/ST/IPI/PIS/COFINS)
[x] Manutenção manual de produtos com trilha de auditoria (ajustes)
[x] 🆕 Base de ICMS total e por item no modal de detalhe da NF-e (F4)
[x] 🆕 Coluna "Produtos" na listagem + ordenação A–Z e busca pelo nome
    do produto (F5)

### 🏦 Bancário (Sprints 21–24)
- [x] Importação de extrato CSV com parser à prova de erros (milhares BR/US, datas)
- [x] Classificação com memória: o sistema aprende cada correção do contador
- [x] Naturezas personalizadas por cliente (cada empresa tem o seu DRE)
- [x] DRE gerencial, relatório por natureza com subtotais, autosoma
- [x] Fechamento do mês com trava de compliance (fechou, não mexe)

### 📒 Contábil (Sprints 20, 25–26)
- [x] Plano de contas (padrão SCI 90113) + lançamentos de partida dobrada
- [x] Ponte Bancário → Contábil: 1 clique transforma o mês em escrituração
- [x] Exportação para o sistema SCI
- [x] DRE Oficial do Cliente com confronto Contábil × Bancário

### 🔗 Conciliação Inteligente (Sprint 29)
- [x] Motor que cruza débitos do banco × NF-e de entrada com score de confiança
- [x] Sugestões ≥80% / 🟡 50–79% com revisão humana obrigatória

### 📈 BI & Inteligência
- [x] DRE do Escritório
- [x] Ponto Fora da Curva (anomalias estatísticas)
- [x] Simulador Simples Nacional × Presumido × Real
- [x] Reforma Tributária (EC 132/23)
- [x] Exportação PDF profissional e CSV compatível com Excel (UTF-8 + BOM)

### 🐳 Containerização (Sprint 31)
- [x] Docker Compose: 1 comando para subir tudo (Postgres + Backend + Frontend)
- [x] Ambiente isolado para testes (banco virgem na porta 5433)
- [x] Build de produção otimizado (Next.js standalone + NestJS multi-stage)

---

## 🤖 Funcionário Digital Aurora (Sprints FD-1 e FD-2)

> **AURORA** = **A**utomação **U**nificada de **R**otinas e **O**brigações, com **R**evisão e **A**uditoria

A Aurora é a funcionária digital que acorda às 02:00 da manhã e executa rotinas contábeis automaticamente sobre o Radar Conta Certa, reaproveitando os motores existentes (classificação com memória, conciliação, ponte bancário→contábil).

### 🎯 O que ela faz (hoje, FD-2 parcial)

| Skill | O que faz | Quando executa | Status |
|-------|-----------|----------------|--------|
| **RECONCILIATION** | Concilia Banco × NF-e com score de confiança | Todo dia 02:00 | ✅ FD-1 |
| **CLASSIFICATION** | Classifica transações usando memória de aprendizado | Todo dia 02:30 | ✅ FD-2 |
| **ACCOUNTING_BRIDGE** | Promove lançamentos bancários para a contabilidade | Todo dia 03:00 | ✅ FD-2 |

### 🛡️ Regra de Ouro (ADR-030)

> **A automação prepara, calcula, organiza e recomenda.**  
> **O humano aprova tudo que gera obrigação legal, pagamento ou transmissão.**

- Score **≥80%**: Aurora executa sozinha (auto-aprovação)
- Score **50–79%**: Aurora enfileira para revisão humana 🟡
- Score **<50%**: Aurora ignora (deixa para o contador decidir)
- **`riskLevel = LEGAL`**: SEMPRE passa por aprovação humana, independente do score

### 📊 Dashboard da Aurora

Acesse `/dashboard/funcionario-digital` para ver:

- **Header da Aurora**: avatar 🌅, status (ACTIVE/PAUSED), botão de pausa/retoma
- **4 KPIs em tempo real**: runs hoje, itens auto-aprovados, pendências 🟡, tempo economizado
- **Timeline de runs**: histórico de execuções com métricas (itens processados, duração)
- **Fila de revisão 🟡**: pendências aguardando aprovação humana com notas
- **Painel de skills**: ligar/desligar individualmente, botão "Rodar agora"
- **Trilha de auditoria**: 100% das ações registradas com timestamp e responsável

### 🏗️ Arquitetura Técnica

┌─────────────────────────────────────────────────────────┐
│ SchedulerService (cron jobs) │
│ - Registra skills ligadas no boot │
│ - Sincroniza toggle ON/OFF em tempo real │
└──────────────────────┬──────────────────────────────────┘
│ dispara
↓
┌─────────────────────────────────────────────────────────┐
│ JobRunnerService (executor) │
│ - Cria AutomationRun │
│ - Executa skill │
│ - Atualiza métricas (itemsProcessed, secondsSaved) │
└──────────────────────┬──────────────────────────────────┘
│ usa
↓
┌─────────────────────────────────────────────────────────┐
│ Skills (ReconciliationSkill, ClassificationSkill, etc) │
│ - Reaproveitam motores existentes │
│ - Adaptadores isolam variações de retorno │
│ - Respeitam a Regra de Ouro (ADR-030) │
└──────────────────────┬──────────────────────────────────┘
│ registra
↓
┌─────────────────────────────────────────────────────────┐
│ AutomationAuditService (Pilar D - compliance) │
│ - 100% das ações auditadas │
│ - Trilha completa: quem, quando, o quê, resultado │
└─────────────────────────────────────────────────────────┘


### 📁 Estrutura de Dados (6 tabelas + 6 enums)

```prisma
model RobotWorker {
  id        String   @id @default(cuid())
  companyId String   @unique
  name      String
  avatar    String
  status    String   // ACTIVE | PAUSED
  skills    RobotWorkerSkill[]
  runs      AutomationRun[]
}

model RobotWorkerSkill {
  id         String   @id @default(cuid())
  companyId  String
  workerId   String
  skillKey   String   // RECONCILIATION | CLASSIFICATION | ACCOUNTING_BRIDGE
  enabled    Boolean  @default(false)
  cronExpr   String   // "0 2 * * *"
  lastRunAt  DateTime?
}

model AutomationRun {
  id                String   @id @default(cuid())
  workerId          String
  skillKey          String
  status            String   // RUNNING | SUCCESS | PARTIAL | FAILED
  itemsProcessed    Int      @default(0)
  itemsAutoApproved Int      @default(0)
  itemsPendingHuman Int      @default(0)
  secondsSaved      Int      @default(0)
  startedAt         DateTime @default(now())
  finishedAt        DateTime?
}

model AutomationPending {
  id         String   @id @default(cuid())
  companyId  String
  runId      String?
  type       String   // CLASSIFICATION | RECONCILIATION | ACCOUNTING_BRIDGE
  confidence Float?
  payload    Json
  status     String   @default("PENDING")
  resolvedBy String?
  resolvedAt DateTime?
  notes      String?
}

model AutomationAudit {
  id        String   @id @default(cuid())
  companyId String
  actor     String   // AURORA | USER_xxx
  action    String   // SKILL_FINISHED:RECONCILIATION
  entity    String   // AutomationRun | AutomationPending
  entityId  String
  detail    Json?
  createdAt DateTime @default(now())
}

model ApprovalRecord {
  id         String   @id @default(cuid())
  companyId  String
  entityType String
  entityId   String
  decision   String   // APPROVED | REJECTED
  decidedBy  String
  notes      String?
  createdAt  DateTime @default(now())
}

🚀 Como testar a Aurora
# 1. Login
$login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@aurora.com","password":"123456"}'
$token = $login.token

# 2. Disparar skill manualmente (botão "Rodar agora")
Invoke-RestMethod -Uri "http://localhost:3001/digital-employee/skills/RECONCILIATION/run" `
  -Method POST -Headers @{ Authorization = "Bearer $token" }

# 3. Ver dashboard
Invoke-RestMethod -Uri "http://localhost:3001/digital-employee/dashboard" `
  -Headers @{ Authorization = "Bearer $token" }

  📈 Status Atual (17/08/2026)
✅ FD-1 Fundação: 6 tabelas, módulo NestJS, dashboard frontend, menu lateral
✅ FD-2 Parcial: 3 skills (RECONCILIATION, CLASSIFICATION, ACCOUNTING_BRIDGE) + crons ativos
🚧 FD-2 Final: MonthlyReportSkill (PDF mensal) + UI de aprovação de pendências
⏳ FD-3 a FD-9: NFS-e automática, guias, CNAB, SPED, integrações, legalização, DP

🏆 O Diferencial: os 3 DREs
DRE                                 🎯 Para quem             📚 Fonte de dados
📍 Onde ver                         🏢 Do Escritório         Diretor da Conta Certa
Transações financeiras internas BI  💼 Bancário do Cliente   Gestão de caixa do cliente
Extrato + naturezas                  Fechamento Mensal        📒 Oficial do Cliente
Contabilidade / obrigações          Lançamentos promovidos      BI → DRE do Cli

✅ Os três conversam entre si por cards de navegação cruzada, e o Oficial mostra a diferença em R$ contra o Bancário — auditoria em tempo real.


🏗️ Arquitetura (para a equipe técnica)
┌─────────────────────────────────────────────────────────┐
│ Frontend — Next.js 16 (App Router)                      │
│ React 19 + TypeScript + Tailwind                        │
│ Zustand (estado) • Sonner (toasts) • Axios              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST + JWT
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Backend — NestJS 10                                     │
│ Controllers → Services → DTOs                           │
│ Guards JWT • RBAC @Roles()                              │
└──────────────────────┬──────────────────────────────────┘
                       │ Prisma ORM
                       ↓
┌─────────────────────────────────────────────────────────┐
│ PostgreSQL 15 + Prisma                                  │
│ ~35 tabelas • isolamento por companyId                  │
│ índices, soft delete, enums fortes                      │
└─────────────────────────────────────────────────────────┘

Princípios adotados
Multi-tenant single-database — um banco, isolamento lógico por companyId.
Enums como fonte da verdade — fim das "strings soltas".
Idempotência por upsert — importar/promover 2× nunca duplica.
Revisão humana obrigatória — imports e conciliações nunca aplicam cegamente.
Compliance primeiro — SPED com layout legal fixo; mês fechado é imutável.
Zero dependências pesadas de gráfico — CSS puro (‑200 KB de bundle).

🚀 Instalação
🐳 Com Docker (Recomendado para Desenvolvimento)
Pré-requisitos: Docker Desktop instalado e rodando.

# 1. Clonar o repositório
git clone https://github.com/seu-usuario/radar-conta-certa.git
cd radar-conta-certa

# 2. Subir tudo com 1 comando (Postgres + Backend + Frontend)
docker compose up -d --build

# 3. Verificar se os 3 containers estão Up
docker compose ps

# 4. Acessar http://localhost:3000
# Login: admin@demo.com / Senha: 123456

Portas:
Frontend: http://localhost:3000
Backend API: http://localhost:3001
Postgres (Docker): localhost:5433 (banco virgem para testes)
Postgres (Local): localhost:5432 (seus dados reais — intocado)
Comandos úteis:

docker compose logs -f backend    # Ver logs do backend em tempo real
docker compose restart backend    # Reiniciar apenas o backend
docker compose down -v            # Derrubar tudo e apagar o banco virgem

💻 Local (Desenvolvimento Tradicional)

# 1. Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma generate
npm run start:dev   # → http://localhost:3001

# 2. Frontend
cd ../frontend
npm install
cp .env.example .env.local
npm run dev         # → http://localhost:3000

# 3. Acessar http://localhost:3000
# Login: admin@demo.com / Senha: 123456

🎨 Identidade Visual
🟩 Teal #0d9488
🟧 Laranja #f97316
⬜ Cinza #475569
Cor primária (ações, sidebar)
Destaques e alertas
Textos neutros


🗺️ Roadmap — onde chegamos e onde vamos
✅ FASES 1–2.5 — Fundação + BI + Fiscal + Bancário + Contábil (Sprints 1–30)
Auth multi-tenant, Dashboard, Pessoas, Clientes, Precificação, Planejamento
Fiscal (NF-e, Kardex, ICMS, SPED), Bancário (extrato, conciliação)
Contábil (plano de contas, lançamentos, DRE oficial)
BI (DRE do escritório, ponto fora da curva, simulador tributário)
Conciliação Banco × NF-e com motor de score
✅ FASE 3 — PRODUÇÃO (Sprint 31 + A1)
Sprint 31: Docker + docker-compose (deploy em 1 comando)
Sprint A1: Motor de Herança de Planos (domínio puro)
Sprint A2: Valor de Referência + Dinheiro na Mesa (PRÓXIMA)
Sprint 32: Deploy em nuvem/VPS com proxy reverso
Sprint 33: CI/CD (GitHub Actions)
Sprint 34: Monitoramento (Sentry) + Backup automático
🚧 FASE 4 — EXPANSÃO COMERCIAL (Plano Conta Certa 2.0)
A3: Versões de Proposta
A4: Fechamento com Ganho
A5: White-label (cores do logo/site do cliente)
A6: PDF v2 + PNG
A7: Dashboard de Desempenho
📋 FASE 5 — PESSOAS & MERCADO
B1–B5: Tipos contratuais, distribuição por setor, entrevista de desligamento (IA)
C1–C4: Benchmark de softwares, serviços extras, indicadores com fórmula, score 0–100
🧠 FASE 6 — MENTORIA & UX
D1–D3: Visão de Futuro, checklist, ranking de níveis
E1–E3: Command palette, boas-vindas/"onde parou", notificações

🤖 FASE 7 — FUNCIONÁRIO DIGITAL AURORA (FD-1 → FD-9)
FD-1 fundação ✅ • 
FD-2 completa ✅ (3 skills + crons + Central de Aprovações) •
FD-3 NFS-e automática • FD-4 guias • FD-5 CNAB • FD-6 SPED + cert. A1 •
FD-7 integrações • FD-8 legalização • FD-9 DP leve

🤖 FASE 7 — FUNCIONÁRIO DIGITAL AURORA (FD-1 → FD-9)
✅ FD-1 Fundação: 6 tabelas, módulo NestJS, dashboard, menu lateral
✅ FD-2 Parcial: RECONCILIATION + CLASSIFICATION + ACCOUNTING_BRIDGE + crons ativos
🚧 FD-2 Final: MonthlyReportSkill (PDF mensal) + UI de aprovação de pendências
⏳ FD-3: NFS-e automática (e-mail + portal + OCR)
⏳ FD-4: Emissão de guias (DAS/ISS/DARF) com memória de cálculo
⏳ FD-5: Faturamento CNAB 240/400 + régua de cobrança
⏳ FD-6: SPED/obrigações + certificado A1 criptografado
⏳ FD-7: Integração com Domínio/Questor/Sage
⏳ FD-8: Legalização (cofre de senhas, procurações, eCAC)
⏳ FD-9: DP leve (integração com folha existente — NÃO construir do zero)

📖 Glossário (para a diretoria)
Termo               Significado simples
SaaS                Software assinado e usado pela internet, sem instalar nada
Multi-tenant        Vários escritórios no mesmo sistema, cada um vendo só o que é seu
DRE                 "Demonstração de Resultado" — o boletim de notas financeiro do mês
NF-e                Nota Fiscal eletrônica (o XML oficial emitido/comprado)
Kardex              O "extrato do estoque": tudo que entrou, saiu e o custo médio
SPED                Arquivo oficial exigido pela Receita Federal
Partidas dobradas   Regra contábil: todo débito tem um crédito igual
Conciliação         Conferir se o que saiu no banco bate com a nota fiscal
Score               Nota de confiança (0–100%) que o motor dá a cada sugestão
Aurora              Funcionária digital que executa rotinas automaticamente (FD-1/FD-2)
Regra de Ouro       Automação prepara; humano aprova ações legais (ADR-030)

📄 Licença & Autor
Proprietary License — Copyright © 2026 Conta Certa Soluções Empresariais.
Propriedade intelectual; cópia ou distribuição sem autorização são proibidas.

👨‍💻 Autor: Marcos — Desenvolvedor Full Stack
📞 Suporte: contato@contacerta.com.br • www.contacerta.com.br
<div align="center">

Feito com ❤️ para transformar a contabilidade brasileira
⭐ Útil para você? Dê uma estrela no repositório!
</div>

