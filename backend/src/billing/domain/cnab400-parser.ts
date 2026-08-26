/**
 * =================================================================
 * CNAB 400 Parser — Lê arquivos de retorno (Bradesco/Santander)
 * =================================================================
 * Parser de arquivo de retorno CNAB 400 (400 bytes por linha).
 *
 * ADR-084: Parser síncrono, sem dependências externas.
 * =================================================================
 */

import {
  Cnab400RecordType,
  CnabRetorno,
  CnabMovimento,
  CnabMovementCode,
} from './cnab-types';
import { validateNumericField } from './cnab-validator';

/**
 * Faz o parse de um arquivo de retorno CNAB 400
 * @param fileContent Conteúdo do arquivo (string com quebras de linha)
 * @returns Objeto CnabRetorno com os movimentos processados
 */
export function parseCnab400(fileContent: string): CnabRetorno {
  const lines = fileContent.split(/\r?\n/).filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('Arquivo CNAB 400 inválido: deve ter pelo menos HEADER e TRAILER');
  }

  const header = lines[0];
  const trailer = lines[lines.length - 1];
  const detalhes = lines.slice(1, -1);

  // Valida tipos de registro
  if (header.charAt(0) !== Cnab400RecordType.HEADER) {
    throw new Error('HEADER inválido: deve começar com "0"');
  }
  if (trailer.charAt(0) !== Cnab400RecordType.TRAILER) {
    throw new Error('TRAILER inválido: deve começar com "9"');
  }

  // Extrai metadados do HEADER
  const banco = header.substring(76, 79).trim(); // Posição 77-79 (3 dígitos)
  const dataGeracaoStr = header.substring(94, 100); // Posição 95-100 (DDMMAA)
  const sequencialStr = header.substring(394, 400); // Posição 395-400 (6 dígitos)

  const dataGeracao = parseDateDDMMAA(dataGeracaoStr);
  const sequencial = parseInt(sequencialStr, 10);

  // Processa registros de detalhe
  const movimentos: CnabMovimento[] = detalhes
    .filter((line) => line.charAt(0) === Cnab400RecordType.DETALHE)
    .map(parseDetalhe400);

  return {
    banco: getBancoNome(banco),
    dataGeracao,
    sequencial,
    movimentos,
  };
}

/**
 * Faz o parse de uma linha de detalhe CNAB 400
 * @param line Linha de 400 bytes
 */
function parseDetalhe400(line: string): CnabMovimento {
  if (line.length !== 400) {
    throw new Error(`Linha de detalhe inválida: deve ter 400 bytes (recebido ${line.length})`);
  }

  // Nosso Número (posição varia por banco, usando Bradesco como exemplo)
  const nossoNumero = line.substring(70, 82).trim(); // Posição 71-82 (12 dígitos)

  // Número do documento (posição 117-126)
  const numeroDocumento = line.substring(116, 126).trim();

  // Data da ocorrência (posição 110-115, formato DDMMAA)
  const dataOcorrenciaStr = line.substring(110, 116);
  const dataOcorrencia = parseDateDDMMAA(dataOcorrenciaStr);

  // Código de movimento (posição 108-109)
  const codigoMovimento = line.substring(108, 110);

  // Descrição do movimento
  const descricaoMovimento = getDescricaoMovimento400(codigoMovimento);

  // Valor pago (posição 253-265, 13 dígitos, últimos 2 são decimais)
  const valorPagoStr = line.substring(252, 265);
  const valorPago = parseMonetaryValue(valorPagoStr);

  // Data do crédito (posição 295-300, formato DDMMAA, pode ser "000000" se não pago)
  const dataCreditoStr = line.substring(295, 301);
  const dataCredito = dataCreditoStr === '000000' ? null : parseDateDDMMAA(dataCreditoStr);

  // Tarifa bancária (posição 95-107, 13 dígitos)
  const tarifaStr = line.substring(95, 108);
  const tarifa = parseMonetaryValue(tarifaStr);

  return {
    nossoNumero,
    numeroDocumento,
    dataOcorrencia,
    codigoMovimento,
    descricaoMovimento,
    valorPago,
    dataCredito,
    tarifa,
  };
}

/**
 * Converte string DDMMAA para Date
 */
function parseDateDDMMAA(dateStr: string): Date {
  if (dateStr.length !== 6 || !/^\d{6}$/.test(dateStr)) {
    throw new Error(`Data inválida: ${dateStr} (esperado DDMMAA)`);
  }

  const day = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10) - 1; // Month é 0-indexed
  let year = parseInt(dateStr.substring(4, 6), 10);

  // Ajusta ano (assume século 21 se year < 50, senão século 20)
  year += year < 50 ? 2000 : 1900;

  return new Date(year, month, day);
}

/**
 * Converte string monetária CNAB para número (últimos 2 dígitos são decimais)
 */
function parseMonetaryValue(valueStr: string): number {
  if (!/^\d+$/.test(valueStr)) {
    throw new Error(`Valor monetário inválido: ${valueStr}`);
  }

  const cents = parseInt(valueStr, 10);
  return cents / 100;
}

/**
 * Retorna nome do banco pelo código FEBRABAN
 */
function getBancoNome(codigo: string): string {
  const bancos: Record<string, string> = {
    '001': 'Banco do Brasil',
    '237': 'Bradesco',
    '356': 'Santander',
    '104': 'Caixa Econômica Federal',
    '341': 'Itaú',
  };
  return bancos[codigo] || `Banco ${codigo}`;
}

/**
 * Retorna descrição legível do código de movimento CNAB 400
 */
function getDescricaoMovimento400(codigo: string): string {
  const descricoes: Record<string, string> = {
    '01': 'Entrada confirmada',
    '02': 'Baixa',
    '09': 'Liquidação',
    '10': 'Baixa por decurso de prazo',
    '15': 'Liquidação em cartório',
    '23': 'Entrada de título em cartório',
  };
  return descricoes[codigo] || `Movimento ${codigo}`;

}