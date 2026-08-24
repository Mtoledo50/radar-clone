// =================================================================
// INÍCIO: backend/src/accounting/domain/parse-trial-balance.ts
// =================================================================
// 📒 Parser do BALANCETE SCI (domínio puro — ADR-066)
//
// FORMATO REAL (8+ colunas, separador ';'):
//   col[0] = Conta (sequencial: 1, 2, ..., 819, 820)    🆕 captura
//   col[1] = Classificação (código contábil: 01.1.1.02.026)
//   col[2] = Tipo ('T' = sintética)
//   col[3] = Nome da conta contábil
//   col[4..7] = valores BR
// =================================================================
import { parseBrNumber } from './br-number';

export interface TrialBalanceRowParsed {
  accountNumber: string; // 🆕 col[0] — número da conta (ex: "819")
  code: string;          // col[1] — classificação (ex: "01.1.1.02.026")
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

export function parseTrialBalance(content: string): TrialBalanceParsed {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  const rows: TrialBalanceRowParsed[] = [];

  for (const line of lines) {
    if (line.startsWith('Conta;') || line.includes('Classificação')) continue;

    const cols = line.split(';');
    if (cols.length < 8) continue;

    const accountNumber = (cols[0] || '').trim(); // 🆕 número da conta
    const code = (cols[1] || '').trim();
    const name = (cols[3] || '').trim();
    if (!code || !name) continue;

    rows.push({
      accountNumber,
      code,
      name,
      isSynthetic: (cols[2] || '').trim().toUpperCase() === 'T',
      prevBalance: parseBrNumber(cols[4]),
      debit: parseBrNumber(cols[5]),
      credit: parseBrNumber(cols[6]),
      currentBalance: parseBrNumber(cols[7]),
    });
  }

  // Totais pelo 1º nível (01,02,03,04,05)
  const top = rows.filter((r) => !r.code.includes('.'));
  return {
    rows,
    totalDebit: top.reduce((s, r) => s + r.debit, 0),
    totalCredit: top.reduce((s, r) => s + r.credit, 0),
  };
}
// =================================================================
// FIM: backend/src/accounting/domain/parse-trial-balance.ts
// =================================================================