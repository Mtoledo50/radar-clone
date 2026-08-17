## [Sprint FD-1] 2026-08-15 — Aurora: Fundação do Funcionário Digital 🌅

### ✅ Added
- Migração `fd1_foundation_robot_worker`: 6 tabelas + 6 enums.
- Módulo `digital-employee`: service (lazy create + KPIs), controller (8 endpoints JWT),
  `AutomationAuditService`, `JobRunnerService`, `SchedulerService`, `BaseSkill` (Pilar B)
  e `ReconciliationSkill` (reusa `BankingReconcileService`).
- Endpoint `POST /digital-employee/skills/:skillKey/run` (botão "Rodar agora").
- Dashboard `/dashboard/funcionario-digital` (header 🌅, 4 KPIs, timeline, fila 🟡,
  skills c/ toggle, auditoria; refresh 30s) + item no menu (seção INTELIGÊNCIA).
- CORS multi-origem no `main.ts` (3000/3002).

### 🧠 Decisions
ADR-030 Regra de Ouro (LEGAL nunca é AUTO) • ADR-031 cálculo determinístico
(IA só sugere) • ADR-032 cofres AES-256-GCM (FD-8) • ADR-033 perfis de aprovação •
ADR-034 arquivos estruturais: sempre delta, nunca substituição total.

### 🏁 Status
HOMOLOGADO em banco local (5432): login, lazy create, run MANUAL (3ms),
auditoria `SKILL_FINISHED:RECONCILIATION` e dashboard com dados reais.


🤖 Funcionário Digital Radar — Protótipo Visual + Catálogo de Funções
Perfeito, Marcos. Antes de qualquer código, vamos ver o produto e listar o que ele vai saber fazer. Este é o nosso "blueprint" — se você aprovar, a Sprint FD-1 nasce exatamente daqui.
1. 🖥️ Como ficaria a tela — /dashboard/funcionario-digital
Visão geral da página
┌────────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Dashboard › Funcionário Digital                                             │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │   ╭───╮                                                                    │ │
│ │   │🤖│  Rô, o Funcionário Digital          ● TRABALHANDO AGORA (teal)     │ │
│ │   ╰───╯  Contratado: 15/08/2026 • Jornada 24/7 • Não tira férias          │ │
│ │                                                                            │ │
│ │   [ ⏸ Dar uma pausa ]   [ ⚙️ Configurar habilidades ]                     │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐ │
│ │ 📋 TAREFAS   │ │ ✅ RESOLVIDAS│ │ 🟡 PRECISO   │ │ ⏱ TEMPO ECONOMIZADO   │ │
│ │    HOJE      │ │   SOZINHO    │ │   DE VOCÊ    │ │                        │ │
│ │      4       │ │     132      │ │      7       │ │  Hoje: 3h40            │ │
│ │ 2 concluídas │ │  ≥80% score  │ │  50–79%      │ │  Este mês: 86h         │ │
│ │ 1 rodando    │ │              │ │  [Revisar →] │ │  ≈ R$ 2.580 salvos     │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────────┘ │
│                                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────┐ │
│ │ [ 📅 Jornada ] [ 🟡 Fila de revisão (7) ] [ 🧩 Habilidades ] [ 📝 Auditoria]│ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘

Aba 1 — 📅 Jornada do dia (timeline de execuções)
┌────────────────────────────────────────────────────────────────────────────────┐
│  HOJE, 15/08/2026                                                              │
│                                                                                │
│  02:00 ● ✅ Conciliação Banco × NF-e          47 itens  41 auto  6 p/ revisão │
│        │   Cliente: Academia do Renan • 12s • score médio 91%                 │
│  02:01 ● ✅ Classificação de extrato          85 itens  78 auto  7 p/ revisão │
│        │   Memória de aprendizado acertou 92% das categorias                  │
│  02:02 ● ✅ Lançamentos contábeis (ponte)     41 partidas dobradas geradas    │
│        │   Nenhuma divergência • auditado                                     │
│  09:15 ◐ 🔄 Rodando agora: Checklist pré-fechamento…                          │
│                                                                                │
│  ┌─ Corridas por dia (últimos 14 dias) — gráfico CSS puro (ADR-001) ────────┐ │
│  ▂▃▅▇▅▃▂▃▅▇█▇▅▃                                                             │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘

Aba 2 — 🟡 Fila de revisão (human-in-the-loop)

┌────────────────────────────────────────────────────────────────────────────────┐
│  O funcionário parou nestes itens e está esperando você (50–79% de confiança): │
│                                                                                │
│ ┌──────────────────────────────────────────────────────────────────────────┐   │
│ │ 🟡 72%  PIX recebido 13/08 R$ 350,00 — possível NF-e 45.882              │   │
│ │         Academia do Renan • Cliente: Renan Fitness                        │   │
│ │         [ ✅ Confirmar ]  [ ❌ Não é essa ]  [ 🔍 Ver detalhes ]          │   │
│ ├──────────────────────────────────────────────────────────────────────────┤   │
│ │ 🟡 64%  Tarifa bancária R$ 89,90 — sugerido: "Despesas bancárias"        │   │
│ │         [ ✅ Confirmar ]  [ ✏️ Corrigir ]  ← correção alimenta a memória │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                │
│  💡 Cada correção sua aqui deixa o funcionário mais inteligente (memória).     │
└────────────────────────────────────────────────────────────────────────────────┘

Aba 3 — 🧩 Habilidades (o "treinamento" do funcionário)

┌────────────────────────────────────────────────────────────────────────────────┐
│  Habilidade                    Quando roda        Última vez      Status      │
│ ─────────────────────────────────────────────────────────────────────────────  │
│  🔁 Conciliação Banco × NF-e   Todo dia 02:00     hoje 02:00     [● ON ]     │
│  🏷️ Classificação c/ memória   Todo dia 02:01     hoje 02:01     [● ON ]     │
│  📒 Lançamentos contábeis      Todo dia 02:02     hoje 02:02     [● ON ]     │
│  📋 Checklist pré-fechamento   Dias 25 e 30       30/07 23:00    [● ON ]     │
│  🧾 Emissão de guias           —                  —              [○ OFF] 🔒  │
│  📨 Obrigações acessórias      —                  —              [○ OFF] 🔒  │
│  💬 WhatsApp (avisos)          —                  —              [○ OFF] 🔒  │
│                                                                                │
│  Cada linha tem botão  [▶ Rodar agora]  → dispara manualmente                  │
│  🔒 = disponível a partir da Sprint FD-4/FD-5/FD-6                             │
└────────────────────────────────────────────────────────────────────────────────┘

Aba 4 — 📝 Auditoria (compliance contábil)

┌────────────────────────────────────────────────────────────────────────────────┐
│  15/08 02:00  🤖 CONCILIOU_AUTO   Tx #4471 ↔ NF-e 45.882   score 94%          │
│  15/08 02:01  🤖 CLASSIFICOU_AUTO Tx #4472 → "Vendas PIX"  score 88%          │
│  15/08 02:02  🤖 LANÇOU           Partida #902 D:1.1.01 C:3.1.01  R$ 350,00   │
│  15/08 09:20  👤 Marcos aprovou pendência #12 (score 72%)                     │
│  [ Filtros: data • tipo • cliente ]  [ ⬇ Exportar CSV (UTF-8+BOM, ADR-002) ] │
└────────────────────────────────────────────────────────────────────────────────┘

