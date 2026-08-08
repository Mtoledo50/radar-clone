// =================================================================
// 📤 columnExport.ts — Exportação CSV com Campos Selecionáveis
// =================================================================
// Sprint 12: infraestrutura reutilizável para exportações CSV
// com colunas escolhidas pelo usuário.
//
// 🛡️ Regras:
//   - Seleção persistida em localStorage por contexto (ex: "fiscal-estoque")
//   - Colunas com always=true não podem ser removidas
//   - CSV com BOM UTF-8 + separador ";" (Excel BR)
//   - Números convertidos para vírgula decimal (padrão brasileiro)
// =================================================================

/** Definição de uma coluna exportável */
export interface ColumnDef {
  key: string;                      // campo do objeto de dados
  label: string;                    // cabeçalho no CSV
  always?: boolean;                 // obrigatória (não removível)
  format?: (row: any) => string | number; // formatador customizado
}

const storageKey = (context: string) => `radar-export-cols-${context}`;

// -----------------------------------------------------------------
// 💾 Persistência da seleção (por contexto)
// -----------------------------------------------------------------

/** Lê colunas salvas; se não houver (ou inválidas), retorna todas */
export function getSelectedKeys(context: string, columns: ColumnDef[]): string[] {
  try {
    const raw = localStorage.getItem(storageKey(context));
    if (raw) {
      const saved = JSON.parse(raw) as string[];
      const valid = columns
        .filter((c) => saved.includes(c.key) || c.always)
        .map((c) => c.key);
      if (valid.length > 0) return valid;
    }
  } catch {
    // SSR ou localStorage indisponível → default seguro
  }
  return columns.map((c) => c.key);
}

/** Salva a seleção do usuário */
export function saveSelectedKeys(context: string, keys: string[]) {
  try {
    localStorage.setItem(storageKey(context), JSON.stringify(keys));
  } catch {
    // silencioso
  }
}

// -----------------------------------------------------------------
// 🧱 Montagem do CSV
// -----------------------------------------------------------------

/** Formata uma célula: número → vírgula decimal; texto sem ";" */
function csvCell(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v).replace('.', ',');
  return String(v).replace(/;/g, ',');
}

/** Gera o CSV (BOM UTF-8) apenas com as colunas selecionadas */
export function buildCsv(
  rows: any[],
  columns: ColumnDef[],
  selectedKeys: string[],
): string {
  const cols = columns.filter((c) => selectedKeys.includes(c.key));
  const header = cols.map((c) => c.label).join(';');
  const lines = rows.map((r) =>
    cols
      .map((c) => csvCell(c.format ? c.format(r) : r[c.key]))
      .join(';'),
  );
  return '\uFEFF' + [header, ...lines].join('\r\n');
}

/** Dispara o download do arquivo CSV */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}