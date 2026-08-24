// =================================================================
// INÍCIO: backend/src/accounting/domain/br-number.ts
// =================================================================
/**
 * 🔢 Parser de número brasileiro (domínio puro, testável).
 * Aceita: '20.557,75' • '0,00' • '(87,35)' (negativo) • '' → 0.
 * Usado pelo Balancete e pelo Razão (ADR-066).
 */
export function parseBrNumber(raw: string | null | undefined): number {
  if (!raw) return 0;
  let s = raw.trim();
  if (s === '' || s === '-') return 0;

  // Negativo contábil entre parênteses: (87,35)
  let negative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true;
    s = s.slice(1, -1);
  }

  // Milhar BR = '.' • decimal = ','
  s = s.replace(/\./g, '').replace(',', '.');
  const v = parseFloat(s);
  if (Number.isNaN(v)) return 0;
  return negative ? -v : v;
}
// =================================================================
// FIM: backend/src/accounting/domain/br-number.ts
// =================================================================