Identidade visual aplicada: botões e status ativo em teal #0d9488 · pendências/alertas em laranja #f97316 · textos neutros em #475569 · tooltips Lucide com wrapper <span title> (ADR-021) · toasts Sonner com onClick (ADR-024).
2. 🧩 Catálogo de funções sugeridas (o que o funcionário "sabe fazer")
Organizei em ondas de entrega, sempre reutilizando os motores que o Radar já tem (nada de reinventar):
🌊 Onda 1 — Sprint FD-2 (cérebro já existe, só ligar no automático)

#
Função (skill)       O que faz         O que reaproveita   Gatilho
1🔁 Conciliação automática
Cruza débitos do banco × NF-e de entrada; ≥80% concilia sozinho, 50–79% manda pra fila
Motor de score existente
Cron 02:00 ou botão
2
🏷️ Classificação com memória
Classifica lançamentos do extrato sozinho; cada correção do contador alimenta a memória
Classificação com aprendizado existente
Cron após import
3
📒 Lançamentos contábeis
Transforma o mês conciliado em escrituração (partidas dobradas) sem o clique
Ponte Bancário → Contábil existente
Cron ou botão
4
📋 Checklist pré-fechamento
Varre o mês: itens não classificados, não conciliados, trava de fechamento — e gera relatório do que falta
Trava de compliance existente
Dias 25 e 30

🌊 Onda 2 — Sprint FD-3 (prova de valor comercial)
#
Função
O que faz
5
⏱ Medidor de tempo economizado
Cada corrida estima horas salvas (base: tempo manual conhecido — ex.: 2h/cliente na digitação) → KPI de marketing
6
📨 Relatório diário
Resumo por e-mail: "hoje o Rô resolveu 132 itens, 7 aguardam você"

🌊 Onda 3 — Sprints FD-4/FD-5 (novas capacidades)

#
Função
O que faz
7
🧾 Emissão de guias
Adaptador de integração (API bancária/gov) — alvo a definir com você
8
📆 Obrigações acessórias
Agenda de prazos (SPED, ICMS), alerta de vencimento e geração automática do arquivo já existente

🌊 Onda 4 — Sprint FD-6 (cereja do bolo)

#
Função
O que faz
9
💬 WhatsApp
Avisa o contador/cliente: "fechamento de julho pronto", "7 itens precisam de você" (provider externo a escolher)


3. ⚙️ Funções internas do orquestrador (backend — para você visualizar o código)
Estas não são "skills do funcionário", são a engrenagem que faz tudo rodar:
Função
Responsabilidade
ensureEmployee(companyId)
Cria o funcionário no 1º acesso (1 por tenant — ADR-004)
pause() / resume()
"Dar férias" / voltar ao trabalho
runSkillNow(skillKey, userId)
Disparo manual pelo botão ▶
scheduleAll()
Lê skills ativas e registra os crons (@nestjs/schedule)
executeSkill(skill)
Abre AutomationRun → executa → aplica regra de confiança → fecha run
applyConfidenceRule(item)
≥80% auto · 50–79% fila humana · <50% descarta (regra já existente!)
approvePending() / rejectPending()
Sua revisão na fila 🟡 (rejeição alimenta a memória)
writeAudit(action, before, after)
Trilha de compliance — tudo que o robô faz fica registrado
getDashboardKpis(companyId)
Alimenta os 4 cards do topo

E no frontend: 1 página + 6 componentes (EmployeeHeader, KpiCards, RunsTimeline, PendingQueue, SkillsPanel, AuditTrail) + 1 store Zustand + 1 client Axios.
4. ✅ Validação (preciso do seu OK antes de codar)
A tela — esse layout (header do funcionário + 4 KPIs + 4 abas) está aprovado? Mudaria algo?
Onda 1 — confirma as 4 skills iniciais (conciliação, classificação, lançamentos, checklist)?
Nome do funcionário — gosta de "Rô, o Funcionário Digital" (de Radar)? Ou prefere outro?
Posso iniciar a Sprint FD-1 (models Prisma + orquestrador + botão "Rodar agora" + tela básica), com código 100% comentado, testes e README ao final?

🤖 FDR — Funcionário Digital Radar: Projeto Completo + Plano de Execução
Marcos, pedido recebido e analisado. Você descreveu 9 áreas de trabalho — isso transforma o FDR de "módulo de automação" em uma plataforma completa de funcionário digital. Vou te entregar o projeto inteiro (arquitetura + modelo de dados + plano realista), mas antes preciso ser honesto com você como CTO: metade dessas funções depende de sistemas externos (portais do governo, Domínio/Questor/Sage, eSocial). Para isso existe uma técnica chamada RPA (robô que opera portais) e ela muda a arquitetura. Vamos por partes, tudo documentado.

1. 🔍 Diagnóstico honesto das 9 funções
#
Função
O que o Radar JÁ tem
O que falta construir
Complexidade
1
Conciliação bancária
✅ Motor de score ≥80%/50–79%, parser de extrato, classificação c/ memória, ponte Bancário→Contábil, trava de fechamento
Coleta automática do extrato + relatório de divergências "pronto p/ revisão"
🟢 Baixa
2
Emissão de guias (DARF/GPS/DAS/ISS)
⚠️ Apuração ICMS existe
Motor DAS/ISS/DARF + emissão nos portais (PGDAS, SicalcWeb) + envio personalizado
🔴 Alta (RPA)
3
Importação NFS-e
✅ Parser XML NF-e existe
Coleta: portal (RPA), e-mail (IMAP), pasta (watcher) + parser NFS-e
🟠 Média-Alta
4
SPED e obrigações
✅ SPED Bloco H gerado
Validação, calendário de prazos, transmissão c/ certificado digital
🔴 Alta
5
Escrituração Domínio/Questor/Sage
❌
Conector por ERP (arquivo de importação ou RPA)
🔴 Alta
6
Abertura e legalização
❌
Cofre de senhas + fluxos eCAC (RPA) + gestão de certificados
🔴 Alta (LGPD!)
7
Departamento pessoal
❌
Folha, eSocial, DCTFWeb, FGTS Digital
⛔ Gigante
8
Faturamento e boletos
⚠️ Módulo comercial existe
CNAB 240/400 (remessa/retorno) + emissão boleto/Pix
🟠 Média
9
Relatórios gerenciais
✅ BI, DREs, export PDF (jspdf), CSV UTF-8+BOM
Pacote mensal automatizado + envio por e-mail
🟢 Baixa

Leitura estratégica: temos 🟢 em 2 funções, ⚠️ em 2, e 🔴 em 5. Ou seja: o plano precisa começar pelo que já existe (gera valor em semanas) e escalar para o RPA (meses). E DP (⛔) merece uma conversa separada — explico na seção 7.
2. 🏗️ Arquitetura em camadas (o coração do projeto)

