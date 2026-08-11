/**
 * =================================================================
 * 📦 parseInitialStock — Parser de estoque inicial (Sprint 20)
 * =================================================================
 * Aceita duas fontes:
 *   1. Texto colado (Ctrl+C do Excel → Ctrl+V): parser tab-separated
 *   2. Arquivo CSV: detecta separador e cabeçalho automaticamente
 *
 * Campos esperados (qualquer ordem, com/sem acento):
 *   - Código (código do produto)
 *   - Produto / Descrição
 *   - Quantidade (saldo inicial)
 *   - Valor unitário (opcional)
 * =================================================================
 */

export interface InitialStockItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice?: number | null;
  total?: number | null;
}

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const parseNumber = (raw: string): number | null => {
  if (!raw || !raw.trim()) return null;
  const neg = raw.includes('-');
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    const after = s.length - lastComma - 1;
    const count = (s.match(/,/g) || []).length;
    if (count > 1 || after === 3) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
  } else if (lastDot >= 0) {
    const count = (s.match(/\./g) || []).length;
    if (count > 1) s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return neg ? -Math.abs(n) : n;
};

function detectColumns(header: string[]) {
  const h = header.map(norm);
  const find = (keys: string[]) =>
    h.findIndex((c) => keys.some((k) => c.includes(k)));

  const iCode = find(['codigo', 'cod', 'sku']);
  const iName = find(['produto', 'descricao', 'nome', 'item', 'mercadoria']);
  const iQty = find(['quantidade', 'qtd', 'saldo', 'unidade']);
  const iPrice = find(['unitario', 'preco', 'valor unit', 'custo']);

  return {
    code: iCode >= 0 ? iCode : -1,
    name: iName >= 0 ? iName : (iCode === 0 ? 1 : 0),
    qty: iQty >= 0 ? iQty : -1,
    price: iPrice,
  };
}

// =================================================================
// 📋 Parser de texto colado (tab-separated — Ctrl+C do Excel)
// =================================================================
export function parsePastedStockText(text: string): {
  items: InitialStockItem[];
  skipped: number;
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { items: [], skipped: 0 };

  const split = (l: string) => l.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const { code, name, qty, price } = detectColumns(split(lines[0]));
  if (name < 0 || qty < 0) {
    throw new Error('Cabeçalho inválido: é preciso ter pelo menos "Produto" e "Quantidade".');
  }

  const items: InitialStockItem[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const c = split(lines[i]);
    const itemName = c[name] || '';
    const q = parseNumber(c[qty] || '');
    if (!itemName || q === null) { skipped++; continue; }
    const codeVal = code >= 0 ? c[code] || '' : '';
    const unitPrice = price >= 0 ? parseNumber(c[price] || '') : null;
    items.push({
      code: codeVal,
      name: itemName,
      quantity: q,
      unitPrice,
      total: unitPrice != null ? Math.round((q * unitPrice + Number.EPSILON) * 100) / 100 : null,
    });
  }

  return { items, skipped };
}

// =================================================================
// 📄 Parser de CSV (detecta separador automaticamente)
// =================================================================
export function parseStockCsv(text: string): {
  items: InitialStockItem[];
  skipped: number;
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { items: [], skipped: 0 };

  // Detecta separador
  const candidates = [';', '\t', ','];
  const sep = candidates.reduce(
    (best, s) => (lines[0].split(s).length > lines[0].split(best).length ? s : best),
    ';',
  );
  const split = (l: string) => l.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const { code, name, qty, price } = detectColumns(split(lines[0]));
  if (name < 0 || qty < 0) {
    throw new Error('Cabeçalho inválido no CSV: é preciso ter "Produto" e "Quantidade".');
  }

  const items: InitialStockItem[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const c = split(lines[i]);
    const itemName = c[name] || '';
    const q = parseNumber(c[qty] || '');
    if (!itemName || q === null) { skipped++; continue; }
    const codeVal = code >= 0 ? c[code] || '' : '';
    const unitPrice = price >= 0 ? parseNumber(c[price] || '') : null;
    items.push({
      code: codeVal,
      name: itemName,
      quantity: q,
      unitPrice,
      total: unitPrice != null ? Math.round((q * unitPrice + Number.EPSILON) * 100) / 100 : null,
    });
  }

  return { items, skipped };
}