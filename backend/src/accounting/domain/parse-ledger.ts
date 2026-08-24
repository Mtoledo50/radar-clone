// =================================================================
// INÍCIO: backend/src/accounting/domain/parse-ledger.ts
// =================================================================
/**
 * 📖 Parser do RAZÃO / LIVRO CAIXA (domínio puro — ADR-066).
 * Formato real do arquivo do Marcos (blocos por conta):
 *   819 - 01.1.1.02.026 - Sicredi 07417-6 ;Saldo anterior:;;0,00   ← cabeçalho da conta
 *   15/05/2026;;;                                                  ← data vigente
 *   SOLANGE BENNERT;200,00;;200,00                                 ← lançamento
 *   Total mês a débito:;13.900,00;Total mês a crédito:;20,00       ← ignorado
 * Máquina de estados: cabeçalho define a conta • data define o dia •
 * linhas seguintes herdam ambos até novo cabeçalho/data.
 * 👑 Subproduto valioso: o par contraparte→conta vira o SUGERIDOR
 *    de conta dos lançamentos mensais (Parte 2).
 */
import { parseBrNumber } from './br-number';

export interface LedgerEntryParsed {
  accountCode: string;
  accountName: string;
  date: string; // 'YYYY-MM-DD'
  counterparty: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerAccountParsed {
  code: string;
  name: string;
  opening: number; // saldo anterior da conta
}

export interface LedgerParsed {
  entries: LedgerEntryParsed[];
  accounts: LedgerAccountParsed[];
  months: string[]; // ['2026-05','2026-06']
}

export function parseLedger(content: string): LedgerParsed {
  const lines = content.split(/\r?\n/);
  const entries: LedgerEntryParsed[] = [];
  const accounts: LedgerAccountParsed[] = [];
  const months = new Set<string>();

  let cur: { code: string; name: string } | null = null;
  let curDate = '';

  for (const line of lines) {
    const t = line.trim();
    if (!t || t === ';;;') continue;

    // 1) Cabeçalho de conta: "819 - 01.1.1.02.026 - Nome ;Saldo anterior:;;0,00"
    const hdr = t.match(/^(\d+)\s*-\s*([0-9.]+)\s*-\s*(.+?);Saldo anterior:;?;?(.*)$/);
    if (hdr) {
      cur = { code: hdr[2].trim(), name: hdr[3].trim() };
      accounts.push({ code: cur.code, name: cur.name, opening: parseBrNumber(hdr[4]) });
      continue;
    }

    // 2) Linha de data: "15/05/2026;;;"
    const dm = t.match(/^(\d{2})\/(\d{2})\/(\d{4});/);
    if (dm) {
      curDate = `${dm[3]}-${dm[2]}-${dm[1]}`;
      months.add(`${dm[3]}-${dm[2]}`);
      continue;
    }

    // 3) Totais de mês: ignora
    if (t.startsWith('Total mês')) continue;

    // 4) Lançamento: "CONTRAPARTE;débito;crédito;saldo"
    if (cur && curDate) {
      const cols = t.split(';');
      const counterparty = (cols[0] || '').trim();
      if (!counterparty) continue;
      entries.push({
        accountCode: cur.code,
        accountName: cur.name,
        date: curDate,
        counterparty,
        debit: parseBrNumber(cols[1]),
        credit: parseBrNumber(cols[2]),
        balance: parseBrNumber(cols[3]),
      });
    }
  }

  return { entries, accounts, months: [...months].sort() };
}
// =================================================================
// FIM: backend/src/accounting/domain/parse-ledger.ts
// =================================================================