# 🤖 Módulo Aurora: Funcionário Digital

**Status:** ✅ Operacional (Sprints FD-1 a FD-8 homologadas)  
**Responsável:** Motor de Automação com Revisão Humana (Human-in-the-Loop)

## 🎯 Propósito
Automatizar rotinas contábeis repetitivas (conciliação, classificação, emissão de guias) sem substituir o julgamento do contador. A Aurora prepara, calcula e recomenda; o humano aprova.

## 🏗️ Arquitetura
- **Backend:** NestJS 10 + `@nestjs/schedule` (Crons) + Prisma (`digital-employee` module).
- **Frontend:** Next.js 16 (`/dashboard/funcionario-digital`) com Zustand e refresh de 30s.
- **Segurança:** Cofre AES-256-GCM para credenciais e certificados A1 (ADR-032).

## ⚙️ Skills Ativas (Catálogo)
| Skill | Gatilho | Comportamento |
|---|---|---|
| `RECONCILIATION` | Cron 02:00 ou Manual | Cruza débitos × NF-e. Score ≥80% auto-aprova; 50-79% vai para fila 🟡. |
| `CLASSIFICATION` | Cron 02:30 ou Manual | Classifica extratos usando memória de aprendizado. |
| `ACCOUNTING_BRIDGE` | Cron 03:00 ou Manual | Promove mês fechado para lançamentos contábeis (partida dobrada). |
| `MONTHLY_REPORT` | Cron 08:00 (dia 5) | Gera PDF mensal do cliente com KPIs e DRE. |
| `NFSE_IMPORT` | Cron IMAP ou Watch Folder | Coleta e parseia XML de NFS-e (ABRASf 2.0). |
| `TAX_GUIDES` | Manual / Agendado | Calcula DAS/ISS com memória de apuração e gera PDF da guia. |

## 📊 Modelo de Dados (Prisma)
- `RobotWorker` / `RobotWorkerSkill`: Configuração do funcionário e toggles.
- `AutomationRun`: Histórico de execuções (items processados, tempo salvo).
- `AutomationPending`: Fila de revisão humana (score 50-79%).
- `AutomationAudit`: Log imutável de todas as ações (compliance).

## ⚠️ Regra de Ouro (ADR-030)
Nenhuma ação com `riskLevel = LEGAL` (emissão de guia, transmissão SPED, promoção contábil) é 100% automática. A aprovação humana é **obrigatória**, independente do score de confiança.

## 📂 Localização do Código
- **Backend:** `backend/src/digital-employee/`
- **Frontend:** `frontend/src/app/dashboard/funcionario-digital/`
- **Migrações:** `backend/prisma/migrations/*_fd*_foundation_robot_worker`