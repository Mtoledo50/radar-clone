import { BankAdapter, NormalizedRow, NUM, money } from './types';

const MESES: Record<string, string> = {
  JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
  JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12',
};

/**
 *  Banrisul v1 — o PDF sai como bloco único; casamos o par
 * "RESGATE AUTOMATICO (crédito) + PIX ENVIADO (débito)" + contraparte.
 * Novos históricos entram como regex novos aqui, sem tocar nos outros bancos.
 */
export const banrisulAdapter: BankAdapter = {
  id: 'banrisul',
  label: 'Banrisul',
  detect: (t) => /B A N R I S U L|BANRISUL/i.test(t),
  parse: (text) => {
    const rows: NormalizedRow[] = [];
    const hm = text.match(/MOVIMENTOS\s+([A-Z]{3})\/(\d{4})/);
    if (!hm) return rows;
    const month = MESES[hm[1]];
    const year = hm[2];
    if (!month) return rows;

    const re = new RegExp(
      `(\\d{2})\\s+RESGATE AUTOMATICO\\s+\\d{6}\\s+(${NUM})\\s+PIX ENVIADO\\s+\\d{6}\\s+(${NUM})-?\\s*CPF/CNPJ:\\s*\\d+\\s+NOME:\\s*(.+?)\\s+SALDO NA DATA`,
      'g',
    );
    for (const m of text.matchAll(re)) {
      const date = `${m[1]}/${month}/${year}`;
      const name = m[4].trim();
      const vCred = money(m[2]);
      const vDeb = money(m[3]);
      if (vCred) rows.push({ date, description: `RESGATE AUTOMATICO - ${name}`, debit: 0, credit: vCred });
      if (vDeb) rows.push({ date, description: `PIX ENVIADO - ${name}`, debit: vDeb, credit: 0 });
    }
    return rows;
  },
};