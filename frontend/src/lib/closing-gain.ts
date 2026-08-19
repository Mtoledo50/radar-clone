/**
 * =================================================================
 * closing-gain.ts — Cálculo de ganho/concessão no fechamento
 * =================================================================
 * Espelho CLIENT-SIDE da função `calcClosingGain` do backend
 * (backend/src/commercial-plans/domain/closing-gain.ts).
 *
 * Usado no ClosingModal para preview em tempo real enquanto o
 * vendedor move o slider de desconto. Evita round-trip ao servidor.
 *
 * ⚠️ REGRA DE OURO: a fonte da verdade é o backend. Esta função
 *    existe APENAS para UX (preview instantâneo). O save final
 *    sempre chama o endpoint que recalcula no servidor.
 * =================================================================
 */

export interface ClosingInput {
  /** Preço "de tabela" do plano escolhido (R$) */
  basePrice: number;
  /** Preço que o cliente paga hoje (R$) — pode ser 0 se for cliente novo */
  currentPrice: number;
  /** Preço final após negociação (R$) */
  finalPrice: number;
  /** Passos da negociação (ex: "cliente pediu 10%, dei 5%") */
  steps?: string;
}

export interface ClosingGain {
  /** Preço final arredondado (round2 — ADR-020) */
  finalPrice: number;
  /** Quanto o vendedor "deixou na mesa" por mês (R$) — sempre ≥ 0 */
  concessionMonthly: number;
  /** Concessão anualizada (×12) */
  concessionYearly: number;
  /** Ganho real vs o que o cliente paga hoje (R$/mês) — pode ser negativo */
  gainMonthly: number;
  /** Ganho anualizado (×12) */
  gainYearly: number;
  /** true se finalPrice < currentPrice (estamos cobrando MENOS que hoje) */
  belowCurrent: boolean;
  /** Desconto percentual em relação ao base (0–100) */
  discountPercent: number;
}

/**
 * Calcula ganho/concessão do fechamento.
 * Usa round2 para evitar erro de ponto flutuante (ADR-020).
 */
export function calcClosingGain(input: ClosingInput): ClosingGain {
  const { basePrice, currentPrice, finalPrice } = input;

  // Segurança: nunca valores negativos
  const base = Math.max(0, basePrice || 0);
  const current = Math.max(0, currentPrice || 0);
  const final_ = Math.max(0, finalPrice || 0);

  // Concessão = quanto abrimos mão do preço "ideal" (base)
  const concessionMonthly = round2(base - final_);
  const concessionYearly = round2(concessionMonthly * 12);

  // Ganho real = diferença entre o novo preço e o que o cliente pagava
  // Positivo = estamos cobrando MAIS (ganho); Negativo = cobrando MENOS
  const gainMonthly = round2(final_ - current);
  const gainYearly = round2(gainMonthly * 12);

  // Flag de alerta: estamos cobrando menos do que o cliente pagava?
  const belowCurrent = final_ < current && current > 0;

  // Desconto % em relação ao preço de tabela
  const discountPercent = base > 0 ? round2(((base - final_) / base) * 100) : 0;

  return {
    finalPrice: final_,
    concessionMonthly,
    concessionYearly,
    gainMonthly,
    gainYearly,
    belowCurrent,
    discountPercent,
  };
}

/** Arredonda para 2 casas decimais evitando erro de ponto flutuante */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Formata valor em BRL (R$ 1.234,56) */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}