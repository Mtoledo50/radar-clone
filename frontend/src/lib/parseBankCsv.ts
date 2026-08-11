/**
 * =================================================================
 * 📄 parseBankCsv — Parser de extratos bancários (Sprint 22.3)
 * =================================================================
 * 🆕 22.3: colunas de valor detectadas pelo CONTEÚDO, não só pelo
 * cabeçalho → aceita o CSV de julho (4ª coluna sem nome, onde ficam
 * os débitos) e qualquer ordem de colunas (Data antes ou depois).
 * =================================================================
 */
export interface ParsedRow {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // +crédito / -débito
}

/** 🧮 Dinheiro à prova de milhar BR/US */
const parseMoney = (raw: string): number | null => {
  if (!raw || !raw.trim()) return null;
  const negative = raw.includes('-');
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.'); // BR
    else s = s.replace(/,/g, ''); // US
  } else if (lastComma >= 0) {
    const count = (s.match(/,/g) || []).length;
    const after = s.length - lastComma - 1;
    if (count > 1 || after === 3) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
  } else if (lastDot >= 0) {
    const count = (s.match(/\./g) || []).length;
    if (count > 1) s = s.replace(/\./g, '');
  }

  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return negative ? -Math.abs(n) : n;
};

/** 📅 Data com desambiguação BR vs US pela máscara */
const parseDate = (raw: string): string | null => {
  if (!raw) return null;
  const clean = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const parts = clean.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  let [a, b, c] = parts.map((p) => parseInt(p, 10));
  if (isNaN(a) || isNaN(b) || isNaN(c)) return null;

  if (parts[0].length === 4) [a, b, c] = [c, b, a]; // YYYY/MM/DD
  if (c < 100) c += 2000;

  if (a > 12) {
    [a, b] = [b, a]; // dia primeiro (29/06/2026)
  } else if (a <= 12 && b <= 12) {
    // Ambíguo: decide pela máscara
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) [a, b] = [b, a]; // DD/MM/YYYY banco BR
    // "M/D/YY" sem padding = export pivot → mês primeiro (mantém)
  }

  if (a < 1 || a > 12 || b < 1 || b > 31 || c < 2000) return null;
  return `${c}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
};

const isBalanceLine = (desc: string) => /saldo\s+do\s+dia/i.test(desc);

function detectSeparator(line: string): string {
  const candidates = [';', '\t', ','];
  let best = ';';
  let max = 0;
  for (const s of candidates) {
    const n = line.split(s).length;
    if (n > max) {
      max = n;
      best = s;
    }
  }
  return best;
}

/**
 * 🆕 Detecta colunas: data/descrição pelo header, e colunas de valor
 * pelo header + pelo CONTEÚDO (colunas sem nome que contêm dinheiro).
 */
function detectColumns(header: string[], sample: string[][]) {
  const h = header.map((c) => c.toLowerCase().trim());
  const cols = h.length;

  let dateIdx = h.findIndex((c) => c.includes('data'));
  let descIdx = h.findIndex((c) => c.includes('descri') || c.includes('hist'));

  // 1) Colunas declaradas no cabeçalho
  const byHeader = h
    .map((c, i) => (c.includes('valor') || c.includes('montante') ? i : -1))
    .filter((i) => i >= 0);

  // 2) Colunas sem nome que contêm dinheiro (caso da 4ª coluna de julho)
  const byContent: number[] = [];
  for (let i = 0; i < cols; i++) {
    if (i === dateIdx || i === descIdx || byHeader.includes(i)) continue;
    let hits = 0;
    let total = 0;
    for (const row of sample) {
      const v = (row[i] || '').trim();
      if (!v) continue;
      total++;
      if (parseMoney(v) !== null) hits++;
    }
    if (total > 0 && hits / total >= 0.5) byContent.push(i);
  }

  const amountIdxs = [...byHeader, ...byContent].sort((a, b) => a - b);

  if (dateIdx < 0) dateIdx = 0;
  if (descIdx < 0) descIdx = dateIdx === 0 ? 1 : 0;

  return {
    dateIdx,
    descIdx,
    amountIdxs: amountIdxs.length > 0 ? amountIdxs : [cols - 1],
  };
}

export function parseBankCsv(csvText: string): {
  rows: ParsedRow[];
  skipped: number;
} {
  const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length < 2) throw new Error('CSV vazio ou sem linhas suficientes.');

  const sep = detectSeparator(rawLines[0]);
  const split = (line: string) =>
    line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));

  const header = split(rawLines[0]);
  const sample = rawLines.slice(1, 11).map(split);
  const { dateIdx, descIdx, amountIdxs } = detectColumns(header, sample);

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (let i = 1; i < rawLines.length; i++) {
    const cols = split(rawLines[i]);
    const desc = cols[descIdx] || '';
    if (!desc || isBalanceLine(desc)) {
      skipped++;
      continue;
    }

    const date = parseDate(cols[dateIdx] || '');
    if (!date) {
      skipped++;
      continue;
    }

    let amount: number | null = null;
    if (amountIdxs.length >= 2) {
      const credit = parseMoney(cols[amountIdxs[0]] || '');
      const debit = parseMoney(cols[amountIdxs[1]] || '');
      amount = credit !== null ? credit : debit;
    } else {
      amount = parseMoney(cols[amountIdxs[0]] || '');
    }

    if (amount === null || amount === 0) {
      skipped++;
      continue;
    }

    rows.push({ date, description: desc, amount });
  }

  return { rows, skipped };
}