┌──────────────────────────────────────────────────────────────────────┐
│  CAMADA 1 — ORQUESTRAÇÃO ("o chefe")                                 │
│  Scheduler (cron) • Fila de jobs • Runs • Auditoria • Human-in-loop  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ dispara skills
┌───────────────────────────────┴──────────────────────────────────────┐
│  CAMADA 2 — AS 9 SKILLS (cada função da sua lista = 1 skill)         │
│  1 Conciliação • 2 Guias • 3 NFS-e • 4 SPED • 5 Escrituração ERP     │
│  6 Legalização • 7 DP • 8 Boletos • 9 Relatórios                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ usa conectores
┌───────────────────────────────┴──────────────────────────────────────┐
│  CAMADA 3 — CONECTORES (a "mão" do funcionário)                      │
│  📁 FolderWatcher    → pastas compartilhadas (NFS-e, extratos)       │
│  📧 EmailCollector   → IMAP: lê e-mails c/ XML/anexos                │
│  🏦 BankFile         → CNAB 240/400 (remessa/retorno), OFX/CSV       │
│  🏛 GovPortal (RPA)  → PGDAS, SicalcWeb, eCAC, prefeituras           │
│  🔐 CertSigner       → certificado A1 (assina e transmite SPED)      │
│  🏢 ErpBridge        → Domínio / Questor / Sage (arquivo ou RPA)     │
│  📨 Notifier         → SMTP (e-mail) + WhatsApp (futuro)             │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────┴──────────────────────────────────────┐
│  CAMADA 4 — SEGURANÇA (inegociável)                                  │
│  🔒 Cofre de credenciais (AES-256-GCM) • Certificados A1 criptograf. │
│  📝 Auditoria de 100% das ações • LGPD • isolamento por companyId    │
└──────────────────────────────────────────────────────────────────────┘

Decisão-chave (proposta ADR-025): portais do governo e ERPs antigos não têm API pública → usaremos Playwright (navegador automatizado) num worker separado (fdr-worker), isolado do backend principal. Assim o robô nunca derruba o sistema. Redis + BullMQ entram nesta fase (fila entre backend e worker).
3. 🗄️ Modelo de dados completo (Prisma — draft)

// ============ NÚCLEO DO FUNCIONÁRIO (FD-1) ============
model DigitalEmployee {
  id        String   @id @default(cuid())
  companyId String   @unique              // 1 funcionário por escritório (ADR-004)
  name      String   @default("Rô")
  status    String   @default("ACTIVE")   // ACTIVE | PAUSED
  skills    DigitalEmployeeSkill[]
  runs      AutomationRun[]
}

model DigitalEmployeeSkill {
  id         String    @id @default(cuid())
  employeeId String
  skillKey   String    // RECONCILIATION | TAX_GUIDES | NFSE_IMPORT | ...
  enabled    Boolean   @default(false)
  cronExpr   String    @default("0 2 * * *")
  lastRunAt  DateTime?
}

model AutomationRun {
  id                String   @id @default(cuid())
  employeeId        String
  skillKey          String
  status            String   // RUNNING | SUCCESS | PARTIAL | FAILED
  startedAt         DateTime @default(now())
  finishedAt        DateTime?
  itemsProcessed    Int      @default(0)
  itemsAutoApproved Int      @default(0)   // score ≥80%
  itemsPendingHuman Int      @default(0)   // 50–79% → fila de revisão
  secondsSaved      Int      @default(0)   // métrica de marketing 💰
  errorMessage      String?
  pendings          AutomationPending[]
}

model AutomationPending {
  id         String  @id @default(cuid())
  companyId  String
  runId      String?
  type       String  // MATCH | CLASSIFICATION | DIVERGENCE | GUIDE_REVIEW
  confidence Float?
  payload    Json
  status     String  @default("PENDING")
  resolvedBy String?
}

model AutomationAudit {
  id        String   @id @default(cuid())
  companyId String
  actor     String   @default("DIGITAL_EMPLOYEE")
  action    String
  entity    String
  entityId  String
  detail    Json?
  createdAt DateTime @default(now())
}

// ============ GUIAS (FD-5) ============
model TaxGuide {
  id          String   @id @default(cuid())
  companyId   String
  clientId    String                    // cliente do escritório
  type        String                    // DARF | GPS | DAS | ISS
  period      String                    // "2026-08"
  amount      Decimal  @db.Decimal(15, 2)
  dueDate     DateTime
  barcode     String?
  pdfPath     String?
  status      String   @default("CALCULATED") // CALCULATED|ISSUED|SENT|PAID
  sentVia     String?                   // EMAIL | WHATSAPP
  sentAt      DateTime?
}

// ============ NFS-e (FD-4) ============
model NfseImportJob {
  id         String   @id @default(cuid())
  companyId  String
  clientId   String
  source     String   // PORTAL | EMAIL | FOLDER | MANUAL
  cityHall   String?  // prefeitura (NFS-e é municipal!)
  filesFound Int      @default(0)
  imported   Int      @default(0)
  duplicates Int      @default(0)       // idempotência por upsert
  status     String   @default("PENDING")
}

// ============ OBRIGAÇÕES / SPED (FD-4/FD-6) ============
model ClientObligation {
  id        String   @id @default(cuid())
  companyId String
  clientId  String
  name      String   // SPED | DCTF | EFD-REINF | ISS-MENSAL
  period    String
  dueDate   DateTime
  status    String   @default("SCHEDULED") // SCHEDULED|VALIDATING|READY|TRANSMITTED
  receipt   String?  // recibo de transmissão
}

model CertificateStore {
  id          String   @id @default(cuid())
  companyId   String
  clientId    String?
  type        String   // A1 | A3
  fileEnc     Bytes?   // binário CRIPTOGRAFADO (AES-256-GCM)
  expiresAt   DateTime
  status      String   @default("VALID")
}

model CredentialVault {
  id         String  @id @default(cuid())
  companyId  String
  clientId   String?
  service    String  // ECAC | PGDAS | PREFEITURA_SP | DOMINIO...
  login      String
  secretEnc  Bytes   // senha CRIPTOGRAFADA — NUNCA em texto puro
  updatedAt  DateTime @updatedAt
}

// ============ BOLETOS / CNAB (FD-3) ============
model BillingBatch {
  id           String   @id @default(cuid())
  companyId    String
  type         String   // REMESSA | RETORNO
  layout       String   // CNAB240 | CNAB400
  bank         String
  filePath     String
  lines        Int      @default(0)
  status       String   @default("PENDING")
}

// ============ RELATÓRIO MENSAL (FD-2) ============
model MonthlyReportPack {
  id        String   @id @default(cuid())
  companyId String
  clientId  String
  period    String
  pdfPath   String
  sections  Json     // quais indicadores incluir
  sentAt    DateTime?
}

