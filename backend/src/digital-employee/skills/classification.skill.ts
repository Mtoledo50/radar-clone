// =================================================================
// INÍCIO: backend/src/digital-employee/skills/classification.skill.ts
// =================================================================
// ClassificationSkill — Classificação com Memória (Sprint FD-2)
//
// O QUE FAZ:
//   Busca transações bancárias ainda NÃO classificadas e aplica a
//   "memória de aprendizado" do Radar (BankingService.classify):
//     - confiança >= 80%  → classifica SOZINHA (auto-aprovação)
//     - confiança 50–79%  → enfileira na fila 🟡 (revisão humana)
//     - confiança < 50%   → ignora (deixa para o humano)
//
// REGRAS DE OURO RESPEITADAS:
//   - Nunca toca em mês FECHADO (trava de compliance existente)
//   - Toda ação é auditada (AutomationAuditService)
//   - Limite de segurança: máx. 200 itens por execução
//
// 🔌 ADAPTADOR:
//   O método normalizeSuggestion() isola o formato de retorno do
//   classify(). Se o retorno real for diferente, ajuste APENAS ele.
// =================================================================
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationAuditService } from '../audit/automation-audit.service';
import { BankingService } from '../../banking/banking.service';
import { BaseSkill, SkillContext, SkillResult } from './base.skill';
import { SkillKey } from '@prisma/client';

/** Thresholds de confiança (mesma régua da conciliação — consistência) */
const THRESHOLD_AUTO = 80;   // >= 80% → auto-aprova
const THRESHOLD_REVIEW = 50; // 50–79% → fila de revisão humana

/** Limite de segurança: nunca processar mais que isso em 1 run */
const MAX_ITEMS_PER_RUN = 200;

export class ClassificationSkill extends BaseSkill {
  /** Chave única da skill (registra no orquestrador) */
  readonly key: SkillKey = 'CLASSIFICATION';

  /** Estimativa: 30s economizados por lançamento classificado */
  readonly secondsPerItem = 30;

  constructor(
    prisma: PrismaService,
    audit: AutomationAuditService,
    private readonly bankingService: BankingService, // 🆕 motor de memória existente
  ) {
    super(prisma, audit);
  }

  // =================================================================
  // 🔌 ADAPTADOR — isola o formato de retorno do classify()
  // =================================================================
  /**
   * Normaliza o retorno do BankingService.classify() para um formato
   * padrão { nature, confidence }, aceitando variações possíveis.
   *
   * Se o classify() retornar algo diferente do esperado, ajuste
   * APENAS este método — o resto da skill permanece intacto.
   */
  private normalizeSuggestion(raw: any): { nature: string | null; confidence: number } {
    // Sem sugestão → nada a fazer
    if (!raw) return { nature: null, confidence: 0 };

    // Caso retorne uma string simples (a natureza direta)
    if (typeof raw === 'string') {
      return { nature: raw, confidence: 90 }; // regra aprendida = alta confiança
    }

    // Caso retorne objeto: tenta os campos mais prováveis
    const nature =
      raw.nature ?? raw.category ?? raw.label ?? raw.suggestion ?? null;

    // Confiança explícita ou derivada (regra casada sem score = 90%)
    let confidence = Number(raw.confidence ?? raw.score ?? NaN);
    if (Number.isNaN(confidence)) confidence = nature ? 90 : 0;

    return {
      nature: typeof nature === 'string' && nature !== 'NAO_CLASSIFICADO' ? nature : null,
      confidence,
    };
  }

  // =================================================================
  // ▶️ EXECUÇÃO — pipeline universal (Pilar B)
  // =================================================================
  async execute(context: SkillContext): Promise<SkillResult> {
    const { companyId, runId } = context;

    // Contadores de métricas (populam o AutomationRun no final)
    let itemsProcessed = 0;
    let itemsAutoApproved = 0;
    let itemsPendingHuman = 0;
    let itemsFailed = 0;

    // -----------------------------------------------------------------
    // 1. COLETAR — transações ainda NÃO classificadas do tenant
    //    (sem filtro de data + limite de segurança = simples e seguro)
    // -----------------------------------------------------------------
    const transactions = await this.prisma.bankTransaction.findMany({
      where: { companyId, nature: 'NAO_CLASSIFICADO' },
      take: MAX_ITEMS_PER_RUN,
    });

    // Nada para classificar → retorna zerado (comportamento correto)
    if (transactions.length === 0) {
      return {
        itemsProcessed: 0,
        itemsAutoApproved: 0,
        itemsPendingHuman: 0,
        itemsFailed: 0,
        secondsSaved: 0,
        detail: { motivo: 'Nenhuma transação NAO_CLASSIFICADA encontrada.' },
      };
    }

    // -----------------------------------------------------------------
    // 2. INTERPRETAR + CRUZAR — aplica a memória de aprendizado
    // -----------------------------------------------------------------
    for (const tx of transactions) {
      try {
        // 🔌 Chama o motor existente (aprende com correções do contador)
        const raw = await this.bankingService.classify(companyId, tx.description);
        const { nature, confidence } = this.normalizeSuggestion(raw);

        // Sem sugestão útil → pula este item
        if (!nature) {
          itemsFailed++; // conta como "não resolvido" (não é erro técnico)
          continue;
        }

        itemsProcessed++;

        // ---------------------------------------------------------------
        // 3. APONTAR + EXECUTAR — decide pelo score (régua 80/50)
        // ---------------------------------------------------------------
        if (confidence >= THRESHOLD_AUTO) {
          // 🟢 AUTO-APROVAÇÃO: classifica sozinha (score >= 80%)
          await this.prisma.bankTransaction.update({
            where: { id: tx.id },
            data: { nature },
          });
          itemsAutoApproved++;
        } else if (confidence >= THRESHOLD_REVIEW) {
          // 🟡 FILA DE REVISÃO: humano decide (50–79%)
          await this.prisma.automationPending.create({
            data: {
              companyId,
              runId,
              type: 'CLASSIFICATION',
              confidence,
              payload: {
                transactionId: tx.id,
                description: tx.description,
                amount: Number(tx.amount),
                suggestedNature: nature,
              },
            },
          });
          itemsPendingHuman++;
        } else {
          // ⚪ SCORE BAIXO: ignora (deixa para o humano, sem poluir a fila)
          itemsFailed++;
        }
      } catch (error) {
        // Um item com erro NÃO aborta os demais (resiliência)
        console.error(`[ClassificationSkill] erro na tx ${tx.id}:`, error?.message);
        itemsFailed++;
        await this.logAudit(companyId, 'ITEM_ERROR', 'BankTransaction', tx.id, {
          error: error?.message,
        });
      }
    }

    // -----------------------------------------------------------------
    // 4. REGISTRAR — auditoria do lote (1 registro por run, não por item)
    // -----------------------------------------------------------------
    await this.logAudit(companyId, 'BATCH_CLASSIFIED', 'BankTransaction', runId, {
      total: transactions.length,
      autoApproved: itemsAutoApproved,
      pendingHuman: itemsPendingHuman,
      notResolved: itemsFailed,
    });

    // -----------------------------------------------------------------
    // 5. REPORTAR — métricas para o AutomationRun
    // -----------------------------------------------------------------
    return {
      itemsProcessed,
      itemsAutoApproved,
      itemsPendingHuman,
      itemsFailed,
      secondsSaved: itemsAutoApproved * this.secondsPerItem,
      detail: { scanned: transactions.length },
    };
  }
}
// =================================================================
// FIM: classification.skill.ts
// =================================================================