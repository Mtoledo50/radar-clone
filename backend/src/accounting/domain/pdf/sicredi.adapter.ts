import { BankAdapter, NormalizedRow, money, isNoise } from './types';

/**
 * 🏦 Adapter Sicredi — v4
 * FIX: valores negativos (débitos) com sinal '-' à esquerda OU '-' à direita.
 * Agrupa extração multi-linha por data e exige VALOR + SALDO no fim da linha.
 */
export const sicrediAdapter: BankAdapter = {
  id: 'sicredi',
  label: 'Sicredi',
  detect: (t) => /Cooperativa:|PIX_CRED|PIX_DEB|ibpj\.sicredi/i.test(t),

  parse: (text) => {
    // 1) Limpa linhas e remove o "|" da tabela do PDF
    const raw = text
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*\|/, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    // 2) Agrupa: lançamento novo começa com data; demais linhas completam
    const groups: string[] = [];
    for (const line of raw) {
      if (/^\d{2}\/\d{2}\/\d{4}\b/.test(line)) groups.push(line);
      else if (groups.length) groups[groups.length - 1] += ' ' + line;
    }

    // 3) Valor aceita '-' na frente OU atrás (332,50-)
    const V = `(-?\\d{1,3}(?:\\.\\d{3})*,\\d{2}-?)`;
    const re = new RegExp(`^(\\d{2}/\\d{2}/\\d{4})\\s+(.+?)\\s+${V}\\s+${V}\\s*$`);

    const normSinal = (s: string) => (s.endsWith('-') ? '-' + s.slice(0, -1) : s);

    const rows: NormalizedRow[] = [];
    for (const g of groups) {
      const m = g.match(re);
      if (!m) continue;

      const [, date, rawDesc, vValor] = m;
      const valor = money(normSinal(vValor));
      if (!valor) continue; // ignora SALDO ANTERIOR / linhas sem valor

      // Remove token de documento do fim da descrição (PIX_CRED, I00469, CX...)
      const description = rawDesc
        .replace(/\s+(PIX_CRED|PIX_DEB|I\d+|CX\d+|\d{6,})$/i, '')
        .trim();
      if (!description || isNoise(description)) continue;

      // Regra do cliente: negativo = débito, positivo = crédito
      if (valor < 0) rows.push({ date, description, debit: Math.abs(valor), credit: 0 });
      else rows.push({ date, description, debit: 0, credit: valor });
    }
    return rows;
  },
};