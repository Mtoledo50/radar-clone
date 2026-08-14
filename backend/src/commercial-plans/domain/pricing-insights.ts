/**
 * ============================================================================
 * RADAR CONTA CERTA 2.0 — INSIGHTS DE PRECIFICAÇÃO
 * ----------------------------------------------------------------------------
 * Arquivo...: pricing-insights.ts
 * Sprint....: A1 (base matemática p/ Sprints A2 "dinheiro na mesa")
 * Camada....: DOMÍNIO PURO (sem dependências externas)
 *
 * POR QUE ESTE ARQUIVO EXISTE?
 *   Centraliza TODA a matemática de preço em um lugar único e testado.
 *   Nunca deixe contas de R$ espalhadas em components/serviços (ADR-020 R4).
 * ============================================================================
 */

/** Arredonda para 2 casas sem erro de ponto flutuante (R4). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Preço de um plano = valor de referência × multiplicador.
 * Ex.: base R$ 2.000 × 0,75 → R$ 1.500,00
 */
export function planPriceFromReference(
  baseValue: number,
  multiplier: number,
): number {
  return round2(baseValue * multiplier);
}

/**
 * Variação percentual de um plano em relação à base (plano ×1.00).
 * Ex.: 0,75 → -25 | 1,20 → +20
 */
export function relativePercentVsBase(multiplier: number): number {
  return round2((multiplier - 1) * 100);
}

/** Resultado do comparativo "quanto você cobra hoje vs ideal". */
export interface MoneyOnTable {
  hasLoss: boolean;      // true → está deixando dinheiro na mesa
  monthlyLoss: number;   // ideal - atual (R$/mês)
  annualLoss: number;    // monthlyLoss × 12 (argumento de venda forte)
}

/**
 * Calcula o "dinheiro na mesa" (Sprint A2 vai exibir isso na UI).
 * Se o cliente cobra MAIS que o ideal, loss fica negativo (sem alarme).
 */
export function calcMoneyOnTable(
  currentMonthly: number,
  idealMonthly: number,
): MoneyOnTable {
  const monthlyLoss = round2(idealMonthly - currentMonthly);
  return {
    hasLoss: monthlyLoss > 0,
    monthlyLoss,
    annualLoss: round2(monthlyLoss * 12),
  };
}