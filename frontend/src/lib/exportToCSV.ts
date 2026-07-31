/**
 * =================================================================
 * UTILITÁRIO DE EXPORTAÇÃO CSV (UTF-8 com BOM)
 * =================================================================
 * 
 * POR QUE ESTA FUNÇÃO É NECESSÁRIA?
 * O Excel tem um bug histórico onde ele abre arquivos CSV assumindo 
 * que estão em codificação ANSI, quebrando todos os acentos (ex: "Contábil" vira "ContÃ¡bil").
 * 
 * A SOLUÇÃO:
 * Adicionamos o caractere BOM (\uFEFF) no início do arquivo. Isso força 
 * o Excel a reconhecer que o arquivo é UTF-8, mantendo os acentos perfeitos.
 * Além disso, tratamos vírgulas e aspas nos dados para não quebrar as colunas.
 */

export function exportToCSV(data: any[], filename: string) {
  // 1. Validação de segurança: se não houver dados, não faz nada.
  if (!data || data.length === 0) {
    console.warn('⚠️ Nenhum dado disponível para exportar.');
    return;
  }

  // 2. Extrai os cabeçalhos (nomes das colunas) baseados nas chaves do primeiro objeto.
  const headers = Object.keys(data[0]);

  // 3. Mapeia cada linha de dados para o formato CSV.
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        let value = row[header];

        // Tratamento especial para Datas (transforma de ISO para formato Brasileiro)
        if (value instanceof Date) {
          value = value.toLocaleDateString('pt-BR');
        } 
        // Tratamento para valores nulos ou indefinidos
        else if (value !== null && value !== undefined) {
          value = String(value);
        } else {
          value = '';
        }

        // Escapa aspas duplas (regra padrão do CSV) e envolve o valor em aspas
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',');
  });

  // 4. Junta os cabeçalhos e as linhas, separando por quebra de linha (\n)
  const csvString = [headers.join(','), ...csvRows].join('\n');

  // 5. Adiciona o BOM (Byte Order Mark) para o Excel reconhecer os acentos
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });

  // 6. Cria um link invisível no DOM e simula o clique para forçar o download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  
  // 7. Limpeza de memória (remove o link e revoga a URL do Blob)
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}