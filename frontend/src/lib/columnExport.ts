/**
 * =================================================================
 * 📄 columnExport — Utilitários genéricos de exportação de tabelas
 * =================================================================
 * Módulo reutilizável usado por Fiscal (Estoque, Notas), Contábil e
 * Bancário. Persiste as preferências de coluna por usuário via localStorage.
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
// 🔑 getSelectedKeys
// =================================================================
export function getSelectedKeys<T>(columns: ColumnDef<T>[]): string[] {
  return columns.filter((c) => c.visible !== false).map((c) => c.key);
}

// =================================================================
// 💾 saveSelectedKeys — persiste visibilidade no localStorage
// =================================================================
/**
 * Salva a lista de chaves visíveis para um contexto (ex: "estoque", "notas").
 * Usado pelo ColumnPickerModal para lembrar a preferência do usuário.
 */
export function saveSelectedKeys(context: string, keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`column_visibility:${context}`, JSON.stringify(keys));
  } catch (e) {
    console.warn('saveSelectedKeys: falha ao gravar no localStorage', e);
  }
}

/**
 * Lê as chaves salvas (ou retorna todas como fallback).
 */
export function loadSelectedKeys<T>(
  context: string,
  columns: ColumnDef<T>[],
): string[] {
  if (typeof window === 'undefined') return getSelectedKeys(columns);
  try {
    const raw = localStorage.getItem(`column_visibility:${context}`);
    if (!raw) return getSelectedKeys(columns);
    const saved = JSON.parse(raw) as string[];
    if (!Array.isArray(saved) || saved.length === 0) return getSelectedKeys(columns);
    // Filtra só chaves que ainda existem no esquema atual
    const validKeys = new Set(columns.map((c) => c.key));
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

export function buildCsv<T>(
  columns: ColumnDef<T>[],
  rows: T[],
  options: { separator?: string } = {},
): string {
  const sep = options.separator ?? ';';
  const visible = columns.filter((c) => c.visible !== false);
  const header = visible.map((c) => escapeField(c.label)).join(sep);
  const body = rows
    .map((row) =>
      visible
        .map((col) => {
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
  if (!csvContent) return;
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
  columns: ColumnDef<T>[],
  rows: T[],
  filename: string,
): void {
  downloadCsv(buildCsv(columns, rows), filename);
}