4. 📅 Plano de execução — 9 fases (realista, valor crescente)
Regra do plano: cada fase entrega valor sozinha. Nunca ficamos 6 meses sem nada funcionando.
🏁 FD-1 — Fundação do funcionário (~2 semanas)
Models do núcleo + migration
Orquestrador (@nestjs/schedule) + botão "▶ Rodar agora"
Dashboard: header do funcionário + KPIs + timeline de runs
Auditoria 100% + fila de revisão
Entrega: funcionário "existe", executa por botão, tudo auditado
🥇 FD-2 — Vitórias rápidas (~3 semanas) — valor imediato!
Skill 1: conciliação automática (reusa motor existente) + relatório de divergências pronto p/ revisão
Skill 9: pacote de relatórios mensais em PDF (reusa jspdf + BI) + envio por e-mail agendado dia 5
Entrega: "o funcionário concilia sozinho e entrega o relatório na reunião" 🎯
🥈 FD-3 — Faturamento e boletos (~3 semanas)
Gerador de CNAB 240/400 (remessa) + parser de retorno
Emissão de cobrança (boleto/Pix) mensal ou avulsa por cliente
Conferência automática do retorno × contas a receber
Entrega: cobrança do escritório inteira no automático
🥉 FD-4 — NFS-e sem digitação (~4 semanas)
Coleta por pasta (watcher em pasta compartilhada) + coleta por e-mail (IMAP)
Parser NFS-e padronizado (começa pelos layouts das prefeituras dos seus clientes-piloto)
Importação direta no módulo fiscal (idempotente, nunca duplica)
Coleta em portal (RPA) fica para FD-7
Entrega: notas municipais entram sozinhas
🏅 FD-5 — Guias (a mais pedida) (~5 semanas)
Motor de apuração: DAS (Simples Nacional), ISS, DARF, GPS
Worker RPA (Playwright) para emissão em PGDAS/SicalcWeb
Envio automático por e-mail com mensagem personalizada por cliente
Tudo passa pela fila de revisão antes de enviar (compliance!)
Entrega: "guias do mês prontas e enviadas aos clientes"
🎖 FD-6 — SPED e fechamento no 5º dia útil (~4 semanas)
Calendário de obrigações por cliente (ClientObligation)
Validação dos arquivos gerados + consolidação
Transmissão com certificado A1 (cofre criptografado)
Alertas de prazo (D-3, D-1, vencendo)
Entrega: fechamento sem correria, com recibo arquivado
🏆 FD-7 — Escrituração nos ERPs (~5 semanas)
Conector padronizado: FDR gera arquivo no layout do Domínio, Questor ou Sage (1º escolhido por você)
Lançamentos recorrentes a partir dos documentos já padronizados
Coleta RPA nos portais de prefeitura que faltaram na FD-4
Entrega: escrituração sai do Radar direto para o ERP
🎯 FD-8 — Abertura e legalização (~4 semanas)
Cofre de senhas web + procurações + vínculos eCAC (fluxos RPA)
Checklist de onboarding de cliente novo (documentos, certificado, senhas)
Atenção: fase com maior carga de LGPD — revisão de consentimento e logs
⚠️ FD-9 — Departamento pessoal (decisão necessária — ver seção 7)
5. 🔄 O "dia" do funcionário (como fica na prática)

02:00  📧 Varre e-mails e pastas → importa NFS-e e extratos (FD-3/4)
02:30  🔁 Concilia banco × NF-e × contábil → divergências p/ revisão (FD-2)
03:00  🧾 Apura DAS/ISS/DARF/GPS do mês (FD-5)
06:00  📨 Envia guias por e-mail c/ mensagem personalizada (FD-5)
08:00  📊 Gera pacote de relatórios PDF dos clientes do dia (FD-2)
09:00  👤 CONTADOR CHEGA: só revisa a fila 🟡 e aprova
D-3    ⏰ Alerta de obrigações vencendo (FD-6)
Dia 5  ✅ SPED transmitido, mês fechado, recibo arquivado

6. 📝 ADRs propostas (para registrar na validação)
ADR
Decisão
Motivo
025
Playwright em worker separado (fdr-worker) + BullMQ/Redis
Portais não têm API; isola o robô do backend
026
Cofre de credenciais AES-256-GCM (chave em env)
LGPD; senhas nunca em texto puro
027
Certificado A1 criptografado no banco; uso só p/ assinatura
Compliance fiscal
028
Toda ação do FDR gera AutomationAudit
Rastreabilidade contábil
029
Guia/SPED/transmissão sempre passam por revisão humana até Marcos configurar o contrário
Segurança fiscal primeiro


7. ⚠️ Minha recomendação sincera sobre DP (função 7)
Departamento pessoal com eSocial + DCTFWeb + FGTS Digital é um sistema inteiro à parte (milhares de regras legais que mudam todo ano). Construir do zero levaria mais de 1 ano e risco jurídico alto. Três caminhos:
Integração leve (recomendo): o FDR coleta documentos, prepara admissão/rescisão e exporta para o sistema de DP que o escritório já usa — mesma estratégia dos ERPs (FD-7).
Parceria/white-label com um DP existente.
Construir do zero — só se for o diferencial comercial central (não parece ser o caso ainda).
8. ✅ Validação — preciso de 5 respostas suas para abrir a FD-1
Prioridade: confirma a ordem? (FD-2 primeiro = conciliação + relatórios, que é o que já temos quase pronto)
DP: aceita o caminho 1 (integração leve) por enquanto?
ERP-alvo da FD-7: Domínio, Questor ou Sage primeiro?
Piloto: Academia do Renan continua como cliente-piloto das automações? Qual a prefeitura dele (para a NFS-e)?
Certificado A1 você já tem para testarmos na fase de SPED/guias?

1. Conceito do sistema
O ideal é criar uma plataforma chamada, por exemplo:
Funcionário Digital Contábil
Com funções principais:
Coleta de documentos e dados
Extratos bancários
NFS-e
Notas fiscais
Boletos
Arquivos CNAB
Documentos de departamentos pessoal e fiscal
Processamento e interpretação
OCR/PDF
Leitura de XML
Leitura de OFX, CNAB, XLSX, CSV
Classificação de documentos
Extração de campos: CNPJ, valor, data, código de serviço, banco, conta etc.
Cruzamento contábil/fiscal
Extrato x lançamentos
NFS-e x escrituração
Impostos x faturamento
Folha x eSocial/DCTFWeb
Boletos x retorno bancário
Apontamento de divergências
Valores diferentes
Documentos não encontrados
Impostos não gerados
Cadastros inconsistentes
Prazos críticos
Revisão humana
Painel de aprovação
Divergências pendentes
Histórico de alterações
Responsável pela aprovação
Trava para não transmitir sem conferência, se desejado
Execução
Geração de guias
Importação no ERP
Transmissão de obrigações
Envio de mensagens ao cliente
Arquivamento de comprovantes
Governança
Log completo
Auditoria
Controle de certificados digitais
Controle de procurações
LGPD
Backup
Controle de acesso por usuário/cliente
2. O que pode ser automatizado em cada área
Você listou uma série de atividades. Veja como elas podem ser tratadas:
Área
O que o funcionário digital pode fazer
Nível recomendado de autonomia
Conciliação bancária
Importar extratos, cruzar com lançamentos, sugerir classificação, apontar divergências
Alto, com revisão
Emissão de guias
Calcular DARF, GPS, DAS, ISS, gerar guias e separar para aprovação
Médio/alto, com trava de aprovação
Importação de NFS-e
Coletar em e-mail, portal, pasta ou API, converter e importar no ERP
Alto, com revisão de exceções
SPED e obrigações acessórias
Validar, consolidar, gerar arquivo, abrir no PVA, apontar erros, transmitir
Médio, com validação humana
Escrituração fiscal
Lançar documentos padronizados no Domínio, Questor ou Sage
Médio, depende de integração
Abertura e legalização
Organizar cadastros, senhas, procurações, certificados e vínculos eCAC
Médio, com controle humano
Departamento pessoal
Preparar admissão, férias, folha, eSocial, DCTFWeb, DARF/FGTS
Médio, com aprovação
Faturamento e boletos
Emitir boletos, remessa, retorno, cobrança e baixa
Alto, com conferência
Relatórios gerenciais
Gerar PDF mensal com indicadores por cliente
Alto
A regra de ouro é:
A automação prepara, calcula, organiza e recomenda. O contador ou responsável aprova aquilo que gera obrigação legal, pagamento ou transmissão oficial.
3. Arquitetura recomendada
Eu recomendo uma arquitetura em camadas.
3.1. Portal ou painel de controle
É a “mesa de trabalho” do funcionário digital.
Nele, você verá:
Clientes
Tarefas do dia
Obrigações a vencer
Documentos pendentes
Divergências de conciliação
Guias aguardando aprovação
SPED com erro
NFS-e não importada
Boletos emitidos
Relatórios mensais
Histórico de envios
Logs e responsáveis
Status sugeridos:
text

