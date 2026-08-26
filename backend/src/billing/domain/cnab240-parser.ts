/**
 * =================================================================
 * CNAB 240 Parser — arquivo de RETORNO (FEBRABAN)
 * =================================================================
 * Lê o retorno do banco e extrai movimentos (pagamentos/baixas),
 * pareando Segmento T (dados do título) + Segmento U (valores).
 *
 * Posições (1-based) conforme manual FEBRABAN — homologação por
 * banco pode ajustar 1–2 posições (ver ADR-084).
 * =================================================================
 */

import { CnabRetorno, CnabMovimento } from './cnab-types';
import {
  field,
  cnabToMoney,
  cnab8ToDate,
  nomeBanco,
  descricaoMovimento240,
} from './cnab-field-utils';

/**
 * Faz o parse de um arquivo de retorno CNAB 240.
 * @param fileContent conteúdo bruto do arquivo (quebras \n ou \r\n)
 * @throws Error se HEADER ARQUIVO inválido ou arquivo vazio
 */
export function parseCnab240(fileContent: string): CnabRetorno {
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CNAB 240 inválido: precisa de HEADER ARQUIVO + TRAILER');
  }

  const header = lines[0];

  // Posição 8 = tipo de registro ('0' = header arquivo)
  if (header.charAt(7) !== '0') {
    throw new Error('HEADER ARQUIVO inválido: posição 8 deve ser "0"');
  }

  // 1-3 banco • 144-151 data geração • 158-163 sequencial
  const banco = field(header, 0, 3);
  const dataGeracao = cnab8ToDate(field(header, 143, 151)) ?? new Date();
  const sequencial = parseInt(field(header, 157, 163) || '0', 10);

  const movimentos: CnabMovimento[] = [];
  let atual: CnabMovimento | null = null;

  for (const line of lines.slice(1)) {
    // Posição 8 = tipo de registro ('3' = detalhe)
    if (line.charAt(7) !== '3') continue;

    // Posição 14 = segmento (T ou U)
    const segmento = line.charAt(13);

    if (segmento === 'T') {
      // ── Segmento T: dados do título ─────────────────────────────
      atual = {
        nossoNumero: field(line, 37, 57),        // 38-57
        numeroDocumento: field(line, 58, 73),    // 59-73
        dataOcorrencia: cnab8ToDate(field(line, 73, 81)) ?? new Date(), // 74-81
        codigoMovimento: field(line, 15, 17),    // 16-17
        descricaoMovimento: descricaoMovimento240(field(line, 15, 17)),
        valorPago: 0,                            // vem no Segmento U
        dataCredito: null,                       // vem no Segmento U
        tarifa: 0,                               // vem no Segmento U
      };
      movimentos.push(atual);
    } else if (segmento === 'U' && atual) {
      // ── Segmento U: valores do título ───────────────────────────
      atual.valorPago = cnabToMoney(field(line, 47, 62));   // 48-62
      atual.tarifa = cnabToMoney(field(line, 92, 107));     // 93-107
      atual.dataCredito = cnab8ToDate(field(line, 115, 123)); // 116-123
    }
  }

  return { banco: nomeBanco(banco), dataGeracao, sequencial, movimentos };
}