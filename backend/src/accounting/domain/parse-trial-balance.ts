// =================================================================
// INÍCIO: backend/src/accounting/domain/parse-trial-balance.ts
// =================================================================
/**
 * 📒 Parser do BALANCETE do SCI (CSV exportado pelo cliente).
 *
 * Layout esperado (sep = ';'):
 *   Conta;Classificação;Tipo;Nome da conta contábil;Saldo anterior;Débito;Crédito;Saldo atual
 *   1;01;T;ATIVO;923,20;20.557,75;2.861,94;18.619,01
 *   819;01.1.1.02.026;;Sicredi 07417-6;0,00;18.400,00;1.390,00;17.010,00
 *
 * Colunas por posição (SCI fixo):
 *   [0] Conta (seq SCI, ex.: 819)      ← ADR-070
 *   [1] Classificação (code)
 *   [2] Tipo (T = sintética)
 *   [3] Nome
 *   [4..7] valores
 */

export interface TrialBalanceRowParsed {
  seq: string;             // 🆕 ADR-070: "Conta" SCI (ex.: "819")
  code: string;
  name: string;
  isSynthetic: boolean;
  prevBalance: number;
  debit: number;
  credit: number;
  currentBalance: number;
}

export interface TrialBalanceParsed {
  rows: TrialBalanceRowParsed[];
  totalDebit: number;
  totalCredit: number;
}

function parseNum(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/\./g, '').replace(',', '.').replace(/[()\-]/g, (m) => m === '-' ? '-' : '');
  const v = parseFloat(clean);
  // Trata valores entre parênteses como negativos (padrão contábil)
  if (s.includes('(') && s.includes(')')) return -Math.abs(v);
  return Number.isNaN(v) ? 0 : v;
}

export function parseTrialBalance(content: string): TrialBalanceParsed {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], totalDebit: 0, totalCredit: 0 };

  // Pula o cabeçalho
  const rows: TrialBalanceRowParsed[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => (c || '').trim());
    if (cols.length < 8) continue;

    const seq = cols[0];        // 🆕 Coluna "Conta" (sequencial SCI)
    const code = cols[1];       // Coluna "Classificação"
    const name = cols[3];       // Coluna "Nome da conta"
    if (!code || !name) continue;

    const row: TrialBalanceRowParsed = {
      seq,                      // ✅ Adicionado
      code,
      name,
      isSynthetic: (cols[2] || '').toUpperCase() === 'T',
      prevBalance: parseNum(cols[4]),
      debit: parseNum(cols[5]),
      credit: parseNum(cols[6]),
      currentBalance: parseNum(cols[7]),
    };
    rows.push(row);
    totalDebit += row.debit;
    totalCredit += row.credit;
  }

  return { rows, totalDebit, totalCredit };
}
// =================================================================
// FIM: backend/src/accounting/domain/parse-trial-balance.ts
// =================================================================