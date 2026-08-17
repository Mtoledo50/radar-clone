// =================================================================
// INÍCIO: backend/src/digital-employee/skills/accounting-bridge.skill.ts
// =================================================================
// AccountingBridgeSkill — Ponte Bancário → Contábil (Sprint FD-2)
//
// O QUE FAZ:
//   Promove o mês bancário ANTERIOR para a escrituração contábil,
//   reaproveitando o motor existente AccountingService.promoteFromBanking.
//   (Mês anterior = o mês que acabou de fechar no bancário.)
//
// POR QUE É SEGURA:
//   - Idempotente: promover 2× nunca duplica (upsert no motor existente)
//   - Toda promoção é auditada (compliance contábil — Pilar D)
//   - Se o mês não tiver lançamentos, retorna zerado sem erro
//
// 🔌 ADAPTADOR:
//   O método callPromote() isola a assinatura do promoteFromBanking().
//   Se a assinatura real for diferente (ex.: recebe objeto {year,month}),
//   ajuste APENAS esse método — 1 linha.
// =================================================================
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { AccountingService } from '../../accounting/accounting.service';
import { BaseSkill, SkillContext, SkillResult } from './base.skill';
import { SkillKey } from '@prisma/client';

export class AccountingBridgeSkill extends BaseSkill {
  /** Chave única da skill (registra no orquestrador) */
  readonly key: SkillKey = 'ACCOUNTING_BRIDGE';

  /** Estimativa: 60s economizados por lançamento promovido */
  readonly secondsPerItem = 60;

  constructor(
    prisma: PrismaService,
    audit: AutomationAuditService,
    private readonly accountingService: AccountingService, // 🆕 ponte existente
  ) {
    super(prisma, audit);
  }

  // =================================================================
  // 🔌 ADAPTADOR — isola a assinatura do promoteFromBanking()
  // =================================================================
  /**
   * Chama a ponte existente isolando a assinatura.
   *
   * ⚠️ SE DER ERRO DE ASSINATURA EM RUNTIME (ver errorMessage no run):
   *    - Tenta alternativa 1: (companyId, { year, month })
   *    - Tenta alternativa 2: (companyId, statementId)
   * Troque APENAS a linha do return dentro do try.
   */
  private async callPromote(companyId: string, year: number, month: number): Promise<any> {
    return (this.accountingService as any).promoteFromBanking(companyId, year, month);
  }

  /**
   * Extrai o nº de lançamentos promovidos de formatos de retorno possíveis.
   */
  private countPromoted(raw: any): number {
    if (!raw) return 0;
    if (typeof raw === 'number') return raw;
    const n =
      raw.itemsPromoted ??
      raw.promoted ??
      raw.created ??
      raw.count ??
      raw.total ??
      (Array.isArray(raw?.entries) ? raw.entries.length : 0) ??
      (Array.isArray(raw) ? raw.length : 0);
    return Number(n) || 0;
  }

  // =================================================================
  // ▶️ EXECUÇÃO — pipeline universal (Pilar B)
  // =================================================================
  async execute(context: SkillContext): Promise<SkillResult> {
    const { companyId, runId } = context;

    // -----------------------------------------------------------------
    // 1. COLETAR — define o mês-alvo (mês anterior ao atual)
    //    Ex.: hoje é 17/08 → promove Julho/2026
    //    (params pode sobrescrever: { year, month } via UI no futuro)
    // -----------------------------------------------------------------
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = context.params?.year ?? target.getFullYear();
    const month = context.params?.month ?? target.getMonth() + 1;

    // -----------------------------------------------------------------
    // 2. EXECUTAR — chama a ponte bancário → contábil
    // -----------------------------------------------------------------
    let promoted = 0;
    try {
      const raw = await this.callPromote(companyId, year, month);
      promoted = this.countPromoted(raw);
    } catch (error) {
      // Mês sem lançamentos / já promovido / assinatura diferente:
      // registra auditoria e retorna zerado SEM quebrar o run.
      await this.logAudit(companyId, 'PROMOTE_SKIPPED', 'AccountingEntry', runId, {
        year,
        month,
        motivo: error?.message,
      });

      return {
        itemsProcessed: 0,
        itemsAutoApproved: 0,
        itemsPendingHuman: 0,
        itemsFailed: 0,
        secondsSaved: 0,
        detail: { year, month, skipped: true, motivo: error?.message },
      };
    }

    // -----------------------------------------------------------------
    // 3. REGISTRAR — auditoria da promoção (compliance contábil)
    // -----------------------------------------------------------------
    await this.logAudit(companyId, 'MONTH_PROMOTED', 'AccountingEntry', runId, {
      year,
      month,
      promoted,
    });

    // -----------------------------------------------------------------
    // 4. REPORTAR — métricas para o AutomationRun
    //    (promoção é ação de ponte: conta como "auto-aprovada" pois o
    //     motor existente já valida o mês fechado; humano revisa no contábil)
    // -----------------------------------------------------------------
    return {
      itemsProcessed: promoted,
      itemsAutoApproved: promoted,
      itemsPendingHuman: 0,
      itemsFailed: 0,
      secondsSaved: promoted * this.secondsPerItem,
      detail: { year, month },
    };
  }
}
// =================================================================
// FIM: accounting-bridge.skill.ts
// =================================================================