12345678
3.2. Motor de coleta
Responsável por buscar documentos e dados em várias fontes.
Fontes possíveis:
E-mail
Pastas de rede
OneDrive/Google Drive
Upload manual
APIs bancárias
Open Finance
Portais de prefeituras
Portal e-CAC
Simples Nacional
eSocial
DCTFWeb
FGTS Digital
ERP contábil
Sistemas emissores de NFS-e
Retorno bancário
Tecnologias possíveis:
Python
Node.js
Playwright ou Selenium para portais
Power Automate
UiPath
Make
n8n
APIs REST
IMAP para e-mail
Watchers de pasta
OCR para PDFs
3.3. Motor de interpretação documental
Essa parte transforma documentos brutos em dados estruturados.
Exemplos:
Extrato bancário
Entrada:
OFX
CNAB
CSV
XLSX
PDF
Saída:
json

12345678
NFS-e
Entrada:
XML
PDF
Link do portal
Anexo de e-mail
Saída:
json

1234567891011
Boletos e cobrança
Entrada:
CNAB de remessa
CNAB de retorno
PDF de boleto
API bancária
Saída:
json

12345678
3.4. Motor de regras contábeis e fiscais
Essa é a parte mais sensível.
Ele deve conter regras como:
Plano de contas
De/Para bancário
Regras de ISS
Regras de Simples Nacional
Regras de Lucro Presumido
Regras de Lucro Real
Códigos de receita
CFOP
CST
Natureza de operação
Classificação contábil
Tipo de imposto
Periodicidade
Cliente por regime tributário
Município de incidência de ISS
Retenções
Obrigações acessórias por perfil
Aqui é importante separar:
IA pode ajudar a sugerir classificação e interpretar documentos, mas cálculo tributário e transmissão oficial devem seguir regras determinísticas e validadas.
Ou seja, a IA pode ser útil para:
Classificar uma despesa
Identificar fornecedor
Sugerir conta contábil
Resumir erro
Montar mensagem ao cliente
Comparar documentos
Mas não deve “inventar” sozinha:
Código de receita
Alíquota
Base de cálculo
Decisão de transmitir SPED
Entrega de obrigação legal
Apuração final sem revisão
3.5. Integração com ERP contábil
Você mencionou:
Domínio
Questor
Sage
A integração pode acontecer por diferentes caminhos:
Opção 1 — API oficial
Se o sistema tiver API pública, é o melhor cenário.
Exemplo:
text

12345
Opção 2 — Arquivo de importação
Muitos ERPs aceitam layouts de importação.
Exemplo:
CSV de lançamentos
XML de notas
Arquivo de folha
Arquivo fiscal
Layout proprietário
Opção 3 — Banco de dados
Se permitido e com cuidado:
Leitura de tabelas
Gravação controlada
Views específicas
Réplica somente leitura
Opção 4 — RPA/interface
Quando não existe API ou layout:
Robô navega no sistema
Clica em menus
Preenche formulários
Importa arquivos
Gera relatórios
Baixa guias
Essa opção funciona, mas é mais frágil. Ela precisa de monitoramento e manutenção sempre que o ERP mudar de versão.
3.6. Integração com governo e bancos
Essa parte exige bastante cuidado.
Governo federal / e-CAC
Pode envolver:
DARF
DCTF
DCTFWeb
eSocial
EFD-Reinf
Procurações eletrônicas
Consulta de pendências
Certidões
Situação fiscal
Requisitos comuns:
Certificado digital
Procuração eletrônica
Cadastro do responsável
Senhas específicas
Controle de acesso
Simples Nacional
Para DAS:
Consulta de débitos
Emissão de DAS
Parcelamentos
PGDAS, quando aplicável
Defis, dependendo do caso
Prefeituras
Para ISS e NFS-e:
Cada município pode ter um portal diferente
Alguns possuem API
Outros exigem RPA
Alguns usam NFS-e nacional
Outros possuem layout próprio
Bancos
Para extratos e cobrança:
OFX
CNAB 240
CNAB 400
API bancária
Open Finance
Internet banking, em último caso com RPA
Para boletos:
Registro de boleto
Remessa
Retorno
Baixa
Alteração de vencimento
Protesto
Conciliação de tarifas
4. Fluxo ideal: sempre “pronto para revisão”
O sistema deve trabalhar com este ciclo:
text

12345678910
Exemplo para conciliação bancária:
text

12345678910111213
Exemplo para emissão de guias:
text

123456789
Exemplo para SPED:
text

12345678
5. Módulos sugeridos
Agora vou organizar por módulos.
Módulo 1 — Conciliação bancária
Funções
Importar extratos automaticamente
Conciliar com lançamentos contábeis
Identificar taxas, tarifas, pagamentos e recebimentos
Sugerir classificação contábil
Apontar diferenças
Gerar relatório para revisão
Gravar conciliação no ERP após aprovação
Entradas
OFX
CNAB
CSV
PDF
API bancária
Saídas
Relatório de conciliação
Lista de divergências
Sugestão de lançamentos
Status por cliente
Log de aprovação
Regras importantes
Conciliação por conta bancária
Conciliação por empresa
Conciliação por período
Não permitir período fechado com alteração sem estorno
Trava para lançamentos duplicados
Alerta de movimentações acima de determinado valor
Módulo 2 — Emissão de guias
Guias possíveis
DARF
DAS
GPS, quando aplicável
ISS
FGTS
DCTFWeb
Multas
Parcelamentos
Funções
Apuração por cliente
Cálculo do imposto
Geração da guia
Geração da memória de cálculo
Envio para aprovação
Envio ao cliente com mensagem personalizada
Controle de vencimento
Histórico de guias emitidas
Cuidados
Código de receita correto
Período de apuração correto
CNPJ correto
Validar se o cliente é optante pelo regime certo
Evitar guia duplicada
Conferir se existe compensação ou parcelamento
Registrar quem aprovou
Módulo 3 — Importação de NFS-e
Funções
Buscar NFS-e em e-mail
Buscar em pasta compartilhada
Baixar de portal municipal
Ler XML
Ler PDF com OCR
Validar campos obrigatórios
Importar no ERP
Associar ao cliente correto
Conferir retenções
Apontar notas faltantes ou duplicadas
Saídas
Notas importadas
Notas rejeitadas
Erros de cadastro
Notas sem XML
Notas duplicadas
Relatório mensal de faturamento
Regras importantes
Validar CNPJ do prestador e tomador
Validar competência
Validar código de serviço
Validar município do ISS
Validar retenção de ISS, IR, CSRF, INSS, quando aplicável
Conferir se a nota pertence ao período fiscal correto
Módulo 4 — SPED e obrigações acessórias
Possíveis obrigações
SPED Fiscal
EFD-Contribuições
SPED Contábil
DCTF
DCTFWeb
EFD-Reinf
DEFIS
DIRF, quando aplicável
Declarações municipais
Obrigações específicas por regime
Funções
Consolidar dados
Validar consistência
Gerar arquivo
Validar no PVA
Apontar erros
Comparar com período anterior
Transmitir após aprovação
Guardar recibo
Regras críticas
Bloquear envio com erro crítico
Mostrar impacto de alterações
Registrar hash do arquivo transmitido
Guardar recibo e data/hora
Alertar prazo no quinto dia útil ou prazo legal específico
Módulo 5 — Escrituração fiscal
Funções
Receber documentos padronizados
Classificar CFOP, CST, natureza
Gerar lançamentos fiscais
Enviar para ERP
Validar impostos
Conferir se documentos estão completos
Entradas
XML de NF-e
NFS-e
Arquivos fiscais
Planilhas padronizadas
API do emissor
Saídas
Escrituração pronta
Divergências
Documentos pendentes
Relatório de apuração
Módulo 6 — Abertura e legalização
Funções
Cadastro de novos clientes
Checklist de documentos
Solicitação de certificado digital
Controle de senhas web
Registro de procurações
Vínculo no e-CAC
Controle de responsáveis técnicos
Histórico de alterações cadastrais
Itens importantes
Contrato social
CNPJ
Inscrição municipal
Inscrição estadual, quando aplicável
Optante pelo Simples
Certificado A1/A3
Senha e-CAC
Procuração eletrônica
Responsável legal
Responsável contábil
Módulo 7 — Departamento pessoal
Funções
Admissão
Rescisão
Férias
Folha mensal
eSocial
DCTFWeb
DARF previdenciário
FGTS Digital
Afastamentos
Benefícios
Provisões
Cuidados
Dados pessoais completos
Cargos e salários atualizados
Jornada correta
Eventos de SST
Integração com eSocial
Conferência de bases
Trava para envio de eSocial com erro
Histórico de alterações trabalhistas
Fluxo ideal
text

