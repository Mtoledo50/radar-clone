// =================================================================
// INÍCIO: backend/src/digital-employee/skills/reconciliation.skill.ts
// =================================================================
// ReconciliationSkill — Conciliação Banco × NF-e (Sprint FD-2)
//
// Reaproveita o BankingReconcileService existente (Sprint 29):
//   - score >= 80%  → auto-aprova (chama .confirm)
//   - score 50-79%  → enfileira para revisão humana (AutomationPending)
//   - score < 50%   → descarta
//
// Esta é a skill "âncora" do FDR: alto valor, baixo risco,
// usa motor já testado em produção.
// =================================================================
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { BankingReconcileService } from '../../banking/banking-reconcile.service';
import { BaseSkill, SkillContext, SkillResult } from './base.skill';
import { SkillKey } from '@prisma/client';

/** Thresholds configuráveis (futuramente vêm do params da skill) */
const THRESHOLD_AUTO = 80;
const THRESHOLD_REVIEW = 50;

export class ReconciliationSkill extends BaseSkill {
  readonly key: SkillKey = 'RECONCILIATION';
  readonly secondsPerItem = 45; // 45s por match manual (estimativa)

  constructor(
    prisma: PrismaService,
    audit: AutomationAuditService,
    private readonly reconcileService: BankingReconcileService,
  ) {
    super(prisma, audit);
  }

  async execute(context: SkillContext): Promise<SkillResult> {
    const { companyId, runId } = context;
    let itemsProcessed = 0;
    let itemsAutoApproved = 0;
    let itemsPendingHuman = 0;
    let itemsFailed = 0;

    // 1. Lista todos os clientes ativos do tenant
    const clients = await this.prisma.client.findMany({
      where: { companyId, status: 'ATIVO' },
      select: { id: true, companyName: true },
    });

    if (clients.length === 0) {
      return { itemsProcessed: 0, itemsAutoApproved: 0, itemsPendingHuman: 0, itemsFailed: 0, secondsSaved: 0 };
    }

    // 2. Para cada cliente, roda a conciliação do mês atual
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    for (const client of clients) {
      try {
        // 2a. Chama o motor existente para gerar sugestões
        const result = await this.reconcileService.suggest(companyId, client.id, year, month);

        if (!result.suggestions || result.suggestions.length === 0) {
          continue; // nada a conciliar neste cliente/mês
        }

        // 2b. Separa por score
        const toAutoApprove = result.suggestions.filter((s) => s.score >= THRESHOLD_AUTO);
        const toReview = result.suggestions.filter(
          (s) => s.score >= THRESHOLD_REVIEW && s.score < THRESHOLD_AUTO,
        );

        // 2c. Auto-aprova os >= 80% (chama o .confirm existente)
        if (toAutoApprove.length > 0) {
          await this.reconcileService.confirm(
            companyId,
            'AURORA', // usuário virtual
            toAutoApprove.map((s) => ({
              bankTransactionId: s.bankTransaction.id,
              fiscalInvoiceId: s.fiscalInvoice.id,
              action: 'confirm' as const,
              score: s.score,
              breakdown: s.breakdown,
            })),
          );

          // Registra auditoria em lote
          await this.logAudit(companyId, 'AUTO_APPROVED', 'BankNfeMatch', runId, {
            clientId: client.id,
            count: toAutoApprove.length,
            avgScore:
              toAutoApprove.reduce((sum, s) => sum + s.score, 0) / toAutoApprove.length,
          });

          itemsAutoApproved += toAutoApprove.length;
        }

        // 2d. Enfileira os 50-79% para revisão humana
        for (const suggestion of toReview) {
          await this.prisma.automationPending.create({
            data: {
              companyId,
              runId,
              type: 'MATCH',
              confidence: suggestion.score,
              payload: {
                clientId: client.id,
                bankTransactionId: suggestion.bankTransaction.id,
                fiscalInvoiceId: suggestion.fiscalInvoice.id,
                breakdown: suggestion.breakdown,
                bankAmount: Math.abs(Number(suggestion.bankTransaction.amount)),
                invoiceTotal: Number(suggestion.fiscalInvoice.totalValue),
              },
            },
          });
          itemsPendingHuman++;
        }

        itemsProcessed += result.suggestions.length;
      } catch (error) {
        // Um cliente com erro não aborta os demais
        console.error(`[ReconciliationSkill] erro no cliente ${client.id}:`, error?.message);
        itemsFailed++;
        await this.logAudit(companyId, 'CLIENT_ERROR', 'Client', client.id, {
          error: error?.message,
        });
      }
    }

    return {
      itemsProcessed,
      itemsAutoApproved,
      itemsPendingHuman,
      itemsFailed,
      secondsSaved: itemsAutoApproved * this.secondsPerItem,
      detail: { clientsProcessed: clients.length, year, month },
    };
  }
}
// =================================================================
// FIM: reconciliation.skill.ts
// =================================================================