/**
 * =================================================================
 * Testes CNAB 240 — Parser de Retorno (separado do builder)
 * =================================================================
 */

import { parseCnab240 } from '../cnab240-parser';

// ─── Helper de teste: escreve valores em posições 1-based ────────
function montar240(writes: Array<[number, string]>): string {
  const chars: string[] = Array(240).fill(' ');
  for (const [pos, val] of writes) {
    for (let i = 0; i < val.length; i++) chars[pos - 1 + i] = val[i];
  }
  return chars.join('');
}

describe('CNAB 240 — Parser de Retorno', () => {
  const header = montar240([
    [1, '001'], [4, '0000'], [8, '0'],
    [144, '25082026'], [158, '000001'],
  ]);
  const segmentoT = montar240([
    [1, '001'], [4, '0001'], [8, '3'], [9, '00001'], [14, 'T'],
    [16, '06'],                          // liquidação
    [38, '00000000000000012345'],        // nosso número
    [59, 'FAT-001'],                     // nº documento
    [74, '25082026'],                    // vencimento
    [82, '0000000015000'],               // valor título
    [127, 'CLIENTE TESTE'],
  ]);
  const segmentoU = montar240([
    [1, '001'], [4, '0001'], [8, '3'], [9, '00001'], [14, 'U'],
    [16, '06'],
    [48, '0000000015000'],               // valor pago R$ 150,00
    [93, '0000000000250'],               // tarifa R$ 2,50
    [116, '26082026'],                   // data crédito
  ]);
  const trailer = montar240([[1, '001'], [4, '9999'], [8, '9']]);

  const arquivo = [header, segmentoT, segmentoU, trailer].join('\r\n');

  it('extrai 1 movimento pareando T+U', () => {
    const retorno = parseCnab240(arquivo);
    expect(retorno.movimentos).toHaveLength(1);
  });

  it('lê nosso número, valor pago, tarifa e crédito', () => {
    const m = parseCnab240(arquivo).movimentos[0];
    expect(m.nossoNumero).toBe('00000000000000012345');
    expect(m.valorPago).toBe(150);
    expect(m.tarifa).toBe(2.5);
    expect(m.dataCredito?.getDate()).toBe(26);
    expect(m.codigoMovimento).toBe('06');
    expect(m.descricaoMovimento).toBe('Liquidação');
  });

  it('lê metadados do header (banco, data, sequencial)', () => {
    const r = parseCnab240(arquivo);
    expect(r.banco).toBe('Banco do Brasil');
    expect(r.sequencial).toBe(1);
    expect(r.dataGeracao.getFullYear()).toBe(2026);
  });

  it('rejeita arquivo sem header válido', () => {
    expect(() => parseCnab240('xxx\nyyy')).toThrow();
  });
});