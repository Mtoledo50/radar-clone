/**
 * =================================================================
 * 📄 parseCatalogCsv — Parser de CSV para importação de catálogo permanente
 * =================================================================
 * Sprint F8: lê CSV com 2 colunas (descrição; código unificado).
 * Aceita separadores: ; , TAB
 * Normaliza: trim + remove aspas
 * =================================================================
 */

export interface CatalogRow {
  description: string;
  code: string;
}

export function parseCatalogCsv(text: string): CatalogRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV vazio ou sem linhas de dados.');
  }

  const first = lines[0];
  const sep = [';', '\t', ','].reduce(
    (best, s) => (first.split(s).length > first.split(best).length ? s : best),
    ';',
  );

  const split = (line: string) =>
    line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));

  const header = split(first).map((h) => h.toLowerCase());
  let descIdx = header.findIndex((h) => h.includes('descricao') || h.includes('descrição'));
  let codeIdx = header.findIndex((h) => h.includes('codigo') || h.includes('código'));

  if (descIdx < 0) descIdx = 0;
  if (codeIdx < 0) codeIdx = 1;

  const rows: CatalogRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const description = cols[descIdx] || '';
    const code = (cols[codeIdx] || '').trim();
    if (description && code) rows.push({ description, code });
  }

  return rows;
}