123456789101112131415
Módulo 8 — Faturamento e boletos
Funções
Emissão de cobrança mensal
Emissão avulsa
Geração de boletos
Remessa bancária
Retorno bancário
Baixa automática
Conciliação de tarifas
Régua de cobrança
Saídas
Boletos emitidos
Arquivo de remessa
Retorno processado
Inadimplência
Previsão de recebimento
Relatório de cobrança
Integrações
Banco
ERP
Gateway de pagamento
API de Pix
Emissor de boleto
Módulo 9 — Relatórios gerenciais
Funções
Gerar pacote mensal por cliente
PDF personalizado
Indicadores financeiros
Indicadores fiscais
Indicadores trabalhistas
Comparativo mensal
Alertas
Exemplos de indicadores
Faturamento mensal
Impostos pagos
Margem estimada
Despesas recorrentes
Saldo em caixa
Contas a pagar
Contas a receber
Inadimplência
Folha de pagamento
Custo de pessoal
Comparativo com mês anterior
Obrigações entregues
Pendências fiscais
6. Fluxo geral do funcionário digital
Um fluxo robusto seria este:
text

1234567891011121314151617181920212223
7. Exemplo detalhado: conciliação bancária automática
Vamos detalhar esse caso porque é um ótimo ponto de partida.
Etapa 1 — Coleta do extrato
O sistema busca o extrato:
Por API bancária
Por Open Finance
Por upload do cliente
Por e-mail
Por pasta compartilhada
Formatos:
OFX
CNAB
CSV
XLSX
PDF
Etapa 2 — Validação inicial
Verifica:
Banco
Agência
Conta
Período
Saldo inicial
Saldo final
Se há lacuna de dias
Se o arquivo está corrompido
Se já foi importado antes
Se houver problema:
text

12
Etapa 3 — Extração das movimentações
Para cada linha:
Data
Histórico
Documento
Valor
Tipo débito/crédito
Saldo
Etapa 4 — Cruzamento com lançamentos
O sistema compara com o ERP:
Valor igual
Data igual ou próxima
Histórico parecido
Documento igual
Fornecedor/cliente identificado
Categoria contábil compatível
Etapa 5 — Classificação das movimentações
Podem ser:
text

12345678910111213
Etapa 6 — Divergências
Exemplos:
Extrato tem pagamento, mas não há lançamento no ERP
ERP tem lançamento, mas não apareceu no extrato
Valor diferente
Data muito distante
Documento duplicado
Conta bancária errada
Cliente não identificado
Etapa 7 — Painel de revisão
O usuário vê:
Data
Histórico
Valor
Situação
Sugestão
Ação
10/08
PAG FORN ABC
1.250,00
Não encontrado
Fornecedores
Confirmar
12/08
TARIFA PIX
2,90
Sugestão
Despesas bancárias
Aprovar
14/08
TRANSF CONTA B
5.000,00
Transferência
Bancos conta B
Aprovar
Etapa 8 — Gravação
Após aprovação:
Grava lançamento no ERP
Marca como conciliado
Salva log
Atualiza dashboard
Envia relatório, se necessário
8. Exemplo detalhado: emissão de guias
Etapa 1 — Perfil do cliente
O sistema carrega:
CNPJ
Regime tributário
Atividade
Município
Inscrição municipal
Inscrição estadual
Optante pelo Simples
Responsável
Certificado
Procuração
Periodicidade
Histórico de guias
Etapa 2 — Coleta da base de cálculo
Depende do imposto:
DAS
Faturamento do Simples Nacional
Anexos
Folha, se necessário
Receitas de períodos anteriores
Situações especiais
ISS
NFS-e emitidas
Serviços tomados
Retenções
Município competente
Alíquota
Código de serviço
DARF
Base conforme tributo
IRPJ
CSLL
PIS
COFINS
IRRF
Códigos de receita
GPS / DCTFWeb
Folha
Pró-labore
INSS patronal
Retenções
Eventos de eSocial
EFD-Reinf
Etapa 3 — Apuração
O sistema calcula:
text

12345678
Etapa 4 — Validação
Verifica:
CNPJ correto
Período correto
Código de receita correto
Valor mínimo de emissão
Duplicidade
Vencimento correto
Cliente ativo
Dados cadastrais completos
Etapa 5 — Aprovação
O painel mostra:
Cliente
Imposto
Competência
Vencimento
Valor
Base
Memória de cálculo
Comparativo com mês anterior
Alertas
Botões:
text

1234567
Etapa 6 — Envio
Após aprovação:
Gera PDF da guia
Gera memória de cálculo
Envia e-mail personalizado
Opcionalmente envia WhatsApp
Registra envio
Agenda lembrete de vencimento
Exemplo de mensagem:
text

12345678
9. Exemplo detalhado: importação de NFS-e
Coleta
O robô busca NFS-e em:
Caixa de entrada do e-mail
Anexos XML ou PDF
Pastas compartilhadas
Portal da prefeitura
API do emissor
Sistema de notas
Cliente enviando por portal
Validação
Verifica:
XML válido
Assinatura, quando necessário
Número da nota
CNPJ prestador
CNPJ tomador
Data de emissão
Competência
Valor do serviço
ISS retido
Código de serviço
Município
Situação: normal, cancelada, substituída
Classificação
Nota própria do cliente
Nota tomada
Nota cancelada
Nota fora do período
Nota duplicada
Nota sem XML
Nota com dados incompletos
Importação
Envia ao ERP:
Cabeçalho da nota
Prestador
Tomador
Serviço
Valores
Retenções
Código contábil
Centro de custo
Observações
Exceções
Exemplos:
Cliente não cadastrado
Código de serviço desconhecido
Município sem regra de ISS
Nota cancelada após importação
XML corrompido
PDF ilegível
Documento duplicado
10. Segurança, certificados e LGPD
Esse sistema lida com dados extremamente sensíveis:
CNPJ
CPF
Folha de pagamento
Extratos bancários
Impostos
Certificados digitais
Senhas web
Procurações
Contratos
Dados pessoais
Por isso, a segurança precisa ser séria.
10.1. Controle de acesso
Use:
Usuários por perfil
Acesso por cliente
Acesso por módulo
Permissão de aprovação
Permissão de transmissão
Permissão de edição
Permissão de exportação
Exemplo:
Perfil
Permissões
Auxiliar
Consulta e conferência
Analista
Processa e corrige
Supervisor
Aprova divergências
Contador responsável
Aprova obrigações e guias
TI
Administração técnica
Cliente
Visualiza documentos e guias
10.2. Certificados digitais
Nunca deixe certificados e senhas expostos.
Use:
Cofre de segredos
Criptografia
Controle de validade
Alerta de vencimento
Log de uso
Responsável pelo certificado
Procuração registrada
Tipos:
A1: arquivo digital
A3: token/carto
HSM, quando aplicável
Para automação, o A1 costuma ser mais fácil, mas exige proteção adequada.
10.3. Senhas e credenciais
Use:
Vault
Rotação de senhas
MFA quando possível
Sem credenciais em código
Sem credenciais em planilha aberta
Logs de acesso
Acesso por permissão
10.4. Auditoria
Cada ação importante deve registrar:
Usuário
Data/hora
Cliente
Ação
Documento
Antes/depois
IP/origem
Versão do robô
Aprovação
Exemplo:
text

