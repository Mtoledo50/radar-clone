# 🎯 RADAR CONTA CERTA

**O cérebro digital do escritório contábil**

<div align="center">

![Status](https://img.shields.io/badge/🚀_PRODUÇÃO_EM_BREVE-0d9488?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-10-red?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=for-the-badge)
![Sprints Entregues](https://img.shields.io/badge/Sprints_Entregues-31-f97316?style=for-the-badge)
![Conta_Certa_2.0-A6_✅](https://img.shields.io/badge/Conta_Certa_2.0-A6_✅-0d9488?style=for-the-badge)
![Fase_A_✅](https://img.shields.io/badge/Fase_A_Comercial-✅_A1_A7-0d9488?style=for-the-badge)
![Fase_B_✅](https://img.shields.io/badge/Fase_B_Pessoas-✅_B1_B5-f97316?style=for-the-badge)

<div align="center">
https://img.shields.io/badge/🚀_PRODUÇÃO_EM_BREVE-0d9488?style=for-the-badge
https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge
https://img.shields.io/badge/NestJS-10-red?style=for-the-badge
https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge
https://img.shields.io/badge/Prisma-5-2d3748?style=for-the-badge
https://img.shields.io/badge/Sprints_Entregues-37-f97316?style=for-the-badge
https://img.shields.io/badge/Conta_Certa_2.0-A6_✅-0d9488?style=for-the-badge
</div>

Um SaaS que transforma 4 horas de trabalho manual em 15 minutos — importando extratos e notas fiscais, classificando sozinho, conciliando com inteligência e entregando DREs prontos para o cliente e para a diretoria.

[Para Diretores](#-resumo-executivo-para-quem-não-programa) • [Mapa do Sistema](#️-mapa-do-sistema) • [Jornada das Sprints](#-jornada-de-desenvolvimento-sprints-131) • [Arquitetura](#️-arquitetura-para-a-equipe-técnica) • [Roadmap](#️-roadmap-onde-chegamos-e-onde-vamos)

</div>

📋 Ordem sugerida do Roadmap (para ficar consistente)
Para evitar mais duplicações no futuro, o Roadmap deve ter estas 8 seções únicas, nesta ordem:
✅ FASES 1–2.5 — Fundação + BI + Fiscal + Bancário + Contábil (Sprints 1–30)
✅ FASE 3 — PRODUÇÃO (Sprint 31)
✅ FASE 4 — EXPANSÃO COMERCIAL (A1–A7) 🏁
✅ FASE 5 — PESSOAS (B1–B5) 🏁
🚧 FASE 6 — MERCADO & MENTORIA (C1–C4, D1–D3, E1–E3)
🤖 FASE 7 — FUNCIONÁRIO DIGITAL AURORA (FD-1 → FD-9)
🛡️ FASE 8 — PRODUÇÃO EM NUVEM (Sprints 32–34)
📖 Glossário

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
│                       CONTÁBIL                              │
│ Plano de Contas SCI → Lançamentos → Ponte Bancário→Contábil │
│ → DRE Oficial do Cliente → Exportação SCI                   │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ INTELIGÊNCIA (BI) │
│ DRE do Escritório → Ponto Fora da Curva → Simulador Trib. │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ 🤖 FUNCIONÁRIO DIGITAL (AURORA)                             │
│ Mesa de trabalho → Aprovações → Auditoria → Relatórios      │
│ 4 skills: Conciliação • Classificação • Ponte • PDF mensal  │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────┐
│ 🤖 FUNCIONÁRIO DIGITAL (AURORA) — 5 skills                  │
│ Conciliação • Classificação • Ponte Contábil •              │
│ Relatório Mensal (PDF) • NFS-e (ABRASF)                     │
│ Mesa → Aprovações → Auditoria → Relatórios → NFS-e          │
└─────────────────────────────────────────────────────────────┘

---

## ✨ Módulos e Funcionalidades

🔐 Segurança, Plataforma e Gestão de Usuários (NOVO)
Login com JWT + refresh token e proteção de rotas (Frontend e Backend).
Multi-tenant: cada escritório vê APENAS os seus dados (companyId).
Gestão Completa de Usuários e RBAC (Super Admin, Admin, Gerente, Usuário, Cliente).
Ciclo Seguro de Senhas: Admin gera senha provisória (exibida 1x + clipboard).
Troca Forçada de Senha: Modal bloqueante no 1º login com checklist de força em tempo real.
Soft Delete (Exclusão Lógica): Preserva histórico de auditoria e libera o e-mail para reuso futuro.
Travas de Segurança: Impossibilidade de auto-exclusão e proteção do último Admin do tenant.
Módulos liberados por plano de assinatura (allowedModules).

💼 Comercial (Fase A — 6/7 sprints concluídas)
[x] A1: Motor de Herança de Planos (domínio puro — 6 testes verdes, ADR-020)
[x] A2: Valor de Referência + Dinheiro na Mesa (GET /resolved + POST /insights)
[x] A3: Versões de Proposta (cadeia version/isCurrent/originalProposalId)
[x] A4: Fechamento com Ganho (slider de desconto + memória de cálculo em
    `closingDetails` JSON + alerta 🟡 belowCurrent)
[x] A5: White-label de propostas (cores/logo/rodapé por tenant via CSS
    variables, fallback Conta Certa; GET/PATCH /company/branding)
[x] A6: PDF v2 Premium + PNG 1080×1350 p/ WhatsApp (jsPDF+autoTable client-side,
    Canvas 2D nativo, logo proporcional em chip branco)
[ ] A7: Dashboard de Desempenho (funil, tempo médio, desconto médio, ganho
    acumulado, top fechamentos, motivos de perda) — PRÓXIMA
[x] 🆕 Motor de Herança de Planos (A1): START/PRIME/BLACK herdam itens automaticamente
[x] 🆕 Valor de Referência + "Dinheiro na Mesa" (A2): quanto o cliente deixa de ganhar
[x] 🆕 Versões de Proposta (A3): reenvio sem perder o histórico
[x] 🆕 Fechamento com Ganho (A4): slider de desconto + memória de cálculo
[x] 🆕 White-label (A5): cores/logo/rodapé do escritório via CSS variables
[x] 🆕 PDF v2 Premium + PNG 1080×1350 (A6): geração client-side, logo proporcional

🏆 Diferenciais competitivos conquistados
| Recurso | Benefício comercial |
|---|---|
| Motor de herança de planos | Planos START/PRIME/BLACK herdam itens automaticamente |
| Dinheiro na mesa | Mostra ao vendedor quanto ele está perdendo por não subir o preço |
| Versões de proposta | Reenvia a proposta ajustada sem perder o histórico |
| Fechamento com memória | Desconto, ganho vs atual e "passos da negociação" gravados |
| Proposta white-label | Cores/logo/rodapé do escritório (não da Conta Certa) |
| PDF + PNG no cliente | Geração instantânea, zero carga no servidor |
| PNG para WhatsApp | Card 1080×1350 pronto para compartilhar com o cliente |

📊 Dashboard Executivo & BI
KPIs em tempo real (clientes, faturamento, pessoas, metas).
Gráficos nativos em CSS puro (zero dependências pesadas, -200KB bundle).
DRE do Escritório, Ponto Fora da Curva e Simulador Tributário.
Score 0–100 do Escritório, Indicadores com fórmula segura e Mentoria/Ranking.


### 👥 Pessoas & Clientes
- [x] CRUD de colaboradores + Turnover automático por setor
- [x] Carteira de clientes com honorários, status e ticket médio
- [x] Importação em massa da carteira (~100 clientes de uma planilha) sem duplicar
🧾 Fiscal, Bancário e Contábil SCI
Fiscal: Upload de NF-e em lote, Estoque Kardex com custo médio, Apuração de ICMS e SPED Bloco H.
Bancário: Parser de CSV à prova de erros, classificação com memória de aprendizado, naturezas por cliente e trava de compliance no fechamento.
Contábil SCI: Ciclo por cliente, sugeridor de contraparte→conta, anti-duplicidade e exportação SCI com números reduzidos e decimal ponto.
Conciliação Inteligente: Motor que cruza débitos do banco × NF-e com score de confiança (🟢≥80% / 🟡50–79% com revisão humana).

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

### 🧾 Auditoria Tributária de NF-e (Sprint F6)
| Recurso | Benefício |
| --- | --- |
| Parser XML completo | Captura ICMS/IPI/PIS/COFINS com base + alíquota + CST |
| Auditoria automática | Tabela Base × Alíquota = Valor com selo ✓ OK / ⚠ diverge |
| Explicação de erros | Diagnóstico guiado (campo ausente, parser antigo, redução de base) |
| Tratamento de casos especiais | CST 51 diferimento, CST 60 ST, IPI por unidade, PIS/COFINS por quantidade |
| Tolerância fiscal | R$ 0,02 de arredondamento (padrão brasileiro) |

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

🤖 Funcionário Digital Aurora (FD-1 a FD-4 ✅)
Regra de Ouro (ADR-030): A automação prepara, calcula e recomenda. O humano aprova tudo que gera obrigação legal.
RECONCILIATION: Concilia Banco × NF-e com score (Cron diário).
CLASSIFICATION: Classifica transações usando memória de aprendizado.
ACCOUNTING_BRIDGE: Promove lançamentos bancários para a contabilidade.
MONTHLY_REPORT & GUIAS: Geração de PDFs mensais e cálculo de DAS/ISS com memória de auditoria.

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
✅ FASE 3 — PRODUÇÃO (Sprint 31)
Docker Compose (Postgres 5433 / Backend 3001 / Frontend 3000)
Build otimizado (Next standalone + NestJS multi-stage)

✅ FASE 4 — EXPANSÃO COMERCIAL (Plano Conta Certa 2.0) — FASE A COMPLETA 🏁
Baseada na análise competitiva de 11 vídeos do Radar Gestão Estratégica.
A1: Motor de Herança de Planos (domínio puro, 6 testes verdes, ADR-020) ✅
A2: Valor de Referência + "Dinheiro na Mesa" (GET /resolved + POST /insights) ✅
A3: Versões de Proposta (cadeia version/isCurrent/originalProposalId) ✅
A4: Fechamento com Ganho (slider desconto + memória em `closingDetails` + 🟡 belowCurrent) ✅
A5: White-label de propostas (cores/logo/rodapé por tenant via CSS variables, fallback Conta Certa) ✅
A6: PDF v2 Premium + PNG 1080×1350 p/ WhatsApp (jsPDF+autoTable client-side + Canvas 2D, logo proporcional em chip branco) ✅
A7: Dashboard de Desempenho (funil, tempo médio, desconto médio, ganho acumulado, top fechamentos, motivos de perda) ✅
🏆 Diferenciais comerciais conquistados na Fase A
| Recurso | Benefício comercial |
|---|---|
| Motor de herança de planos | START/PRIME/BLACK herdam itens automaticamente |
| Dinheiro na mesa | Mostra quanto o vendedor perde por não subir o preço |
| Versões de proposta | Reenvia ajustada sem perder o histórico |
| Fechamento com memória | Desconto, ganho vs atual e "passos da negociação" gravados |
| Proposta white-label | Cores/logo/rodapé do escritório (não da Conta Certa) |
| PDF + PNG no cliente | Geração instantânea, zero carga no servidor |
| Dashboard de desempenho | Funil + ganho acumulado + top fechamentos |

✅ FASE 5 — PESSOAS (Plano Conta Certa 2.0) — FASE B COMPLETA 🏁
B1: Tipos contratuais (CLT/Estagiário/Terceirizado/Sócio) — enum forte ADR-047 ✅
B2: Distribuição por setor VALIDADA (benchmark contábil ±5 p.p., ADR-048) ✅
B3: KPIs novatos/críticos (flag 🔑 com cópia histórica, ADR-049) ✅
B4: Entrevista de desligamento c/ IA (motor rules-v1, causa-raiz + plano de ação, ADR-050) ✅
B5: Benchmark de Cargos por Setor (domínio puro ADR-051, maiores restos, gaps VACANCY/OK/OVER) ✅
🏆 Diferenciais de People conquistados na Fase B
| Recurso | Benefício |
|---|---|
| Distribuição validada ao vivo | Fonte da verdade = Employee.department (sem preencher manualmente) |
| Flag crítico 🔑 | "Estamos perdendo quem não podíamos perder?" com cópia histórica |
| Entrevista c/ IA | 7 causas-raiz + plano de ação sugerido (humano decide — ADR-031) |
| Benchmark de cargos | "Minha equipe tem os cargos certos em cada setor?" |
| Análises IA agregadas | Top causas-raiz e planos de ação do ano inteiro |

✅ FASE C — MERCADO (Plano Conta Certa 2.0) — COMPLETA
C1: Benchmark de softwares (híbrido rede+catálogo) ✅
C2: Serviços extras c/ preço médio + dinheiro na mesa ✅
C3: Indicadores c/ fórmula (parser seguro, zero eval) ✅
C4: Score 0–100 do Escritório (5 dimensões) ✅ 
✅ FASE D — MENTORIA & GAMIFICAÇÃO — COMPLETA
D1: Visão de Futuro (norte + focos do Score) ✅
D2: Checklist Meu Plano (persistido + % execução) ✅
D3: Ranking de Níveis (Bronze→Diamante + pódio) ✅
🚧 PRÓXIMO: Aurora FD-5/6/8 → depois Fase E + Produção (32–34).

🚧 PRÓXIMAS FASES
Fase C (Mercado): C1 benchmark de softwares • C2 serviços extras c/ preço médio • C3 indicadores c/ fórmula • C4 score 0–100.
Fase D (Mentoria): D1 Visão de Futuro • D2 checklist/Meu Plano • D3 ranking níveis.
Fase E (UX): E1 command palette • E2 boas-vindas/"onde parou" • E3 notificações.
Recomendado começar pela **C1** (reaproveita `Company.softwareStack` da "Minha Empresa").

🧠 FASE 6 — MENTORIA & UX
D1–D3: Visão de Futuro, checklist, ranking de níveis
E1–E3: Command palette, boas-vindas/"onde parou", notificações
🤖 FASE 7 — FUNCIONÁRIO DIGITAL AURORA (FD-1 → FD-9)
✅ FD-1 Fundação: 6 tabelas + dashboard + menu + crons ↔ toggles
✅ FD-2 Completa: 4 skills + Central de Aprovações + Relatórios Mensais (99 PDFs)
✅ FD-3a NFS-e ABRASF 2.0 + NfseImportSkill
✅ FD-3b Coleta IMAP (collector com SKIP gracioso)
✅ FD-4 Guias de imposto (DAS/ISS) com memória de cálculo (ADR-038)
⏳ FD-5 CNAB 240/400 + régua de cobrança
⏳ FD-6 SPED completo + certificado A1 criptografado
⏳ FD-7 Integração Domínio/Questor/Sage
⏳ FD-8 Legalização (cofres AES-256-GCM — ADR-032)
⏳ FD-9 DP leve (integração, não construção do zero)
🛡️ FASE 8 — PRODUÇÃO EM NUVEM
Sprint 32: Deploy em VPS + nginx + Let's Encrypt
Sprint 33: CI/CD (GitHub Actions)
Sprint 34: Monitoramento (Sentry) + Backup automático


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

# 🎯 RADAR CONTA CERTA
O cérebro digital do escritório contábil

Next.js 16 • NestJS 10 • PostgreSQL 15 • Prisma 5 • Sprints 1–31 + Conta Certa 2.0 + Aurora

Um SaaS que transforma 4 horas de trabalho manual em 15 minutos — importa extratos
e notas, classifica sozinho, concilia com inteligência, entrega DREs prontos e agora
fecha o ciclo contábil SCI por cliente (balancete → razão → extrato → exportação).

## 📌 Resumo Executivo (para quem não programa)
💡 Em uma frase: sistema na nuvem que automatiza a rotina contábil de ponta a ponta —
do extrato do banco ao relatório final — com segurança, rastreabilidade e regras
determinísticas (zero "caixa-preta").

😫 Antes: digitar extrato planilha por planilha (2–4 h/cliente), classificar "na mão",
conferir Pix × NF-e no olho, montar DRE no Excel.
🤖 Com o Radar: importar extrato em 10 s; classificação com memória que aprende com o
contador; conferência Banco × NF-e automática; DRE e arquivo SCI em 1 clique.

🔢 Resultados reais medidos:
• Cliente-piloto Academia: 74 transações classificadas em segundos; DRE fechado batendo
com o banco; 90% classificado sozinho no mês seguinte.
• Ciclo SCI (Grupo Escoteiros): 810 contas sincronizadas do balancete; 56 pares
contraparte→conta aprendidos; exportação SCI com nºs reduzidos (489;819) e decimal
com ponto; extratos imprimíveis/PDF por cliente.
• Conta Certa 2.0: Score do escritório 51 (Atenção) c/ plano de mentoria e ranking;
propostas com versões, fechamento com ganho e white-label.

## 🗺️ Mapa do Sistema
Operacional: Dashboard → Pessoas/Turnover → Clientes/CRM → Projetos/Tarefas.
Comercial 2.0: Precificação → Planos (herança) → Propostas (versões/white-label) →
Fechamento c/ ganho → Desempenho.
Fiscal: NF-e → Kardex → ICMS → SPED Bloco H.
Bancário: Extrato → Classificação c/ memória → DRE Bancário → Fechamento c/ trava.
Contábil SCI: Balancete+Razão (base) → Extrato inteligente 🟢🟡🟠 → Partidas dobradas →
Exportação SCI reduzida → DRE Oficial × Bancário.
Aurora: crons preparam/conferem/sugerem; humano aprova obrigação legal.
Inteligência: DRE Escritório • Ponto Fora da Curva • Simulador • Score • Mentoria • Ranking.

## ✨ Módulos e Funcionalidades
🔐 Plataforma: JWT+refresh • multi-tenant por companyId • RBAC 3 camadas • módulos por
plano de assinatura.
📊 Dashboard executivo c/ gráficos CSS puro (ADR-001).
👥 Pessoas & Clientes: turnover, carteira MRR/Churn, importação em massa sem duplicar,
onboarding 3 abas c/ plano de contas vinculado (ADR-072).
💰 Comercial 2.0: herança de planos (ADR-020), dinheiro na mesa, versões de proposta,
fechamento com desconto+ganho, white-label (cores do cliente), PDF v2 premium + PNG.
🧾 Fiscal: NF-e em lote, Kardex c/ custo médio, ICMS, SPED H010 17 colunas, auditoria.
🏦 Bancário: parser à prova de erros, memória por contraparte, naturezas por cliente,
fechamento com trava de compliance.
📒 Contábil SCI (ETAPAS 1–3 ✅): ciclo por cliente; multi-planos 90113/90132/...;
sugeridor contraparte→conta; anti-duplicidade (somente novos/substituir); exportação
SCI com nºs reduzidos e decimal ponto (ADR-073); impressão/PDF de extratos (ADR-074).
🤖 Aurora (FD-1→4 ✅): conciliação, classificação, ponte contábil, relatórios PDF,
NFS-e ABRASF + IMAP, guias DAS/ISS/DARF com memória de cálculo e aprovação humana.
🔗 Conciliação Banco × NF-e c/ score 🟢≥80 / 🟡50–79 e revisão obrigatória.
📈 BI & 2.0: DREs, ponto fora da curva, simulador, indicadores c/ fórmula (ADR-054),
Score 0–100 (ADR-055), mentoria (ADR-056), checklist (ADR-057), ranking (ADR-058).

## 🏆 O Diferencial: os 3 DREs
🏢 Escritório (diretoria) • 💼 Bancário do Cliente (caixa) • 📒 Oficial do Cliente
(obrigações) — conversam por cards cruzados; Oficial mostra a diferença em R$ contra o
Bancário (auditoria em tempo real).

## 🏗️ Arquitetura
FE Next.js 16 (React 19 + Tailwind + Zustand + Sonner) → REST+JWT → BE NestJS 10
(Controllers→Services→DTOs, Guards, RBAC) → Prisma → PostgreSQL 15 (~40 tabelas,
isolamento por companyId, enums fortes, soft delete, índices).
Princípios: enums como verdade • idempotência por upsert • revisão humana obrigatória •
compliance primeiro (SPED layout fixo, mês fechado imutável) • cálculo determinístico no
backend • zero dependência pesada de gráfico.

## 🗄️ Modelo de Dados (destaques)
Plataforma: Company/User • Gestão: Employee/Client(+accountingPlan)/ClientContract/
ClientService • Comercial: Proposal/CommercialPlan/ServiceItem • Fiscal: FiscalInvoice/
Product/InventoryMovement/IcmsApuration • Contábil: AccountingAccount(seq/accountNumber/
planName)/AccountingEntry/TrialBalance/LedgerImport/HistoricalEntry/AccountTemplate •
Bancário: BankStatement/Transaction/Category/ClassificationRule • Conciliação:
BankNfeMatch • Aurora: ApprovalRecord • Operação: Project/Task.

## 🔌 API (rotas-chave por módulo)
Auth • Clients(+import/metrics) • Fiscal(invoices/upload, inventory, icms, sped) •
Banking(import/statement/close/reopen, reconcile) • Accounting(accounts, entries,
promote-from-banking, dre, export-sci, trial-balance/import, ledger/import,
import/parse-smart, import/save-smart, plans, client-plan, chart/import) •
History(import-base, reconcile, export-sci) • BI(dre/outliers/simulate-tax, score,
mentoria, ranking) • Aurora(relatorios/nfse/guias).

## 📜 Jornada de Desenvolvimento
1–7 Fundação 🟢 • 8–19 Fiscal 🟢 • 20 Contábil SCI v1 🟢 • 21–24 Bancário 🟢 •
25–26 Ponte+DRE Oficial 🟢 • 27–28 UX/menu 🟢 • 29 Conciliação Banco×NF-e 🟢 •
30 Docs 🟢 • A1–A7 Comercial 2.0 🟢 • B1–B5 Pessoas 2.0 🟢 • C1–C4 Mercado 2.0 🟢 •
D1–D3 Mentoria 🟢 • FD-1→4 Aurora 🟢 • Ciclo SCI ETAPAS 1–3 🟢 (25/08) •
31 Docker Compose 🟡 (homologando).

## 🔧 Decisões técnicas que salvaram o produto (ADR-resumo)
Parser por conteúdo • datas por máscara • memória por contraparte normalizada •
upsert (companyId,code) • DRE pelo sinal da transação • estorno por replay no Kardex •
CSV UTF-8+BOM • Sonner action c/ onClick • Lucide title via wrapper • nºs reduzidos na
exportação SCI c/ decimal ponto • plano de contas por cliente.

## 🚀 Instalação (3 passos)
1) Backend: cd backend && npm i && cp .env.example .env && npx prisma migrate deploy &&
npx prisma generate && npm run start:dev (→ :3001).
2) Frontend: cd frontend && npm i && cp .env.example .env.local && npm run dev (→ :3000).
3) Docker (opcional): docker compose up -d --build (postgres :5433 virgem; app sobe junto).
Acesso: http://localhost:3000 (admin do seed).

## 🗺️ Roadmap — onde chegamos e onde vamos
✅ FASES 1–2.5 + 2.0 (A–D) + Aurora FD-1→4 + Ciclo SCI (Sprints 1–31).
 FASE 3 — PRODUÇÃO: 32 VPS+nginx+HTTPS • 33 CI/CD • 34 Sentry+backup.
🔜 AURORA FD-5→FD-8 (CNAB, SPED completo+A1, integrações, cofre AES-256-GCM) — próxima
entrega all-in-one.
🔜 FASE E UX: Ctrl+K (homologando) • "onde parou" • notificações.
📦 EXPANSÃO: Portal do Cliente • eSocial/Sintegra • app mobile.
✅ FASE 3 — PRODUÇÃO (parcial)
   + Sprint 31 · Docker + docker-compose ✅
   + Sprint 32 · Deploy em nuvem/VPS ⏳
   + Sprint 33 · CI/CD (GitHub Actions) ⏳
   + Sprint 34 · Monitoramento (Sentry) + Backup automático ⏳

✅ FASE 4 — EXPANSÃO COMERCIAL (parcial)
   + Sprint A1 · Herança de planos (domínio) ✅
   + Sprint A2 · Valor de referência + Dinheiro na Mesa ✅
   + Sprint A3 · Versões de proposta ✅
   + Sprint A4 · Fechamento c/ ganho 
   + Sprint A5 · White-label 
   + Sprint A6 · PDF v2 + PNG ⏳
   + Sprint A7 · Dashboard de desempenho ⏳

   
## 📖 Glossário (para a diretoria)
SaaS • Multi-tenant • DRE • NF-e/NFS-e • Kardex • SPED • Partidas dobradas • Conciliação •
Score • Plano de contas (90113/90132) • Nº reduzido (819) • Aurora (funcionário digital).

## 🧠 Continuidade (Sistema de Memória)
CONTEXTO_PROJETO.md (cole inteiro na 1ª mensagem) • CHANGELOG.md (atualizar a cada
sprint) • Skill_RadarContaCerta-Architect.txt. Fluxo: colar contexto → IA confirma →
trabalha no sprint atual → atualiza docs → valida com o Marcos.

## 🤝 Licença & Autor
Proprietary License — Copyright © 2026 Conta Certa Soluções Empresariais.
Autor: Marcos — Full Stack. Suporte: contato@contacerta.com.br • www.contacerta.com.br
Feito com ❤️ para transformar a contabilidade brasileira.
