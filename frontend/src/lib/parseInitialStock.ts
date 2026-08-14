/**
 * =================================================================
 * 📦 parseInitialStock — Parser de estoque inicial (Sprint 20)
 * =================================================================
 * 🔧 HOTFIX BUILD (Unificação de Interface):
 * A interface foi alinhada com o `InitialStockImportModal.tsx`.
 * - `name` renomeado para `description`
 * - `unitCost` renomeado para `averageCost`
 * - Adicionados `unit` e `ncm` (opcionais) para edição na UI
 * =================================================================
 */

export interface InitialStockItem {
  key: string;          // 🔒 ID único para a tabela
  code: string;         // Código do produto
  description: string;  // 🔄 Era 'name' (alinhado com Modal)
  unit?: string;        // 🆕 Unidade (UN, CX, KG) - editável no Modal
  quantity: number;     // Saldo inicial
  averageCost: number;  // 🔄 Era 'unitCost' (alinhado com Modal)
  ncm?: string;         // 🆕 NCM - editável no Modal
  totalCost: number;    // Calculado (quantity * averageCost)
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
  const iPrice = find(['unitario', 'preco', 'valor unit', 'custo', 'medio']);
  const iUnit = find(['un', 'unidade', 'medida']);
  const iNcm = find(['ncm']);

  return {
    code: iCode >= 0 ? iCode : -1,
    name: iName >= 0 ? iName : (iCode === 0 ? 1 : 0),
    qty: iQty >= 0 ? iQty : -1,
    price: iPrice,
    unit: iUnit,
    ncm: iNcm,
  };
}

// 🔄 HELPER: Gera um ID único para cada linha
const generateRowKey = (index: number): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 11)}`;
};

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
  const { code, name, qty, price, unit, ncm } = detectColumns(split(lines[0]));
  if (name < 0 || qty < 0) {
    throw new Error('Cabeçalho inválido: é preciso ter pelo menos "Produto" e "Quantidade".');
  }

  const items: InitialStockItem[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const c = split(lines[i]);
    const itemDesc = c[name] || '';
    const q = parseNumber(c[qty] || '');
    if (!itemDesc || q === null) { skipped++; continue; }
    
    const codeVal = code >= 0 ? c[code] || '' : '';
    const avgCost = price >= 0 ? parseNumber(c[price] || '') : 0;
    const unitVal = unit && unit >= 0 ? c[unit] || 'UN' : 'UN';
    const ncmVal = ncm && ncm >= 0 ? c[ncm] || '' : '';
    const total = avgCost ? Math.round((q * avgCost + Number.EPSILON) * 100) / 100 : 0;
    
    items.push({
      key: generateRowKey(i),
      code: codeVal,
      description: itemDesc, // 🔄 Alinhado com Modal
      unit: unitVal,         // 🆕 Default 'UN'
      quantity: q,
      averageCost: avgCost ?? 0, // 🔄 Alinhado com Modal
      ncm: ncmVal,           // 🆕
      totalCost: total,
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

  const candidates = [';', '\t', ','];
  const sep = candidates.reduce(
    (best, s) => (lines[0].split(s).length > lines[0].split(best).length ? s : best),
    ';',
  );
  const split = (l: string) => l.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const { code, name, qty, price, unit, ncm } = detectColumns(split(lines[0]));
  if (name < 0 || qty < 0) {
    throw new Error('Cabeçalho inválido no CSV: é preciso ter "Produto" e "Quantidade".');
  }

  const items: InitialStockItem[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const c = split(lines[i]);
    const itemDesc = c[name] || '';
    const q = parseNumber(c[qty] || '');
    if (!itemDesc || q === null) { skipped++; continue; }

    const codeVal = code >= 0 ? c[code] || '' : '';
    const avgCost = price >= 0 ? parseNumber(c[price] || '') : 0;
    const unitVal = unit && unit >= 0 ? c[unit] || 'UN' : 'UN';
    const ncmVal = ncm && ncm >= 0 ? c[ncm] || '' : '';
    const total = avgCost ? Math.round((q * avgCost + Number.EPSILON) * 100) / 100 : 0;

    items.push({
      key: generateRowKey(i),
      code: codeVal,
      description: itemDesc,
      unit: unitVal,
      quantity: q,
      averageCost: avgCost ?? 0,
      ncm: ncmVal,
      totalCost: total,
    });
  }

  return { items, skipped };
}