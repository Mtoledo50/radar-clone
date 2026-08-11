/**
 * =================================================================
 * 📥 parseClientsCsv — Parser da planilha de contratos (Sprint 23)
 * =================================================================
 * 🆕 23.1: parseMoney à prova de milhar BR e US:
 *   "2.818,00"  → 2818   (BR: ponto = milhar)
 *   "2,818.00"  → 2818   (US: vírgula = milhar)
 *   "473,00"    → 473    (vírgula = decimal)
 *   "R$ 110.00" → 110
 * =================================================================
 */
export interface ParsedClient {
  companyName: string;
  startDate: string | null;
  endDate: string | null;
  lastPaymentDate: string | null;
  installments: number | null;
  monthlyFee: number;
  openAmount: number | null;
  paidAmount: number | null;
  overdueAmount: number | null;
}

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** 🧮 Parser de dinheiro robusto (detecta BR vs US pelo último separador) */
export const parseMoney = (raw: string): number | null => {
  if (!raw || !raw.trim()) return null;
  const negative = raw.includes('-');
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      // BR: 2.818,00 → ponto é milhar
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 2,818.00 → vírgula é milhar
      s = s.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    const count = (s.match(/,/g) || []).length;
    const after = s.length - lastComma - 1;
    if (count > 1 || after === 3) s = s.replace(/,/g, ''); // milhar
    else s = s.replace(',', '.'); // decimal
  } else if (lastDot >= 0) {
    const count = (s.match(/\./g) || []).length;
    if (count > 1) s = s.replace(/\./g, ''); // milhar
  }

  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return negative ? -Math.abs(n) : n;
};

const parseIntSafe = (raw: string): number | null => {
  const m = (raw || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

const parseDate = (raw: string): string | null => {
  if (!raw || !raw.trim()) return null;
  const clean = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parts = clean.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  let [a, b, c] = parts.map((p) => parseInt(p, 10));
  if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
  if (parts[0].length === 4) [a, b, c] = [c, b, a];
  if (c < 100) c += 2000;
  if (a > 12) [a, b] = [b, a]; // 25/03 → dia/mês
  if (a < 1 || a > 12 || b < 1 || b > 31) return null;
  return `${c}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
};

export function parseClientsCsv(text: string): {
  rows: ParsedClient[];
  skipped: number;
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV vazio.');

  const sep = [';', '\t', ','].reduce(
    (best, s) => (lines[0].split(s).length > lines[0].split(best).length ? s : best),
    ';',
  );
  const split = (l: string) => l.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));

  const h = split(lines[0]).map(norm);
  const idx = (keys: string[]) => h.findIndex((c) => keys.some((k) => c.includes(k)));

  const iName = idx(['cliente', 'razao social', 'nome']);
  const iStart = idx(['inicio do contrato', 'inicio']);
  const iEnd = idx(['termino']);
  const iLast = idx(['ultimo pagamento', 'ultimo']);
  const iParc = idx(['parcelas']);
  const iFee = idx(['liquido', 'honorario']);
  const iOpen = idx(['aberto']);
  const iPaid = idx(['pago']);
  const iOver = idx(['vencido']);

  if (iName < 0) throw new Error('Coluna "Cliente" não encontrada no cabeçalho.');

  const rows: ParsedClient[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const c = split(lines[i]);
    const name = c[iName] || '';
    if (!name || norm(name).includes('total geral')) {
      skipped++;
      continue;
    }
    rows.push({
      companyName: name,
      startDate: parseDate(c[iStart] || ''),
      endDate: parseDate(c[iEnd] || ''),
      lastPaymentDate: parseDate(c[iLast] || ''),
      installments: parseIntSafe(c[iParc] || ''),
      monthlyFee: parseMoney(c[iFee] || '') ?? 0,
      openAmount: parseMoney(c[iOpen] || ''),
      paidAmount: parseMoney(c[iPaid] || ''),
      overdueAmount: parseMoney(c[iOver] || ''),
    });
  }

  return { rows, skipped };
}