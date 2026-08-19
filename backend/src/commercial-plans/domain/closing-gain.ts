// =================================================================
// INÍCIO: backend/src/commercial-plans/domain/closing-gain.ts
// =================================================================
// Sprint A4 — Fechamento com Ganho (domínio puro, testável)
//
// Conceito: ao fechar uma proposta com desconto, o vendedor enxerga
//   1) a CONCESSÃO (quanto abriu mão vs preço cheio) e
//   2) o GANHO (quanto o escritório passa a ganhar vs o que o
//      cliente paga HOJE) — o argumento de venda da proposta.
//
// ADR-020: tudo com round2 (sem erro de ponto flutuante).
// =================================================================

export interface ClosingGainInput {
  idealPrice: number;            /// preço cheio de referência (R$/mês)
  currentCharge?: number | null; /// o que o cliente paga hoje (R$/mês)
  discountPercent: number;       /// desconto aplicado (0–50)
}

export interface ClosingGainResult {
  finalPrice: number;        /// preço fechado (R$/mês)
  discountPercent: number;
  concessionMonthly: number; /// concessão vs preço cheio (R$/mês)
  concessionYearly: number;  /// concessão anual (R$)
  gainMonthly: number | null;/// ganho vs hoje (null se sem currentCharge)
  gainYearly: number | null;
  belowCurrent: boolean;     /// 🟡 fechou abaixo do que o cliente paga hoje?
  steps: string[];           /// memória do fechamento (auditoria/argumento)
}

export const round2 = (v: number) => Math.round(v * 100) / 100;

export function calcClosingGain(input: ClosingGainInput): ClosingGainResult {
  const { idealPrice, currentCharge, discountPercent } = input;

  if (idealPrice < 0) throw new Error('Preço ideal não pode ser negativo');
  if (discountPercent < 0 || discountPercent > 50) {
    throw new Error('Desconto deve estar entre 0% e 50%');
  }
  if (currentCharge != null && currentCharge < 0) {
    throw new Error('Cobrança atual não pode ser negativa');
  }

  // 1) Preço final = ideal × (1 − desconto)
  const finalPrice = round2(idealPrice * (1 - discountPercent / 100));

  // 2) Concessão = quanto abriu mão vs preço cheio
  const concessionMonthly = round2(idealPrice - finalPrice);
  const concessionYearly = round2(concessionMonthly * 12);

  // 3) Ganho = quanto o escritório ganha vs hoje
  const gainMonthly =
    currentCharge != null ? round2(finalPrice - currentCharge) : null;
  const gainYearly = gainMonthly != null ? round2(gainMonthly * 12) : null;
  const belowCurrent = currentCharge != null && finalPrice < currentCharge;

  // 4) Memória do fechamento
  const steps = [
    `Preço cheio de referência: R$ ${idealPrice.toFixed(2)}/mês`,
    `Desconto aplicado: ${discountPercent.toFixed(1)}%`,
    `Preço fechado: R$ ${finalPrice.toFixed(2)}/mês (concessão R$ ${concessionMonthly.toFixed(2)}/mês = R$ ${concessionYearly.toFixed(2)}/ano)`,
    currentCharge != null
      ? `Cliente paga hoje R$ ${currentCharge.toFixed(2)} → ganho R$ ${gainMonthly!.toFixed(2)}/mês (R$ ${gainYearly!.toFixed(2)}/ano)${belowCurrent ? ' — 🟡 ABAIXO do atual!' : ''}`
      : 'Sem cobrança atual informada (cliente novo)',
  ];

  return {
    finalPrice,
    discountPercent,
    concessionMonthly,
    concessionYearly,
    gainMonthly,
    gainYearly,
    belowCurrent,
    steps,
  };
}
// =================================================================
// FIM: closing-gain.ts
// =================================================================