123456
10.5. LGPD
Você precisa considerar:
Consentimento ou base legal
Minimização de dados
Controle de acesso
Política de retenção
Direito de exclusão, quando aplicável
Registro de tratamento
Contrato com operadores
Segurança de backups
Comunicação de incidentes
11. Tecnologia possível
Existem vários caminhos. Depende do seu orçamento, equipe e urgência.
Opção A — Sistema próprio web
Stack sugerida:
Backend: Python com FastAPI ou Node.js com NestJS
Frontend: React ou Vue
Banco: PostgreSQL
Filas: Redis, RabbitMQ ou AWS SQS
Storage: S3 ou similar
OCR: Tesseract, Azure Form Recognizer, AWS Textract ou Google Document AI
RPA: Playwright
Logs: OpenSearch, ELK ou Datadog
Vault: HashiCorp Vault, AWS Secrets Manager ou Azure Key Vault
Autenticação: OIDC, Keycloak, Auth0 ou Entra ID
É a opção mais robusta e profissional.
Opção B — Automação com n8n / Make / Power Automate
Boa para MVP, mas com limites.
Pode usar:
n8n para orquestração
Python para processamento pesado
Google Sheets ou banco leve para controle
E-mail para notificações
Portal simples para revisão
Playwright para portais
Vantagens:
Mais rápido
Menor custo inicial
Fácil ajustar fluxos
Limitações:
Menos governança
Pode ficar complexo em escala
Menos controle de auditoria
Difícil para muitos clientes simultâneos
Opção C — ERP + RPA + painel
Se você já usa Domínio, Questor ou Sage, pode criar robôs auxiliares:
Robô coleta documentos
Robô importa no ERP
Robô gera guias
Painel externo controla pendências
ERP continua como sistema oficial
Essa costuma ser uma boa abordagem para começar sem trocar o ERP.
12. Modelo de dados simplificado
Uma primeira modelagem poderia incluir:
Cliente
text

12345678910
Certificado
text

1234567
Conta bancária
text

12345678
Extrato bancário
text

12345678
Movimentação bancária
text

123456789
Documento fiscal
text

12345678910111213141516171819
Guia
text

12345678910
Obrigação acessória
text

123456789
Tarefa
text

123456789
Log
text

12345678
13. MVP recomendado
Eu não tentaria fazer todos os módulos ao mesmo tempo.
A ordem mais segura é:
Fase 0 — Descoberta
Duração sugerida: 1 a 2 semanas
Objetivo:
Mapear processos
Listar clientes
Listar sistemas
Listar portais
Listar certificados
Listar obrigações
Definir prioridades
Definir regras críticas
Entregas:
Mapa de processos
Matriz de automações
Lista de integrações
Requisitos de segurança
Escopo do MVP
Fase 1 — Conciliação bancária
Duração sugerida: 6 a 10 semanas
Objetivo:
Coletar extrato
Interpretar arquivo
Cruzar com ERP
Mostrar divergências
Permitir aprovação
Gravar conciliação
Por que começar por aqui?
Alto valor
Risco menor que transmissão fiscal
Fácil demonstrar retorno
Cria base documental
Gera confiança no sistema
Fase 2 — NFS-e e documentos fiscais
Duração sugerida: 6 a 12 semanas
Objetivo:
Coletar NFS-e
Ler XML/PDF
Validar dados
Importar no ERP
Apontar exceções
Esse módulo reduz muito trabalho manual.
Fase 3 — Guias simples e recorrentes
Duração sugerida: 8 a 12 semanas
Objetivo:
Apurar DAS, ISS ou guias mais padronizadas
Gerar PDF
Enviar para aprovação
Enviar ao cliente
Comece com clientes mais simples e regimes padronizados.
Fase 4 — SPED e obrigações acessórias
Duração sugerida: 3 a 6 meses
Objetivo:
Validar arquivos
Integrar com PVA
Apontar erros
Transmitir com aprovação
Essa fase é mais complexa por causa de validações legais e layouts.
Fase 5 — Departamento pessoal
Duração sugerida: 6 a 12 meses
Objetivo:
Integrar folha
Validar eventos
Preparar eSocial
Gerar guias
Essa área exige muito cuidado por causa de prazos, legislação trabalhista e dados pessoais.
14. Riscos importantes
Risco 1 — Automação sem governança
Se o robô transmite algo errado, o dano pode ser sério.
Solução:
Aprovação humana
Log
Trava por risco
Ambiente de testes
Risco 2 — Dependência de portais e RPA
Portais mudam com frequência.
Solução:
Monitorar robôs
Ter alertas de falha
Ter plano de contingência manual
Priorizar APIs quando existirem
Risco 3 — Certificado digital mal gerenciado
Pode causar:
Vencimento
Uso indevido
Falha em transmissão
Problemas legais
Solução:
Vault
Controle de validade
Log de uso
Responsável definido
Risco 4 — Regra fiscal errada
A IA não deve decidir imposto sozinha.
Solução:
Motor de regras
Validação humana
Testes com dados reais
Comparativo com apuração anterior
Risco 5 — LGPD e vazamento de dados
Você lidará com dados financeiros e pessoais.
Solução:
Controle de acesso
Criptografia
Logs
Política de retenção
Contrato com fornecedores
Treinamento da equipe
15. Como eu posso te ajudar
Posso te ajudar em várias etapas:
Montar o escopo completo do sistema
Requisitos funcionais
Requisitos não funcionais
Módulos
Fluxos
Perfis de usuário
Desenhar a arquitetura
Backend
Frontend
Banco de dados
Filas
RPA
Integrações
Segurança
Criar o PRD do MVP
Histórias de usuário
Critérios de aceite
Telas
Regras de negócio
Priorização
Especificar integrações
Domínio
Questor
Sage
Bancos
e-CAC
Prefeituras
eSocial
DCTFWeb
FGTS Digital
Criar fluxos de automação
Conciliação bancária
NFS-e
Guias
SPED
Folha
Relatórios
Definir governança e segurança
LGPD
Certificados
Logs
Permissões
Auditoria
Montar um protótipo
Painel de tarefas
Upload de extrato
Dashboard de divergências
Aprovação de guias
Relatório mensal
Ajudar na escolha técnica
Sistema próprio
n8n
Power Automate
Python + Playwright
ERP + robôs
API comercial pronta
16. Perguntas para começar
Para transformar isso em um projeto real, eu precisaria saber alguns pontos:
Sobre a empresa
Quantos clientes ativos vocês atendem hoje?
Quantos funcionários vão usar o sistema?
Vocês atendem Simples Nacional, Presumido, Lucro Real ou todos?
Qual o volume mensal de documentos?
Sobre sistemas
Qual ERP principal hoje: Domínio, Questor, Sage ou outro?
O sistema atual possui API ou layout de importação?
Vocês já usam algum RPA ou automação?
Os lançamentos são feitos manualmente ou já existe importação?
Sobre bancos
Quais bancos os clientes mais usam?
Vocês já conseguem extrato por API, Open Finance ou apenas arquivo manual?
Os extratos chegam em OFX, CSV, PDF ou CNAB?
Sobre NFS-e
As NFS-e são majoritariamente de quais municípios?
Vocês recebem XML, PDF ou precisam baixar em portal?
Existe uso de NFS-e nacional ou apenas portal municipal?
Sobre impostos
Quais guias são mais recorrentes: DAS, ISS, DARF, GPS, DCTFWeb?
A apuração já é feita dentro do ERP ou fora?
Vocês têm regras de retenção muito variadas?
Sobre certificados e governo
Os certificados digitais ficam com vocês ou com os clientes?
Já existem procurações eletrônicas no e-CAC?
Vocês usam certificado A1 ou A3?
Sobre departamento pessoal
Qual sistema de folha vocês usam?
O eSocial já é transmitido por esse sistema?
O volume mensal de admissões, rescisões e férias é alto?
Sobre prioridade
Qual dor você quer resolver primeiro?
O maior problema hoje é tempo operacional, erro, atraso, falta de controle ou escala?
17. Minha recomendação inicial
Se eu fosse montar isso para você, começaria com este MVP:
MVP 1 — Funcionário digital de conciliação e documentos
Objetivo:
text

