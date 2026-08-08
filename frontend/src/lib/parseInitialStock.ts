// =================================================================
// 📦 parseInitialStock.ts — Parsers de Estoque Inicial (Sprint 10)
// =================================================================
// Responsabilidades:
// - Converter números em formato brasileiro ("1.398,40") para Number
// - Parser best-effort do RELATÓRIO DE POSIÇÃO DE ESTOQUE (texto
//   copiado do PDF): código + descrição + 3 números finais
// - Parser de CSV com detecção de separador e cabeçalhos flexíveis
//
// 🛡️ Filosofia (padrão enterprise):
//   Os parsers são BEST-EFFORT. Toda saída passa pela TABELA DE
//   REVISÃO no modal, onde o usuário confere/corrige antes de
//   gravar. Nunca confiamos cegamente em texto extraído de PDF.
// =================================================================

/** Linha de estoque inicial revisável no frontend */
export interface InitialStockItem {
  key: string;          // chave React única (não vai para o backend)
  code: string;         // código interno do produto
  description: string;  // descrição padronizada
  ncm?: string;         // NCM opcional (PDF não tem → default no backend)
  unit: string;         // unidade (PDF não tem → default UN)
  quantity: number;     // saldo em estoque
  averageCost: number;  // custo médio unitário
}

// Sequenciador de chaves React (evita colisões de key na tabela)
let keySeq = 0;
const nextKey = () => `isi-${++keySeq}`;

// =================================================================
// 🔢 Conversão de número brasileiro → Number
// =================================================================
/**
 * Converte "1.398,40" → 1398.40 | "6,83" → 6.83 | "21" → 21
 * Regra: se tem vírgula, pontos são milhar; vírgula vira ponto decimal.
 * Se não tem vírgula, aceita ponto como decimal (CSV internacional).
 */
export function parseBrazilianNumber(value: string): number {
  if (!value) return 0;
  const v = value.trim();
  if (v.includes(',')) {
    const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// =================================================================
// 📋 Parser do TEXTO COLADO DO PDF (relatório de posição)
// =================================================================
// Formato esperado por linha lógica:
//   <código> <descrição...> <custo médio> <qtd> <custo total>
// A descrição pode quebrar em várias linhas (o regex aceita \n).
// Os 3 números finais estão em formato brasileiro (X.XXX,XX).
// =================================================================

/** Token numérico brasileiro: 1.234,56 | 21,00 | 0,00 */
const NUM = String.raw`\d{1,3}(?:\.\d{3})*,\d{1,2}`;

export function parsePastedStockText(text: string): InitialStockItem[] {
  // Início de linha + código (sem espaços) + descrição lazy + 3 números
  // no fim da linha. A descrição lazy [\s\S]*? permite quebras de linha.
  const re = new RegExp(
    String.raw`(?:^|\n)[ \t]*([A-Za-z0-9][A-Za-z0-9./_-]*)[ \t]+` +
      String.raw`([\s\S]*?)[ \t]+` +
      `(${NUM})[ \\t]+(${NUM})[ \\t]+(${NUM})[ \\t]*(?=\\r?\\n|$)`.replace(/\\\\/g, '\\'),
    'g',
  );

  const items: InitialStockItem[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const code = m[1];
    const description = m[2].replace(/\s+/g, ' ').trim();
    const averageCost = parseBrazilianNumber(m[3]);
    const quantity = parseBrazilianNumber(m[4]);
    // m[5] = custo total (ignorado: recalculamos qtd × custo)

    if (!description) continue;

    items.push({
      key: nextKey(),
      code,
      description,
      unit: 'UN',
      quantity,
      averageCost,
    });
  }

  return items;
}

// =================================================================
// 📊 Parser de CSV (Excel BR com ";" ou internacional com ",")
// =================================================================

/** Remove acentos e normaliza para minúsculas (match de cabeçalhos) */
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Busca índice de coluna por sinônimos (exato primeiro, parcial depois) */
function findIdx(header: string[], candidates: string[]): number {
  for (const c of candidates) {
    const exact = header.findIndex((h) => h === c);
    if (exact >= 0) return exact;
  }
  for (const c of candidates) {
    const partial = header.findIndex((h) => h.includes(c));
    if (partial >= 0) return partial;
  }
  return -1;
}

export function parseStockCsv(text: string): InitialStockItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // Detecta separador contando ocorrências na 1ª linha
  const first = lines[0];
  const sep = [';', '\t', ','].reduce(
    (best, s) => (first.split(s).length > first.split(best).length ? s : best),
    ';',
  );

  const split = (line: string) =>
    line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));

  const header = split(first).map(normalizeHeader);
  const hasHeader = header.some((h) =>
    /cod|prod|descr|qtd|quant|estoque|custo|ncm|unid/.test(h),
  );

  const idx = {
    code: findIdx(header, ['codigo', 'code', 'cod', 'ref']),
    description: findIdx(header, ['descricao', 'produto', 'description', 'item']),
    quantity: findIdx(header, ['qtd', 'quantidade', 'estoque', 'saldo']),
    averageCost: findIdx(header, ['custo medio', 'custo', 'valor unitario', 'preco']),
    ncm: findIdx(header, ['ncm']),
    unit: findIdx(header, ['unidade', 'un', 'um']),
  };

  const rows = hasHeader ? lines.slice(1) : lines;
  const items: InitialStockItem[] = [];

  for (const line of rows) {
    const cols = split(line);
    let code = '';
    let description = '';
    let quantity = 0;
    let averageCost = 0;
    let ncm: string | undefined;
    let unit = 'UN';

    if (hasHeader && idx.code >= 0 && idx.description >= 0) {
      // CSV com cabeçalho reconhecido → mapeia colunas por sinônimos
      code = cols[idx.code] || '';
      description = cols[idx.description] || '';
      quantity = idx.quantity >= 0 ? parseBrazilianNumber(cols[idx.quantity] || '0') : 0;
      averageCost = idx.averageCost >= 0 ? parseBrazilianNumber(cols[idx.averageCost] || '0') : 0;
      ncm = idx.ncm >= 0 ? cols[idx.ncm] : undefined;
      unit = idx.unit >= 0 && cols[idx.unit] ? cols[idx.unit] : 'UN';
    } else {
      // Sem cabeçalho → assume layout do relatório:
      // código;descrição;custo médio;qtd;custo total
      code = cols[0] || '';
      description = cols[1] || '';
      averageCost = parseBrazilianNumber(cols[2] || '0');
      quantity = parseBrazilianNumber(cols[3] || '0');
    }

    if (!code || !description) continue;

    items.push({
      key: nextKey(),
      code,
      description,
      ncm,
      unit: (unit || 'UN').toUpperCase(),
      quantity,
      averageCost,
    });
  }

  return items;
}