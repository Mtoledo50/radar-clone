/**
 * =================================================================
 * 📄 columnExport — Utilitários genéricos de exportação de tabelas
 * =================================================================
 * Módulo reutilizável usado por Fiscal (Estoque, Notas), Contábil e
 * Bancário. Persiste as preferências de coluna por usuário via localStorage.
 * 
 * 🆕 Sprint 29: Defensive programming para evitar crashes quando
 * páginas passam objetos de configuração em vez de arrays.
 * =================================================================
 */

export interface ColumnDef<T = any> {
  key: string;
  label: string;
  accessor?: (row: T) => string | number | null | undefined;
  visible?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency';
}

// =================================================================
// 🔑 getSelectedKeys (com validação defensiva)
// =================================================================
/**
 * Extrai as chaves das colunas visíveis.
 * Aceita: array de ColumnDef, objeto com `columns`, ou undefined/null.
 */
export function getSelectedKeys<T>(input: any): string[] {
  // Caso 1: input é undefined/null → retorna array vazio
  if (!input) return [];

  // Caso 2: input é um array direto (caso ideal)
  if (Array.isArray(input)) {
    return input
      .filter((c) => c && typeof c === 'object' && 'key' in c)
      .filter((c: ColumnDef<T>) => c.visible !== false)
      .map((c: ColumnDef<T>) => c.key);
  }

  // Caso 3: input é um objeto com propriedade `columns`
  if (typeof input === 'object' && 'columns' in input && Array.isArray(input.columns)) {
    return input.columns
      .filter((c: any) => c && typeof c === 'object' && 'key' in c)
      .filter((c: ColumnDef<T>) => c.visible !== false)
      .map((c: ColumnDef<T>) => c.key);
  }

  // Caso 4: input é qualquer outra coisa → retorna array vazio
  console.warn('getSelectedKeys: input inválido (esperado array ou objeto com .columns)', input);
  return [];
}

// =================================================================
// 💾 saveSelectedKeys — persiste visibilidade no localStorage
// =================================================================
export function saveSelectedKeys(context: string, keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`column_visibility:${context}`, JSON.stringify(keys));
  } catch (e) {
    console.warn('saveSelectedKeys: falha ao gravar no localStorage', e);
  }
}

export function loadSelectedKeys<T>(
  context: string,
  columns: any,
): string[] {
  if (typeof window === 'undefined') return getSelectedKeys(columns);
  try {
    const raw = localStorage.getItem(`column_visibility:${context}`);
    if (!raw) return getSelectedKeys(columns);
    const saved = JSON.parse(raw) as string[];
    if (!Array.isArray(saved) || saved.length === 0) return getSelectedKeys(columns);
    // Filtra só chaves que ainda existem no esquema atual
    const allKeys = getSelectedKeys(columns);
    const validKeys = new Set(allKeys);
    return saved.filter((k) => validKeys.has(k));
  } catch {
    return getSelectedKeys(columns);
  }
}

// =================================================================
// 🧱 buildCsv
// =================================================================
const escapeField = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatValue = (value: any, type?: string): string => {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'currency' && typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (type === 'date' && value instanceof Date) return value.toLocaleDateString('pt-BR');
  if (type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
  }
  return String(value);
};

/**
 * Constrói string CSV a partir de colunas e linhas.
 * Aceita: array de ColumnDef, objeto com `columns`, ou undefined.
 */
export function buildCsv<T>(
  columnsInput: any,
  rows: T[],
  options: { separator?: string } = {},
): string {
  const sep = options.separator ?? ';';
  const columns = getSelectedKeys(columnsInput).length > 0 
    ? (Array.isArray(columnsInput) ? columnsInput : columnsInput?.columns || [])
    : [];
  
  const visible = columns.filter((c: ColumnDef<T>) => c.visible !== false);
  
  if (visible.length === 0 || rows.length === 0) {
    return '';
  }

  const header = visible.map((c: ColumnDef<T>) => escapeField(c.label)).join(sep);
  const body = rows
    .map((row) =>
      visible
        .map((col: ColumnDef<T>) => {
          const raw = col.accessor ? col.accessor(row) : (row as any)?.[col.key];
          return escapeField(formatValue(raw, col.type));
        })
        .join(sep),
    )
    .join('\r\n');
  return header + (body ? '\r\n' + body : '');
}

// =================================================================
// ⬇️ downloadCsv (UTF-8 + BOM para o Excel)
// =================================================================
export function downloadCsv(csvContent: string, filename: string): void {
  if (!csvContent) {
    console.warn('downloadCsv: conteúdo vazio, download cancelado');
    return;
  }
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTableAsCsv<T>(
  columns: any,
  rows: T[],
  filename: string,
): void {
  const csv = buildCsv(columns, rows);
  if (!csv) {
    console.warn('exportTableAsCsv: CSV vazio, nada para exportar');
    return;
  }
  downloadCsv(csv, filename);
}