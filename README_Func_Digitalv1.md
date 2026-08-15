# 🤖 FUNCIONÁRIO DIGITAL RADAR (FDR)

### O funcionário que trabalha 24/7 no seu escritório contábil — dentro do Radar Conta Certa

<div align="center">

![Status](https://img.shields.io/badge/🚧_EM_FUNDAÇÃO-0d9488?style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-10-red?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge)
![Playwright](https://img.shields.io/badge/RPA-Playwright-2EAD33?style=for-the-badge)
![Fases](https://img.shields.io/badge/Roadmap-FD--0_a_FD--9-f97316?style=for-the-badge)

Extensão do **Radar Conta Certa** que transforma rotinas repetitivas de escritórios
contábeis em automação auditável: coleta documentos, concilia, apura, prepara guias,
importa em ERP e entrega tudo **pronto para revisão humana**.

[Para Diretores](#-resumo-executivo-para-quem-não-programa) •
[Áreas de atuação](#-as-9-áreas-de-atuação-do-funcionário) •
[Arquitetura](#️-arquitetura-em-4-camadas) •
[Roadmap](#️-roadmap-de-entrega-fases-fd-0--fd-9) •
[Segurança](#-segurança-certificados-e-lgpd)

</div>

---

## 🎯 Resumo Executivo (para quem não programa)

O **Funcionário Digital Radar (FDR)** é um colaborador virtual que vive dentro do
Radar Conta Certa. Ele trabalha de madrugada, enquanto a equipe dorme:

- 📥 **Coleta** extratos, NFS-e, boletos e CNAB (e-mail, pasta, portal ou upload);
- 🔁 **Concilia** banco × notas × contabilidade e aponta divergências;
- 🧾 **Apura** impostos e prepara guias (DAS, ISS, DARF, GPS) com memória de cálculo;
- 📋 **Valida** SPED e obrigações, deixa tudo pronto para o 5º dia útil;
- 📤 **Importa** a escrituração no ERP (SCI, Domínio, Questor ou Sage);
- 📨 **Envia** relatórios mensais em PDF aos clientes;
- ✋ **Para e pergunta** sempre que algo envolve obrigação legal, pagamento ou
  transmissão oficial.

> **Diferencial contra RPA de tela (ex.: concorrentes):** o FDR não "clica telas"
> de outros sistemas. Ele opera **por dentro do Radar**, com dados nativos,
> aprendizado real (memória de classificação) e **auditoria de 100% das ações** —
> compliance contábil de verdade.

### 😫 Antes (rotina manual do escritório)

| Atividade | Tempo mensal | Risco |
|---|---|---|
| Baixar extratos e notas em portais/e-mail | 2–4 h por cliente | Esquecimento |
| Conciliar banco × NF-e olho a olho | 1–3 h por cliente | Pagamentos perdidos |
| Apurar e emitir guias | 1–2 h por cliente | Código de receita errado |
| Digitar escrituração no ERP | 3–5 h por cliente | Erro de digitação |
| Montar relatório mensal | 1 h por cliente | Atraso na entrega |

### ✅ Depois (com o FDR)

| Atividade | Tempo | Como |
|---|---|---|
| Coleta de documentos | automática | Robôs de e-mail/pasta/portal (madrugada) |
| Conciliação | automática | Motor de score ≥80% aprova sozinho |
| Guias | preparadas | Apuração + memória de cálculo + aprovação |
| Escrituração | 1 clique | Arquivo no layout do ERP |
| Relatório mensal | agendado | PDF no e-mail do cliente, dia 5 |

**O contador chega de manhã e só revisa a fila de pendências 🟡.**

---

## 💎 A REGRA DE OURO (inegociável)

> **"A automação prepara, calcula, organiza e recomenda.
> O humano aprova tudo que gera obrigação legal, pagamento ou transmissão oficial."**

| A IA PODE fazer sozinha | A IA NUNCA faz sozinha |
|---|---|
| Classificar despesa (memória) | Definir código de receita |
| Sugerir conta contábil | Calcular alíquota/base de cálculo |
| Interpretar documentos | Decidir transmitir SPED |
| Comparar documentos | Enviar guia ao cliente |
| Redigir mensagem ao cliente | Aprovar obrigação legal |

---

## 🧩 As 9 áreas de atuação do Funcionário

| # | Módulo | O que o FDR faz | Autonomia | Fase |
|---|---|---|---|---|
| 1 | 🏦 **Conciliação bancária** | Extrai extratos (OFX/CNAB/CSV/XLSX/PDF), cruza com lançamentos, aponta divergências, entrega pronto p/ revisão | 🟢 Alta c/ revisão | FD-2 |
| 2 | 📄 **Importação NFS-e** | Coleta em portais, e-mail e pastas; lê XML/PDF(OCR); valida CNPJ, competência, município, retenções; importa no sistema | 🟢 Alta c/ exceções | FD-3 |
| 3 | 🧾 **Emissão de guias** | Apura DAS, ISS, DARF, GPS por cliente; memória de cálculo; aprovação obrigatória; envio com mensagem personalizada | 🟠 Média c/ trava | FD-4 |
| 4 | 💰 **Faturamento e boletos** | Cobrança mensal/avulsa, remessa CNAB 240/400, conferência de retorno, baixa automática, régua de cobrança | 🟢 Alta c/ conferência | FD-5 |
| 5 | 📋 **SPED e obrigações** | Valida, consolida, compara com mês anterior, transmite com certificado A1, arquiva recibo; alerta D-3/D-1 | 🟠 Média | FD-6 |
| 6 | 🏢 **Escrituração fiscal** | Lançamentos recorrentes no SCI (já existe!), Domínio, Questor ou Sage a partir de documentos padronizados | 🟠 Média | FD-7 |
| 7 | 📂 **Abertura e legalização** | Cadastro de clientes, cofre de certificados/senhas web, procurações, vínculos eCAC, checklist de onboarding | 🟠 Média c/ controle | FD-8 |
| 8 | 📊 **Relatórios gerenciais** | Pacote mensal por cliente em PDF personalizado (faturamento, impostos, margem, inadimplência), envio agendado | 🟢 Alta | FD-2 |
| 9 | 👥 **Depto. pessoal** | Admissão, férias, folha, eSocial, DCTFWeb, FGTS Digital — via **integração com sistema de folha existente** (não motor próprio) | 🟠 Média c/ aprovação | FD-9 |

---

## 🏛️ Os 4 pilares do FDR

### Pilar A — Níveis de autonomia
Cada skill tem um nível: `AUTO` (score ≥80%), `REVIEW` (50–79% ou risco legal),
`MANUAL` (só sugestão). Ações com `riskLevel = LEGAL` **sempre** passam por
aprovação humana, mesmo com score 100%.

### Pilar B — Pipeline universal ("sempre pronto para revisão")
Toda skill segue o mesmo ciclo — o esqueleto é herdado do orquestrador:

COLETAR → INTERPRETAR → CRUZAR → APONTAR DIVERGÊNCIAS
→ 🟡 PAINEL DE REVISÃO (aprovar / rejeitar / corrigir)
→ EXECUTAR → REGISTRAR (auditoria) → REPORTAR


### Pilar C — Motores de interpretação e regras
- **C1. Interpretação Documental:** OFX, CNAB, XLSX, XML, CSV → JSON estruturado
  (reusa parser CSV e XML já existentes no Radar).
- **C2. Regras Contábeis/Fiscais DETERMINÍSTICAS:** plano de contas SCI, De/Para
  bancário, ISS por município, regime tributário, códigos de receita, CFOP/CST.
  Imposto se calcula por regra testável — nunca por "achismo" de IA.

### Pilar D — Governança
Cofre de certificados A1 (criptografado + alerta de vencimento + log de uso) •
Cofre de senhas web (AES-256-GCM) • Perfis de aprovação • Auditoria total
(usuário, IP, antes/depois, versão do robô) • LGPD.

---

## 🏗️ Arquitetura em 4 camadas
┌────────────────────────────────────────────────────────────────────┐
│ CAMADA 1 — PAINEL DE CONTROLE (a "mesa de trabalho") │
│ Dashboard do funcionário • Fila de revisão 🟡 • Aprovações • KPIs │
├────────────────────────────────────────────────────────────────────┤
│ CAMADA 2 — ORQUESTRAÇÃO │
│ Scheduler (@nestjs/schedule) • Runs • Matriz de autonomia │
│ ApprovalRecord • AutomationAudit │
├────────────────────────────────────────────────────────────────────┤
│ CAMADA 3 — MOTORES E CONECTORES │
│ 📄 Interpretação Documental (Pilar C1) │
│ ⚖️ Regras Fiscais determinísticas (Pilar C2) │
│ 📁 Pastas • 📧 IMAP • 🏦 Bancos/CNAB • 🏛 Portais (RPA Playwright) │
│ 🏢 ERPs — ordem de preferência: API → arquivo → RPA │
│ └─ 1º conector: SCI (exportação JÁ EXISTE no módulo contábil) │
├────────────────────────────────────────────────────────────────────┤
│ CAMADA 4 — GOVERNANÇA │
│ 🔐 CertificateStore • CredentialVault • LGPD • Auditoria 100% │
└────────────────────────────────────────────────────────────────────┘

**Stack:** mesma do Radar (Next.js 16 + NestJS 10 + Prisma 5 + PostgreSQL 15) +
`Playwright` em worker isolado para portais (fase FD-4+) + Redis/BullMQ quando a
fila de robôs exigir (YAGNI até lá).

---

## 📅 Roadmap de entrega (fases FD-0 → FD-9)

> **Regra:** cada fase entrega valor sozinha. Nunca ficamos meses sem nada novo.

| Fase | Nome | Entregas principais | Prazo est. |
|---|---|---|---|
| **FD-0** | 🔍 Descoberta | Questionário de processos, mapa de portais/certificados/obrigações | 1–2 sem |
| **FD-1** | 🏗️ Fundação | Models Prisma, orquestrador, pipeline universal, matriz de autonomia, painel de revisão, `ApprovalRecord`, auditoria, dashboard do funcionário, botão "▶ Rodar agora" | 2–3 sem |
| **FD-2** | 🏦 Conciliação + Relatórios | Coleta (pasta/e-mail/upload), OFX/CNAB/XLSX, cruzamento (motor de score existente), divergências, aprovação, gravação + **PDF mensal agendado** | 4–6 sem |
| **FD-3** | 📄 NFS-e | Coleta e-mail/pasta/portal, XML + OCR, validações, exceções no painel | 6–8 sem |
| **FD-4** | 🧾 Guias | Motor DAS/ISS/DARF determinístico, memória de cálculo, aprovação, envio personalizado | 6–8 sem |
| **FD-5** | 💰 Boletos | CNAB remessa/retorno, baixa automática, régua de cobrança | 4 sem |
| **FD-6** | 📋 SPED | Validação, hash, transmissão com A1, recibo, 5º dia útil | 8–12 sem |
| **FD-7** | 🏢 ERP | SCI (já existe) → Domínio → Questor/Sage | 6–8 sem |
| **FD-8** | 📂 Legalização | Cofres, procurações, eCAC, onboarding | 6 sem |
| **FD-9** | 👥 Depto. pessoal | Integração com folha existente (parceria) | 3–6 meses |

### O "dia" do funcionário (visão final)

02:00 📧 Varre e-mails e pastas → importa NFS-e e extratos
02:30 🔁 Concilia banco × NF-e × contábil → divergências p/ revisão
03:00 🧾 Apura DAS/ISS/DARF/GPS do mês
06:00 📨 Envia guias por e-mail com mensagem personalizada
08:00 📊 Gera pacote de relatórios PDF dos clientes do dia
09:00 👤 CONTADOR CHEGA: só revisa a fila 🟡 e aprova
D-3 ⏰ Alerta de obrigações vencendo
Dia 5 ✅ SPED transmitido, mês fechado, recibo arquivado


---

## 🗄️ Modelo de dados (resumo da FD-1)

| Tabela | Papel |
|---|---|
| `DigitalEmployee` | O funcionário — 1 por escritório (`companyId` único) |
| `DigitalEmployeeSkill` | Cada habilidade com cron e on/off |
| `AutomationRun` | O "ponto": cada corrida com itens processados/aprovados/pendentes/tempo economizado |
| `AutomationPending` | Fila 🟡 human-in-the-loop (score 50–79%) |
| `ApprovalRecord` | Aprovação humana rastreada (quem, quando, IP) — trava de transmissão |
| `AutomationAudit` | Trilha de compliance: 100% das ações do robô |
| `BankAccount` / `BankStatement` | Contas e extratos com hash anti-duplicidade |
| `TaxGuide` | Guias (DAS/ISS/DARF/GPS) com memória de cálculo |
| `NfseImportJob` | Lotes de NFS-e por origem (portal/e-mail/pasta) |
| `ClientObligation` | Calendário de obrigações por cliente |
| `CertificateStore` | Certificados A1 criptografados + validade |
| `CredentialVault` | Senhas web criptografadas (AES-256-GCM) |
| `BillingBatch` | Remessas/retornos CNAB |
| `MonthlyReportPack` | Pacote mensal de relatórios |

---

## 🔐 Segurança, certificados e LGPD

| Tema | Implementação |
|---|---|
| Certificados A1 | Criptografados no banco • alerta D-30/D-7 • log de cada uso • responsável nomeado |
| Senhas web | Cofre AES-256-GCM • rotação • nunca em texto puro/planiha |
| Perfis | Auxiliar confere • Analista corrige • Supervisor aprova divergência • **Contador responsável aprova guia/transmissão** • TI administra • Cliente visualiza |
| Auditoria | Usuário + data/hora + cliente + ação + antes/depois + IP + versão do robô |
| LGPD | Base legal registrada • minimização • política de retenção • direito de exclusão |
| Trava de transmissão | Nada sai para o governo sem `ApprovalRecord` vinculado |

### ⚠️ Matriz de riscos e mitigações

| Risco | Mitigação |
|---|---|
| Robô transmite algo errado | Regra de Ouro + ApprovalRecord + ambiente de testes |
| Portal muda e quebra RPA | Preferência API → arquivo → RPA + alertas + plano manual |
| Certificado vencido | Alertas D-30/D-7 + responsável |
| Regra fiscal errada | Motor determinístico + comparativo mês anterior + revisão humana |
| Vazamento de dados | Cofres criptografados + RBAC + logs + retenção |

---

## 📂 Estrutura de pastas (criada na FD-1)

backend/src/digital-employee/
├── digital-employee.module.ts # registro do módulo
├── digital-employee.controller.ts # API do painel + disparo manual
├── digital-employee.service.ts # CRUD do funcionário/skills
├── orchestrator/
│ ├── scheduler.service.ts # agenda (cron) das skills
│ └── job-runner.service.ts # executa skill, mede tempo, loga
├── skills/ # cada área = 1 skill (SOLID)
│ ├── base.skill.ts # esqueleto do pipeline universal
│ ├── reconciliation.skill.ts # FD-2
│ ├── reports.skill.ts # FD-2
│ └── ... (demais fases)
├── interpreters/ # Pilar C1
│ ├── ofx.interpreter.ts
│ ├── cnab.interpreter.ts
│ └── xlsx.interpreter.ts
├── rules/ # Pilar C2 (determinístico)
├── audit/
│ └── automation-audit.service.ts
└── dto/
frontend/src/app/dashboard/funcionario-digital/
├── page.tsx # mesa de trabalho
└── components/ # EmployeeHeader, KpiCards, RunsTimeline,
# PendingQueue, SkillsPanel, AuditTrail


---

## 📜 ADRs do Funcionário Digital

| ADR | Decisão |
|---|---|
| **025** | RPA com Playwright em worker separado quando portais não tiverem API |
| **026** | Cofre de credenciais AES-256-GCM (chave em env, nunca em código) |
| **027** | Certificado A1 criptografado no banco; uso exclusivo para assinatura/transmissão |
| **028** | Toda ação do FDR gera `AutomationAudit` |
| **029** | Guia/SPED/transmissão sempre passam por revisão humana até decisão contrária registrada |
| **030** | Regra de Ouro: ações `riskLevel = LEGAL` nunca são AUTO, independente do score |
| **031** | Cálculo tributário é determinístico (motor de regras); IA só sugere/classifica |
| **032** | LGPD: retenção definida, exclusão sob demanda, minimização de dados |
| **033** | Permissões específicas de aprovação/transmissão separadas dos papéis CRUD |

---

## ✅ Status atual e próximos passos

- [x] **FD-0 (Descoberta):** escopo das 9 funções, arquitetura, modelo de dados, ADRs
- [x] **FD-1 Fundação (Backend):** migration Prisma + módulo NestJS + orquestrador + auditoria + 1ª skill (RECONCILIATION) — **CONCLUÍDA em 15/08/2026**
- [ ] **FD-1 Fundação (Frontend):** dashboard da Aurora ← **EM ANDAMENTO (Passo 4/6)**
- [ ] FD-2 Conciliação completa + Relatórios
- [ ] FD-3 a FD-9: ver roadmap

### ✅ Validações FD-1 concluídas
- Migração aplicada com sucesso em banco Docker e local
- Login JWT + lazy create da Aurora
- Botão "Rodar agora" dispara RECONCILIATION com métricas
- Auditoria 100% das ações registrada
- Multi-tenant isolado por companyId

### 🚀 Próxima entrega imediata
Passo 4/6 — Dashboard frontend da Aurora em `frontend/src/app/dashboard/funcionario-digital/`

> O FDR roda **sobre o Radar Conta Certa** (Sprints 1–A3 homologadas) e
> **reutiliza** os motores existentes: score de conciliação, memória de
> classificação, parser CSV, parser XML NF-e, ponte Bancário→Contábil,
> exportação SCI, SPED Bloco H, BI e exportação PDF/CSV.

## 📖 Glossário (para a diretoria)

| Termo | Significado simples |
|---|---|
| RPA | Robô que opera portais/sites quando não existe API |
| CNAB | Formato-padrão dos bancos para boletos/remessa/retorno |
| OFX | Formato de extrato bancário |
| DAS | Guia de impostos do Simples Nacional |
| DCTFWeb | Declaração de débitos previdenciários (via eSocial) |
| eCAC | Portal da Receita Federal |
| Procuração eletrônica | Autorização no eCAC para o contador agir pelo cliente |
| Memória de cálculo | Documento que mostra passo a passo como o imposto foi apurado |
| Human-in-the-loop | Robô faz, humano aprova o que importa |
| Cofre (vault) | Local criptografado para guardar senhas e certificados |

---

<div align="center">

**👨‍💻 Autor:** Marcos — Desenvolvedor Full Stack
**📞 Suporte:** contato@contacerta.com.br • www.contacerta.com.br
Licença proprietária — © 2026 Conta Certa Soluções Empresariais

Feito com ❤️ para libertar o contador do trabalho repetitivo

</div>
