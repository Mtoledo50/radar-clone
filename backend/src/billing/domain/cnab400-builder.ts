/**
 * =================================================================
 * CNAB 400 Builder — gera REMESSA de cobrança (Bradesco/Santander)
 * =================================================================
 * Estrutura: Header → Detalhe*N → Trailer. Linhas de 400 posições.
 * =================================================================
 */

import { CnabBoleto, CnabConfig } from './cnab-types';
import { formatDate, formatMonetaryValue } from './cnab-validator';

const L = 400;
const right = (v: string, len: number): string => v.padEnd(len, ' ').slice(0, len);
const left = (v: string | number, len: number): string =>
  String(v).replace(/\D/g, '').padStart(len, '0').slice(-len);
const spaces = (len: number): string => ' '.repeat(len);

/** Gera o arquivo de remessa CNAB 400 */
export function buildCnab400Remessa(
  config: CnabConfig,
  boletos: CnabBoleto[],
  sequencial: number,
): string {
  const lines: string[] = [];
  lines.push(header(config, sequencial));
  boletos.forEach((b, i) => lines.push(detalhe(config, b, i + 2)));
  lines.push(trailer(boletos.length, sequencial));
  return lines.map((l) => l.padEnd(L, ' ').slice(0, L)).join('\r\n');
}

function header(config: CnabConfig, sequencial: number): string {
  return (
    '0' +                                 // 001 tipo registro
    '1' +                                 // 002 código remessa
    right('REMESSA', 7) +                 // 003-009 literal
    right(config.cedenteNome, 30) +       // nome cedente
    formatDate(new Date(), 'DDMMAA') +    // data geração (6)
    spaces(L) +
    left(sequencial, 7)                   // sequencial no fim
  );
}

function detalhe(config: CnabConfig, b: CnabBoleto, seq: number): string {
  return (
    '1' +                                 // 001 tipo registro detalhe
    left(config.cedenteDocumento, 14) +   // CNPJ cedente
    left(b.nossoNumero, 20) +             // nosso número
    right(b.numeroDocumento, 16) +        // seu número
    formatDate(b.vencimento, 'DDMMAA') +  // vencimento (6)
    formatMonetaryValue(b.valor, 13) +    // valor (13)
    right(b.sacadoNome, 40) +             // sacado
    left(b.sacadoDocumento, 15) +
    right(b.sacadoEndereco, 40) +
    left(b.sacadoCEP, 8) +
    right(b.sacadoCidade, 15) +
    right(b.sacadoUF, 2) +
    spaces(L) +
    left(seq, 6)                          // sequencial da linha
  );
}

function trailer(qtd: number, sequencial: number): string {
  return '9' + spaces(L) + left(qtd, 8) + left(sequencial, 7);
}