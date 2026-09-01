import { BankAdapter, NormalizedRow, NUM, money, isNoise } from './types';

export const genericAdapter: BankAdapter = {
  id: 'generico',
  label: 'Genérico (sinal decide)',
  detect: () => true,
  parse: (text) => {
    const rows: NormalizedRow[] = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
      if (!line || isNoise(line)) continue;
      const m = line.match(new RegExp(`^(\\d{2}/\\d{2}/\\d{4})\\s+(.+?)\\s+(-?R?\\$?\\s?${NUM})$`));
      if (!m) continue;
      const v = money(m[3]);
      if (!v) continue;
      rows.push(v < 0
        ? { date: m[1], description: m[2].trim(), debit: Math.abs(v), credit: 0 }
        : { date: m[1], description: m[2].trim(), debit: 0, credit: v });
    }
    return rows;
  },
};