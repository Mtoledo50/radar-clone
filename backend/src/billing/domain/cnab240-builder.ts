/**
 * =================================================================
 * CNAB 240 Builder — arquivo de REMESSA (FEBRABAN)
 * =================================================================
 * Gera remessa de cobrança: HEADER ARQUIVO + HEADER LOTE +
 * Segmentos P/Q por boleto + TRAILER LOTE + TRAILER ARQUIVO.
 *
 * Toda linha tem EXATAMENTE 240 posições (validação defensiva).
 * =================================================================
 */

import { CnabBoleto, CnabConfig } from './cnab-types';
import {
  padLeft,
  padRight,
  onlyDigits,
  moneyToCnab,
  dateToCnab8,
} from './cnab-field-utils';

/** Código FEBRABAN por banco (para o campo 1-3). */
const CODIGO_BANCO: Record<CnabConfig['banco'], string> = {
  bb: '001',
  itau: '341',
  bradesco: '237',
  santander: '033',
  caixa: '104',
};

/** Monta uma linha 240: concatena partes e completa com espaços. */
function linha240(partes: string[]): string {
  const linha = partes.join('');
  if (linha.length > 240) {
    throw new Error(`Linha CNAB 240 excede 240 posições (${linha.length})`);
  }
  return linha.padEnd(240, ' ');
}

/**
 * Gera o arquivo de remessa CNAB 240.
 * @param config dados do cedente (banco, agência, conta, CNPJ)
 * @param boletos lista de boletos a registrar
 * @param sequencialArquivo nº sequencial da remessa (1, 2, 3...)
 * @returns conteúdo do arquivo (CRLF, padrão bancário)
 */
export function buildCnab240Remessa(
  config: CnabConfig,
  boletos: CnabBoleto[],
  sequencialArquivo: number,
): string {
  const banco = CODIGO_BANCO[config.banco];
  const hoje = new Date();
  const linhas: string[] = [];

  // ── HEADER ARQUIVO ──────────────────────────────────────────────
  linhas.push(
    linha240([
      padLeft(banco, 3),                 // 1-3 banco
      '0000',                            // 4-7 lote
      '0',                               // 8 tipo registro
      '2' + padLeft(onlyDigits(config.cedenteDocumento), 14).substring(0, 8), // 9-17 inscrição
      padLeft(onlyDigits(config.cedenteAgencia), 5),  // 18-22 agência
      '00',                              // 23-24 DV agência
      padLeft(onlyDigits(config.cedenteConta), 12),   // 25-36 conta
      '0',                               // 37 DV conta
      padRight(config.cedenteNome, 30),  // 73-102 nome empresa
      padRight(nomeBancoLocal(banco), 30), // 103-132 nome banco
      dateToCnab8(hoje),                 // 144-151 data geração
      padLeft(sequencialArquivo, 6),     // 158-163 sequencial
    ]),
  );

  // ── HEADER LOTE (tipo 1, serviço R = cobrança) ─────────────────
  linhas.push(
    linha240([
      padLeft(banco, 3),
      '0001',                            // 4-7 lote
      '1',                               // 8 tipo registro
      'R',                               // 9 serviço (cobrança)
      padLeft(sequencialArquivo, 6),     // 187-192 sequencial remessa
    ]),
  );

  // ── SEGMENTOS P/Q por boleto ───────────────────────────────────
  let seqRegistro = 1;
  for (const boleto of boletos) {
    linhas.push(segmentoP(banco, config, boleto, seqRegistro));
    seqRegistro++;
    linhas.push(segmentoQ(config, boleto, seqRegistro));
    seqRegistro++;
  }

  // ── TRAILER LOTE ────────────────────────────────────────────────
  linhas.push(
    linha240([
      padLeft(banco, 3),
      '0001',
      '5',                               // 8 tipo registro
      padLeft(boletos.length * 2, 6),    // 9-14 qtd registros (P+Q)
      padLeft(boletos.length, 6),        // 15-20 qtd títulos
    ]),
  );

  // ── TRAILER ARQUIVO ─────────────────────────────────────────────
  linhas.push(
    linha240([
      padLeft(banco, 3),
      '9999',                            // 4-7 lote
      '9',                               // 8 tipo registro
      '000001',                          // 9-14 qtd lotes
      padLeft(boletos.length * 2 + 4, 6), // 15-20 qtd registros total
    ]),
  );

  return linhas.join('\r\n') + '\r\n';
}

