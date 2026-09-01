import { BankAdapter, NormalizedRow, NUM, money, isNoise } from './types';

export const sicrediAdapter: BankAdapter = {
  id: 'sicredi',
  label: 'Sicredi',
  detect: (t) => /Cooperativa:|PIX_CRED|PIX_DEB|ibpj\.sicredi/i.test(t),
  parse: (text) => {
    const rows: NormalizedRow[] = [];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\|\s*/, '').trim()) // Remove | do início
      .filter(Boolean);

    for (const line of lines) {
      if (isNoise(line)) continue;
      if (/^SALDO\s+/i.test(line)) continue;
      if (/^---/.test(line)) continue;
      if (/^Data\s+Descrição/i.test(line)) continue;

      // Pattern flexível: Data | Descrição completa | Valor | Saldo
      // Exemplo: 01/06/2026 RECEBIMENTO PIX 36049204004 JOSE CAPPELLARI PIX_CRED 200,00 8.743,78
      // Exemplo: 03/06/2026 PAGAMENTO PIX 00360305000104 CEF MATRIZ PIX_DEB -125,35 9.740,04
      const m = line.match(
        new RegExp(`^(\\d{2}/\\d{2}/\\d{4})\\s+(.+?)\\s+(-?${NUM})\\s+${NUM}\\s*$`),
      );

      if (!m) continue;

      const date = m[1];
      let description = m[2].trim();
      const value = money(m[3]);

      if (!value) continue;

      // Remove sufixos PIX_CRED/PIX_DEB da descrição (são metadados, não fazem parte do histórico)
      description = description.replace(/\s+(PIX_CRED|PIX_DEB|CX\d+)\s*$/i, '').trim();

      // Regra do cliente: negativo = débito (saída), positivo = crédito (entrada)
      if (value < 0) {
        rows.push({ date, description, debit: Math.abs(value), credit: 0 });
      } else {
        rows.push({ date, description, debit: 0, credit: value });
      }
    }

    return rows;
  },
};