12345
Entregáveis:
Painel de clientes
Upload e coleta de extratos
Upload e coleta de NFS-e
Leitura de OFX e XML
Motor de divergências
Dashboard de revisão
Exportação de relatório
Log básico
Integração inicial com ERP ou geração de arquivo de importação
Depois disso:
MVP 2 — Guias simples
Objetivo:
text

1234
MVP 3 — Obrigações e DP
Somente depois que a base estiver madura.
18. Resposta direta
Sim, posso te ajudar a criar esse sistema.
A melhor abordagem é construir um funcionário digital contábil modular, com:
Coleta automática de documentos
Interpretação de arquivos
Motor de regras contábeis e fiscais
Integração com ERP
Integração com bancos e governo
Painel de revisão humana
Log e auditoria
Envio controlado de guias e obrigações
Relatórios gerenciais
Mas eu não recomendo começar tentando automatizar tudo de uma vez.
O caminho mais seguro é:
text

12345
Se você quiser, no próximo passo eu posso montar para você um documento de projeto com:
Escopo do MVP
Fluxo de conciliação bancária
Fluxo de NFS-e
Fluxo de emissão de guias
Arquitetura técnica
Banco de dados inicial
Lista de integrações
Requisitos de segurança
Cronograma por fases
Perguntas técnicas para validar com seu ERP
Se desejar, eu já começo criando o PRD da Fase 1: Funcionário Digital para Conciliação Bancária.

# 🤖 FUNCIONARIO_DIGITAL.md — Aurora, a Funcionária Digital

> Sprint FD-1 concluída em 15/08/2026 • Cliente-piloto: Academia do Renan

## O que é
Funcionária digital que executa rotinas contábeis SOBRE o Radar Conta Certa,
com revisão humana obrigatória para ações legais (Regra de Ouro — ADR-030).

## Stack
- Backend: NestJS 10 + @nestjs/schedule + cron + Prisma (módulo `digital-employee`)
- Frontend: `/dashboard/funcionario-digital` (Next.js 16 + Zustand + Axios)
- RPA (fases futuras): Playwright • Cofres: AES-256-GCM (ADR-032)

## Modelo de dados (6 tabelas)
`robot_workers` • `robot_worker_skills` • `automation_runs` •
`automation_pendings` • `automation_audits` • `approval_records`

## Skills
| Skill | Cron | Status |
|---|---|---|
| RECONCILIATION — Conciliação Banco × NF-e | `0 2 * * *` | ✅ FD-1 |
| CLASSIFICATION — Classificação c/ memória | `30 2 * * *` | 🚧 FD-2 |
| ACCOUNTING_BRIDGE — Ponte Bancário → Contábil | `0 3 * * *` | 🚧 FD-2 |
| MONTHLY_REPORT — Relatório mensal PDF | `0 8 5 * *` | 🚧 FD-2 |

## Regra de Ouro
A automação prepara, calcula, organiza e recomenda. O humano aprova tudo que
gera obrigação legal, pagamento ou transmissão. `riskLevel=LEGAL` nunca é AUTO.

## Roadmap
FD-2 conciliação completa + relatórios • FD-3 NFS-e (e-mail/OCR) • FD-4 guias
(DAS/ISS/DARF) • FD-5 CNAB 240/400 • FD-6 SPED + cert. A1 • FD-7 integração
Domínio/Questor/Sage • FD-8 legalização (cofres) • FD-9 DP leve.

# 🤖 FUNCIONARIO_DIGITAL.md — Aurora, a Funcionária Digital

> Sprint FD-1 concluída em 15/08/2026 • Cliente-piloto: Academia do Renan

## 🌅 O nome
**AURORA** — **A**utomação **U**nificada de **R**otinas e **O**brigações,
com **R**evisão e **A**uditoria. Como o JARVIS do escritório contábil:
a aurora é o primeiro raio de luz — ela chega às 02:00 e prepara tudo.
Mas nunca decide sozinha o que gera obrigação legal (Regra de Ouro).

## O que é
Funcionária digital que executa rotinas contábeis SOBRE o Radar Conta Certa,
com revisão humana obrigatória para ações legais (ADR-030).

## Stack
- Backend: NestJS 10 + @nestjs/schedule + cron + Prisma (módulo `digital-employee`)
- Frontend: `/dashboard/funcionario-digital` (Next.js 16 + Zustand + Axios)
- RPA (fases futuras): Playwright • Cofres: AES-256-GCM (ADR-032)

## Modelo de dados (6 tabelas)
`robot_workers` • `robot_worker_skills` • `automation_runs` •
`automation_pendings` • `automation_audits` • `approval_records`

## Skills
| Skill | Cron | Status |
|---|---|---|
| RECONCILIATION — Conciliação Banco × NF-e | `0 2 * * *` | ✅ FD-1 |
| CLASSIFICATION — Classificação c/ memória | `30 2 * * *` | 🚧 FD-2 (nesta sessão) |
| ACCOUNTING_BRIDGE — Ponte Bancário → Contábil | `0 3 * * *` | 🚧 FD-2 (nesta sessão) |
| MONTHLY_REPORT — Relatório mensal PDF | `0 8 5 * *` | 🚧 FD-2 |

## Regra de Ouro
A automação prepara, calcula, organiza e recomenda. O humano aprova tudo que
gera obrigação legal, pagamento ou transmissão. `riskLevel=LEGAL` nunca é AUTO.

## Roadmap
FD-2 conciliação completa + relatórios • FD-3 NFS-e (e-mail/OCR) • FD-4 guias
(DAS/ISS/DARF) • FD-5 CNAB 240/400 • FD-6 SPED + cert. A1 • FD-7 integração
Domínio/Questor/Sage • FD-8 legalização (cofres) • FD-9 DP leve (cérebro completo).