/** Segmento P — dados principais do título. */
function segmentoP(
  banco: string,
  config: CnabConfig,
  boleto: CnabBoleto,
  seqRegistro: number,
): string {
  return linha240([
    padLeft(banco, 3),                   // 1-3 banco
    '0001',                              // 4-7 lote
    '3',                                 // 8 tipo registro
    padLeft(seqRegistro, 5),             // 9-13 nº sequencial registro
    'P',                                 // 14 segmento
    ' ',                                 // 15 uso
    '01',                                // 16-17 movimento (entrada)
    padLeft(onlyDigits(config.cedenteAgencia), 5), // 18-22 agência
    '00',                                // 23-24 DV
    padLeft(onlyDigits(config.cedenteConta), 12),  // 25-36 conta
    '0',                                 // 37 DV
    padLeft(boleto.nossoNumero, 20),     // 38-57 nosso número
    '1',                                 // 58 carteira
    padRight(boleto.numeroDocumento, 15), // 59-73 nº documento
    dateToCnab8(boleto.vencimento),      // 74-81 vencimento
    moneyToCnab(boleto.valor, 15),       // 82-96 valor título
    '00000',                             // 97-101 agência cobradora
    '0',                                 // 102 DV
    '01',                                // 103-104 espécie título
    '02',                                // 105-106 aceite
    'A',                                 // 107 aceite (A/N)
    dateToCnab8(new Date()),             // 108-115 data emissão
    moneyToCnab(0, 15),                  // 116-130 juros
    '00000000',                          // 131-138 data juros
    moneyToCnab(0, 15),                  // 139-153 desconto
    '00000000',                          // 154-161 data desconto
  ]);
}

/** Segmento Q — dados do sacado (pagador). */
function segmentoQ(
  config: CnabConfig,
  boleto: CnabBoleto,
  seqRegistro: number,
): string {
  const doc = onlyDigits(boleto.sacadoDocumento);
  const tipoInscricao = doc.length === 11 ? '1' : '2'; // 1=CPF 2=CNPJ
  const cep = onlyDigits(boleto.sacadoCEP);

  return linha240([
    padLeft(CODIGO_BANCO[config.banco], 3),
    '0001',
    '3',
    padLeft(seqRegistro, 5),
    'Q',                                 // 14 segmento
    ' ',
    '01',                                // 16-17 movimento
    tipoInscricao,                       // 18 tipo inscrição sacado
    padLeft(doc, 15),                    // 19-33 CPF/CNPJ sacado
    padRight(boleto.sacadoNome, 40),     // 34-73 nome sacado
    padRight(boleto.sacadoEndereco, 40), // 74-113 endereço
    padRight('', 15),                    // 114-128 bairro
    padLeft(cep.substring(0, 5), 5),     // 129-133 CEP parte 1
    padLeft(cep.substring(5, 8), 3),     // 134-136 CEP parte 2
    padRight(boleto.sacadoCidade, 15),   // 137-151 cidade
    padRight(boleto.sacadoUF, 2),        // 152-153 UF
  ]);
}

/** Nome do banco para o header (evita import circular). */
function nomeBancoLocal(codigo: string): string {
  const nomes: Record<string, string> = {
    '001': 'BANCO DO BRASIL',
    '237': 'BRADESCO',
    '341': 'ITAU',
    '033': 'SANTANDER',
    '104': 'CAIXA ECONOMICA FEDERAL',
  };
  return nomes[codigo] || 'BANCO';
}