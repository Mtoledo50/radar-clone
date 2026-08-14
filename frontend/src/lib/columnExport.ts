/**
 * =================================================================
 * 📄 columnExport — Utilitários genéricos de exportação de tabelas
 * =================================================================
 * Módulo reutilizável usado por Fiscal (Estoque, Notas), Contábil e
 * Bancário. Persiste as preferências de coluna por usuário via localStorage.
 * 
 * 🆕 Sprint 29: Defensive programming para evitar crashes quando
 * páginas passam objetos de configuração em vez de arrays.
 * 
 * 🔧 HOTFIX BUILD: Propriedade `always` adicionada ao contrato ColumnDef
 * para suportar colunas obrigatórias no ColumnPickerModal (Sprint 12).
 * =================================================================
 */

/**
 * =================================================================
 * 📋 ColumnDef — Contrato de coluna de tabela/exportação
 * =================================================================
 * Define a estrutura de uma coluna que pode ser exportada para CSV.
 * 
 * Propriedades:
 * - key: identificador único da coluna (usado no localStorage e CSV)
 * - label: texto exibido no cabeçalho da tabela e no modal
 * - accessor: função opcional para extrair/transformar o valor da linha
 * - visible: se false, coluna fica oculta por padrão (pode ser ativada)
 * - type: tipo do dado para formatação automática (currency, date, etc.)
 * - always: se true, coluna é OBRIGATÓRIA na exportação (não pode ser desmarcada)
 * =================================================================
 */
export interface ColumnDef<T = any> {
  key: string;
  label: string;
  accessor?: (row: T) => string | number | null | undefined;
  visible?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency';
  always?: boolean; // 🔒 Coluna obrigatória da exportação (Sprint 12)
}

// =================================================================
// 🔑 getSelectedKeys (com validação defensiva)
// =================================================================
/**
 * Extrai as chaves das colunas visíveis.
 * Aceita: array de ColumnDef, objeto com `columns`, ou undefined/null.
 * 
 * 🛡️ Defensive Programming (Sprint 29):
 * - Caso 1: input é undefined/null → retorna array vazio (evita crash)
 * - Caso 2: input é um array direto → filtra colunas válidas e visíveis
 * - Caso 3: input é um objeto com propriedade `columns` → extrai o array
 * - Caso 4: qualquer outra coisa → retorna array vazio com warning
 * 
 * @param input - Array de ColumnDef, objeto com .columns, ou qualquer valor
 * @returns Array de strings com as chaves das colunas visíveis
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
/**
 * Salva as chaves das colunas selecionadas no localStorage.
 * A chave é prefixada com `column_visibility:` para evitar colisões.
 * 
 * 🛡️ SSR-safe: retorna imediatamente se `window` não existe (build do Next.js)
 * 
 * @param context - Identificador único da tela (ex: "fiscal-estoque")
 * @param keys - Array de chaves das colunas selecionadas
 */
export function saveSelectedKeys(context: string, keys: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`column_visibility:${context}`, JSON.stringify(keys));
  } catch (e) {
    console.warn('saveSelectedKeys: falha ao gravar no localStorage', e);
  }
}

// =================================================================
// 📥 loadSelectedKeys — carrega preferências do localStorage
// =================================================================
/**
 * Carrega as preferências de coluna salvas no localStorage.
 * Se não houver preferência salva, retorna o padrão (todas as colunas visíveis).
 * 
 * 🛡️ Validação de integridade:
 * - Filtra apenas chaves que ainda existem no esquema atual
 * - Se o localStorage estiver corrompido, faz fallback para o padrão
 * 
 * @param context - Identificador único da tela (ex: "fiscal-estoque")
 * @param columns - Array de ColumnDef ou objeto com .columns (para fallback)
 * @returns Array de strings com as chaves das colunas selecionadas
 */
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
// 🧱 buildCsv — Constrói string CSV a partir de colunas e linhas
// =================================================================
/**
 * Escapa um campo CSV conforme RFC 4180.
 * - Se contém ;, ", \n ou \r → envolve em aspas e duplica aspas internas
 * - Caso contrário → retorna como está
 * 
 * @param value - Valor a ser escapado
 * @returns String escapada pronta para CSV
 */
const escapeField = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Formata um valor conforme o tipo da coluna.
 * - currency: formata como moeda brasileira (R$ 1.234,56)
 * - date: formata como data brasileira (DD/MM/YYYY)
 * - outros: converte para string
 * 
 * @param value - Valor a ser formatado
 * @param type - Tipo da coluna (text, number, date, currency)
 * @returns String formatada
 */
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
 * 
 * 🛡️ Defensive Programming:
 * - Se não houver colunas visíveis ou linhas → retorna string vazia
 * - Usa `;` como separador padrão (compatível com Excel BR)
 * - Cabeçalho na primeira linha, dados nas linhas seguintes
 * 
 * @param columnsInput - Array de ColumnDef ou objeto com .columns
 * @param rows - Array de objetos com os dados
 * @param options - Opções de formatação (separator)
 * @returns String CSV completa (cabeçalho + dados)
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
// ⬇️ downloadCsv — Download de CSV com UTF-8 + BOM (Excel compatível)
// =================================================================
/**
 * Faz download de um CSV como arquivo.
 * Adiciona BOM (Byte Order Mark) UTF-8 para o Excel reconhecer acentos.
 * 
 * 🛡️ Validação:
 * - Se conteúdo estiver vazio → cancela o download com warning
 * - Garante que o filename termine com .csv
 * - Limpa o ObjectURL após 1 segundo (evita memory leak)
 * 
 * @param csvContent - String CSV completa
 * @param filename - Nome do arquivo (com ou sem .csv)
 */
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

// =================================================================
// 🚀 exportTableAsCsv — Função de alto nível (build + download)
// =================================================================
/**
 * Exporta uma tabela completa para CSV em um único passo.
 * Combina buildCsv + downloadCsv com validação de conteúdo vazio.
 * 
 * @param columns - Array de ColumnDef ou objeto com .columns
 * @param rows - Array de objetos com os dados
 * @param filename - Nome do arquivo (com ou sem .csv)
 */
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