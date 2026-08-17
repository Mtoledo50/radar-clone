# 🤖 FUNCIONARIO_DIGITAL.md — Aurora, a Funcionária Digital

> 📌 Dossiê oficial do Funcionário Digital do Radar Conta Certa.
> Última atualização: 17/08/2026 (pós-Sprint FD-2 parcial — 3 skills + crons ativos).
> Cliente-piloto: Academia do Renan.

---

## 🌅 1. O nome

**AURORA** — **A**utomação **U**nificada de **R**otinas e **O**brigações,
com **R**evisão e **A**uditoria.

Como o JARVIS do escritório contábil: a aurora é o primeiro raio de luz —
ela chega às 02:00 e prepara tudo antes do time acordar. Mas nunca decide
sozinha o que gera obrigação legal (Regra de Ouro — ADR-030).

---

## 2. O que é

Funcionária digital que executa rotinas contábeis **SOBRE** o Radar Conta Certa,
com revisão humana obrigatória para ações legais. **Não é um SaaS paralelo**:
é uma camada de automação que reaproveita os motores existentes
(`BankingReconcileService`, `BankingService.classify`, `AccountingService.promoteFromBanking`).

---

## 3. Stack

- **Backend:** NestJS 10 + `@nestjs/schedule` + `cron` + Prisma (módulo `digital-employee`)
- **Frontend:** `/dashboard/funcionario-digital` (Next.js 16 + Zustand + Axios)
- **Orquestração:** `JobRunnerService` + `SchedulerService` + `AutomationAuditService`
- **RPA (fases futuras):** Playwright em worker separado (ADR-025)
- **Cofres:** AES-256-GCM, chave em env, nunca em código (ADR-032)

---

## 4. Modelo de dados (6 tabelas + 6 enums)

### Tabelas
`robot_workers` • `robot_worker_skills` • `automation_runs` •
`automation_pendings` • `automation_audits` • `approval_records`

### Enums
`SkillKey` • `AutonomyLevel` • `RunStatus` • `TriggerType` • `PendingStatus` • `ApprovalDecision`

---

## 5. Skills ativas

| Skill | Cron | Status | Motor reaproveitado |
|---|---|---|---|
| RECONCILIATION — Conciliação Banco × NF-e | `0 2 * * *` | ✅ FD-1 | `BankingReconcileService` (Sprint 29) |
| CLASSIFICATION — Classificação c/ memória | `30 2 * * *` | ✅ FD-2 | `BankingService.classify` (Sprint 22) |
| ACCOUNTING_BRIDGE — Ponte Bancário → Contábil | `0 3 * * *` | ✅ FD-2 | `AccountingService.promoteFromBanking` |
| MONTHLY_REPORT — Relatório mensal PDF | `0 8 5 * *` | 🚧 próxima sessão | `jspdf` + BI existente |

### 🧩 Padrão de Adaptadores (usado em todas as skills)

Cada skill isola a chamada ao motor existente em um método `private`
(`normalizeSuggestion`, `callPromote`, etc.). Se a assinatura do motor mudar,
ajusta-se **APENAS o adaptador** — o resto da skill permanece intacto.
Isso protege o código contra variações de retorno sem duplicar lógica.

---

## 6. Regra de Ouro (ADR-030)

> A automação **prepara, calcula, organiza e recomenda**.
> O humano **aprova** tudo que gera obrigação legal, pagamento ou transmissão.
> Ações com `riskLevel = LEGAL` **sempre** passam por aprovação, mesmo com score 100%.

### Régua de confiança aplicada nas skills

- **Score ≥ 80%** → auto-aprovação (classifica/concilia sozinha)
- **Score 50–79%** → fila 🟡 de revisão humana (`automation_pendings`)
- **Score < 50%** → descartado (deixa para o humano, sem poluir a fila)

---

## 7. Arquitetura Interna (Pilar B — Pipeline Universal)

Toda skill herda de `BaseSkill` e segue o pipeline:
COLETAR → INTERPRETAR → CRUZAR → APONTAR DIVERGÊNCIAS
→ 🟡 FILA DE REVISÃO (se score < 80% ou LEGAL)
→ EXECUTAR → REGISTRAR (auditoria) → REPORTAR


### Componentes do orquestrador

