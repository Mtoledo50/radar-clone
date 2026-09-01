import { BankAdapter, NormalizedRow, NUM, money, isNoise } from './types';

export const bbAdapter: BankAdapter = {
  id: 'bb',
  label: 'Banco do Brasil',
  detect: (t) => /Agência \d{4}-\d|Dt\. balancete|G33\d|Cliente- Conta/i.test(t),
  parse: (text) => {
    const rows: NormalizedRow[] = [];
    const lines = text.split(/\r?\n/).map((l) => l.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim());
    for (const line of lines) {
      if (!line || isNoise(line)) continue;
      const m = line.match(new RegExp(`^(\\d{2}/\\d{2}/\\d{4})\\s+\\d{4}\\s+\\d{5}\\s+(.+?)\\s+(${NUM})\\s+([DC])$`));
      if (!m) {
        // contraparte na linha seguinte: "20/05 15:17 DENISE IENCZAK FERRI"
        const cont = line.match(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+(.+)$/);
        if (cont && rows.length) rows[rows.length - 1].description += ' - ' + cont[1].trim();
        continue;
      }
      const desc = m[2].replace(/^\d{3}\s*/, '').trim();
      if (/Saldo Anterior/i.test(desc)) continue;
      const v = money(m[3]);
      if (!v) continue;
      rows.push(m[4] === 'D'
        ? { date: m[1], description: desc, debit: v, credit: 0 }
        : { date: m[1], description: desc, debit: 0, credit: v });
    }
    return rows;
  },
};