/**
 * =================================================================
 * 📤 exportToCSV — Exportação de dados para CSV
 * =================================================================
 * Função utilitária para exportar dados em formato CSV compatível
 * com Excel, Google Sheets e LibreOffice.
 *
 * Características:
 * - UTF-8 + BOM (suporte a acentos e caracteres especiais)
 * - Separador ponto-e-vírgula (;) — padrão brasileiro
 * - Escape automático de campos com vírgulas ou aspas
 * - Download automático do arquivo
 *
 * @param data - Array de objetos com os dados
 * @param headers - Array com os nomes das colunas
 * @param filename - Nome do arquivo (sem extensão)
 *
 * @example
 * ```typescript
 * const data = [
 *   { nome: 'João Silva', email: 'joao@email.com' },
 *   { nome: 'Maria Santos', email: 'maria@email.com' }
 * ];
 * const headers = ['Nome', 'Email'];
 * exportToCSV(data, headers, 'usuarios');
 * ```
 * =================================================================
 */

export function exportToCSV(
  data: any[],
  headers: string[],
  filename: string
): void {
  // Validação básica
  if (!data || data.length === 0) {
    console.warn('exportToCSV: Nenhum dado para exportar');
    return;
  }

  if (!headers || headers.length === 0) {
    console.warn('exportToCSV: Headers não fornecidos');
    return;
  }

  // Função auxiliar para escapar campos CSV
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // Se contém vírgula, aspas ou quebra de linha, envolve em aspas
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escapa aspas duplicando-as
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Monta o conteúdo CSV
  const csvContent = [
    // Linha de headers
    headers.map(escapeCSV).join(';'),
    
    // Linhas de dados
    ...data.map((row) => {
      return headers
        .map((header) => {
          // Converte header para camelCase para acessar propriedade
          const key = header.toLowerCase().replace(/\s+/g, '');
          return escapeCSV(row[key] ?? row[header] ?? '');
        })
        .join(';');
    }),
  ].join('\r\n');

  // Adiciona BOM UTF-8 (Byte Order Mark) para compatibilidade com Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Cria o blob e faz download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Adiciona timestamp ao nome do arquivo
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${timestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libera a URL do blob
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados para CSV usando as chaves dos objetos como headers
 */
export function exportToCSVWithKeys(
  data: any[],
  filename: string,
  columnMapping?: Record<string, string>
): void {
  if (!data || data.length === 0) {
    console.warn('exportToCSVWithKeys: Nenhum dado para exportar');
    return;
  }

  // Extrai todas as chaves do primeiro objeto
  const keys = Object.keys(data[0]);
  
  // Usa mapeamento customizado se fornecido, senão usa as próprias chaves
  const headers = keys.map((key) => columnMapping?.[key] || key);

  // Cria novo array de dados com as chaves mapeadas
  const mappedData = data.map((row) => {
    const mapped: any = {};
    keys.forEach((key) => {
      mapped[key] = row[key];
    });
    return mapped;
  });

  exportToCSV(mappedData, headers, filename);
}