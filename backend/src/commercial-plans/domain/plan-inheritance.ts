/**
 * ============================================================================
 * RADAR CONTA CERTA 2.0 — DOMÍNIO DE PLANOS COMERCIAIS
 * ----------------------------------------------------------------------------
 * Arquivo...: plan-inheritance.ts
 * Sprint....: A1 (Motor de Herança de Planos)
 * Camada....: DOMÍNIO PURO (sem banco, sem HTTP → 100% testável)
 *
 * O QUE ELE FAZ?
 *   Recebe os planos do escritório (nome, multiplicador, flag independente e
 *   itens próprios) e devolve cada plano com:
 *     - inheritedItemIds → itens herdados dos planos menores
 *     - allItemIds.......→ itens próprios + herdados (o que a proposta exibe)
 *
 * REGRAS DE NEGÓCIO (ADR-020):
 *   R1) Ordem sempre por multiplicador crescente (empate → nome).
 *   R2) Plano NÃO independente herda tudo dos anteriores não-independentes.
 *   R3) Plano INDEPENDENTE não herda e NÃO doa itens (isolamento total).
 * ============================================================================
 */

/** Entrada mínima necessária por plano (vem do banco depois, na Sprint A2). */
export interface PlanInput {
  id: string;            // UUID do plano no banco
  name: string;          // Ex.: START, PRIME, BLACK
  multiplier: number;    // Ex.: 0.65, 1.00, 1.45
  independent: boolean;  // true = plano isolado (ex.: MEI)
  ownItemIds: string[];  // IDs dos itens marcados MANUALMENTE neste plano
}

/** Saída enriquecida após aplicar a herança. */
export interface ResolvedPlan extends PlanInput {
  order: number;             // Posição na vitrine (0 = mais barato)
  inheritedItemIds: string[] // Itens que vieram dos planos menores
  allItemIds: string[];      // próprios + herdados (sem duplicados)
}

/** Erro de negócio tipado (a UI traduz para toast amigável depois). */
export class PlanInheritanceError extends Error {}

/**
 * Resolve a herança de todos os planos de uma vez.
 * @throws PlanInheritanceError se houver ID duplicado ou multiplicador <= 0.
 */
export function resolvePlanInheritance(plans: PlanInput[]): ResolvedPlan[] {
  // ---- Validações de integridade (falha cedo, falha claro) -----------------
   if (!plans || plans.length === 0) {
    return [];
    throw new PlanInheritanceError('Nenhum plano informado.');
  }
  const ids = plans.map((p) => p.id);
  if (new Set(ids).size !== ids.length) {
    throw new PlanInheritanceError('Existem planos com ID duplicado.');
  }
  for (const p of plans) {
    if (!(p.multiplier > 0)) {
      throw new PlanInheritanceError(
        `Multiplicador inválido (${p.multiplier}) no plano "${p.name}".`,
      );
    }
  }

  // ---- R1: ordenação estável por multiplicador (empate → nome) -------------
  const sorted = [...plans].sort(
    (a, b) => a.multiplier - b.multiplier || a.name.localeCompare(b.name),
  );

  // "piscina" de itens doados pelos planos anteriores não-independentes.
  const donorPool = new Set<string>();
  const result: ResolvedPlan[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const plan = sorted[i];
    const own = new Set(plan.ownItemIds); // já remove duplicados internos

    // R3: independente = isolado (não herda nada).
    const inherited = plan.independent
      ? []
      : [...donorPool].filter((id) => !own.has(id));

    // R2/R3: composição final da vitrine.
    const all = plan.independent
      ? [...own]
      : [...new Set([...own, ...donorPool])];

    // Só plano não-independente DOA itens para os maiores.
    if (!plan.independent) {
      own.forEach((id) => donorPool.add(id));
    }

    result.push({
      ...plan,
      ownItemIds: [...own],
      inheritedItemIds: inherited,
      allItemIds: all,
      order: i,
    });
  }

  return result;
}