- **`JobRunnerService`** — cria `AutomationRun`, executa skill, atualiza métricas
- **`SchedulerService`** — agenda crons, sincroniza com toggles ON/OFF em tempo real
- **`AutomationAuditService`** — registra 100% das ações (compliance contábil)

---

## 8. Como testar

### Disparo manual (botão "Rodar agora" via API)

```powershell
$login = Invoke-RestMethod -Uri http://localhost:3001/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aurora.com","password":"123456"}'
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Uri http://localhost:3001/digital-employee/skills/RECONCILIATION/run -Method POST -Headers $headers
Invoke-RestMethod -Uri http://localhost:3001/digital-employee/skills/CLASSIFICATION/run -Method POST -Headers $headers
Invoke-RestMethod -Uri http://localhost:3001/digital-employee/skills/ACCOUNTING_BRIDGE/run -Method POST -Headers $headers

Crons ativos (produção controlada)
Ao subir o backend com skills habilitadas (toggle ON no dashboard), o
SchedulerService.onModuleInit agenda automaticamente. Toggle OFF remove o
cron em tempo real.

9. ADRs aplicadas
ADR       Decisão
030       Regra de Ouro (LEGAL nunca é AUTO)
031       Cálculo tributário determinístico; IA só sugere/classifica
032       Cofres AES-256-GCM (implementação em FD-8)
033       Perfis de aprovação (Auxiliar/Analista/Supervisor/Contador)
034       Arquivos estruturais: sempre delta, nunca substituição total
025       Playwright em worker separado (fases RPA)

10. Roadmap FD-2 → FD-9
FD-2 final: MonthlyReportSkill (PDF mensal) + UI de aprovação da fila 🟡 + teste com dados reais (Academia do Renan)
FD-3: Importação automática NFS-e (e-mail + portal + OCR)
FD-4: Emissão de guias (DAS/ISS/DARF) com memória de cálculo
FD-5: Faturamento CNAB 240/400 + régua de cobrança
FD-6: SPED/obrigações + certificado A1 criptografado
FD-7: Integração com Domínio/Questor/Sage (arquivo ou RPA)
FD-8: Legalização (cofre de senhas, procurações, eCAC)
FD-9: DP leve (integração com folha existente — NÃO construir do zero)

11. Status de validação
Ambiente: banco local (5432) • backend em 3001 • frontend em 3002
CORS: multi-origem (3000/3002) via main.ts
✅ Validações FD-1 (15/08/2026)
Login JWT + lazy create da Aurora
Run MANUAL com métricas (3ms)
Auditoria SKILL_FINISHED:RECONCILIATION registrada
Dashboard com dados reais + menu lateral integrado
✅ Validações FD-2 parcial (17/08/2026)
ClassificationSkill executa com tratamento gracioso (0 itens = esperado em empresa teste)
AccountingBridgeSkill trata ausência de fechamento (skipped: true, sem quebrar)
Crons ↔ toggles: ON agenda, OFF desagenda, boot registra as skills ligadas
Dashboard atualiza em tempo real (refresh 30s)
🚧 Próximas validações (FD-2 final)
Teste com dados reais da Academia do Renan (itemsProcessed > 0)
UI de aprovação de pendências (ApprovalRecord + notas)
Geração de PDF mensal (MonthlyReportSkill)


---

## 📊 Principais mudanças (resumo executivo)

| Seção | Antes | Depois |
|---|---|---|
| Cabeçalho | Data 15/08 | Data 17/08 + tag de atualização |
| Skills | 1 ✅ + 3 🚧 | 3 ✅ + 1 🚧 |
| Estrutura | Seções sem numeração | 11 seções numeradas (mais fácil de referenciar) |
| 🧩 Adaptadores | Não documentado | Seção 5 explica o padrão |
| ADRs | Só citadas no CHANGELOG | Tabela dedicada (§9) |
| Como testar | Não existia | Seção §8 com comandos reais |
| Validações | Só FD-1 | FD-1 + FD-2 parcial + próximas |

---

## 🎯 Próximo passo

Salve o arquivo e me confirme com **"✅ dossiê atualizado"**. Daí eu te entrego, na próxima mensagem, o **FD-2 final** — a `MonthlyReportSkill` (PDF mensal da Aurora) + a UI de aprovação da fila 🟡 — fechando a FD-2 completa e preparando a Aurora para o piloto com a Academia do Renan. 🌅🚀

