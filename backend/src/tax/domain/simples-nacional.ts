// =================================================================
// INÍCIO: backend/src/tax/domain/simples-nacional.ts
// =================================================================
// Motor de cálculo do Simples Nacional — DAS (LC 123/2006, Anexo III)
//
// Domínio PURO: sem Prisma/HTTP (padrão da Sprint A1 — testável).
//
// Fórmula da alíquota efetiva (Anexo III):
//   efetiva = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12
//   DAS do mês = receita do mês × alíquota efetiva
//
// ADR-020: preços sempre round2 (sem erro de ponto flutuante).
// Memória de cálculo: cada passo vira string p/ auditoria (FD-4).
// =================================================================

/** Faixa do Simples (Anexo III — serviços em geral) */
export interface SimplesBracket {
  ceiling: number;     /// Teto de RBT12 da faixa (R$)
  nominalRate: number; /// Alíquota nominal (%)
  deduction: number;   /// Parcela a deduzir (R$)
}

/** Anexo III completo — LC 123/2006 (valores vigentes) */
export const ANEXO_III: SimplesBracket[] = [
  { ceiling: 180_000, nominalRate: 6.0, deduction: 0 },
  { ceiling: 360_000, nominalRate: 11.2, deduction: 13_500 },
  { ceiling: 720_000, nominalRate: 13.5, deduction: 37_800 },
  { ceiling: 1_800_000, nominalRate: 16.0, deduction: 63_000 },
  { ceiling: 3_600_000, nominalRate: 21.0, deduction: 111_300 },
  { ceiling: 4_800_000, nominalRate: 33.0, deduction: 648_000 },
];

/** Teto absoluto do Simples (acima disso → empresa sai do regime) */
export const RBT12_MAX = 4_800_000;

/** Resultado do cálculo com memória auditável */
export interface DasCalcResult {
  rbt12: number;          /// Receita bruta últimos 12 meses (R$)
  bracketIndex: number;   /// Faixa encontrada (1–6)
  nominalRate: number;    /// Alíquota nominal da faixa (%)
  deduction: number;      /// Parcela a deduzir da faixa (R$)
  effectiveRate: number;  /// Alíquota efetiva calculada (%)
  revenueMonth: number;   /// Receita do mês de apuração (R$)
  dasValue: number;       /// Valor da guia DAS (R$)
  steps: string[];        /// Memória de cálculo (passos p/ auditoria)
  lawRef: string;         /// Referência legal
}

/** round2 (ADR-020) */
export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Calcula o DAS mensal do Simples Nacional (Anexo III).
 * @param revenueMonth receita do mês de apuração (R$)
 * @param rbt12 receita bruta acumulada dos últimos 12 meses (R$)
 * @throws se RBT12 acima do teto ou valores negativos
 */
export function calcDasSimples(revenueMonth: number, rbt12: number): DasCalcResult {
  if (revenueMonth < 0) throw new Error('Receita do mês não pode ser negativa');
  if (rbt12 < 0) throw new Error('RBT12 não pode ser negativo');
  if (rbt12 > RBT12_MAX) {
    throw new Error(
      `RBT12 ${rbt12.toFixed(2)} acima do teto do Simples (${RBT12_MAX}) — empresa não optante`,
    );
  }

  // 1) Encontra a faixa pelo RBT12
  let bracketIndex = ANEXO_III.findIndex((b) => rbt12 <= b.ceiling);
  if (bracketIndex === -1) bracketIndex = ANEXO_III.length - 1;
  const bracket = ANEXO_III[bracketIndex];

  // 2) Alíquota efetiva = (RBT12 × nominal − dedução) / RBT12
  //    (RBT12 = 0 → empresa sem histórico: usa nominal da 1ª faixa)
  const effectiveRate =
    rbt12 > 0
      ? Math.max(
          ((rbt12 * (bracket.nominalRate / 100) - bracket.deduction) / rbt12) * 100,
          0,
        )
      : ANEXO_III[0].nominalRate;

  // 3) DAS = receita do mês × efetiva
  const dasValue = round2(revenueMonth * (effectiveRate / 100));

  // 4) Memória de cálculo (cada passo auditável)
  const steps = [
    `RBT12 = R$ ${rbt12.toFixed(2)} → Faixa ${bracketIndex + 1} (teto R$ ${bracket.ceiling.toFixed(2)})`,
    `Alíquota nominal = ${bracket.nominalRate.toFixed(1)}% | Parcela a deduzir = R$ ${bracket.deduction.toFixed(2)}`,
    `Alíquota efetiva = (RBT12 × ${bracket.nominalRate.toFixed(1)}% − ${bracket.deduction.toFixed(2)}) / RBT12 = ${effectiveRate.toFixed(2)}%`,
    `DAS = R$ ${revenueMonth.toFixed(2)} × ${effectiveRate.toFixed(2)}% = R$ ${dasValue.toFixed(2)}`,
  ];

  return {
    rbt12,
    bracketIndex: bracketIndex + 1,
    nominalRate: bracket.nominalRate,
    deduction: bracket.deduction,
    effectiveRate: round2(effectiveRate),
    revenueMonth,
    dasValue,
    steps,
    lawRef: 'LC 123/2006, Anexo III (serviços)',
  };
}
// =================================================================
// FIM: simples-nacional.ts
// =================================================================