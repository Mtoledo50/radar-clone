/**
 * =================================================================
 * Testes CNAB 240 — parser de retorno + builder de remessa
 * =================================================================
 * Valida layout posição a posição (padrão FEBRABAN).
 * Rodar: npm run test -- --testPathPattern=cnab240
 * =================================================================
 */

import { parseCnab240 } from '../cnab240-parser';
import { buildCnab240Remessa } from '../cnab240-builder';
import { CnabConfig, CnabBoleto } from '../cnab-types';

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

describe('CNAB 240 — Builder de Remessa', () => {
  const config: CnabConfig = {
    banco: 'bb',
    formato: '240',
    cedenteNome: 'CONTACERTA CONTABILIDADE',
    cedenteDocumento: '12345678000199',
    cedenteAgencia: '1234',
    cedenteConta: '98765',
    cedenteCarteira: '17',
  };
  const boleto: CnabBoleto = {
    nossoNumero: '12345',
    numeroDocumento: 'FAT-001',
    vencimento: new Date(2026, 7, 25),
    valor: 300,
    sacadoNome: 'CLIENTE TESTE LTDA',
    sacadoDocumento: '12345678000199',
    sacadoEndereco: 'RUA A, 1',
    sacadoCidade: 'ALVORADA',
    sacadoUF: 'RS',
    sacadoCEP: '94000000',
  };

  it('gera linhas com exatamente 240 posições', () => {
    const arquivo = buildCnab240Remessa(config, [boleto], 1);
    const linhas = arquivo.split('\r\n').filter((l) => l.length > 0);
    for (const linha of linhas) expect(linha).toHaveLength(240);
  });

  it('estrutura: header(0) + headerLote(1) + P + Q + trailerLote(5) + trailer(9)', () => {
    const arquivo = buildCnab240Remessa(config, [boleto], 1);
    const linhas = arquivo.split('\r\n').filter((l) => l.length > 0);
    expect(linhas).toHaveLength(6);
    expect(linhas[0].charAt(7)).toBe('0');
    expect(linhas[1].charAt(7)).toBe('1');
    expect(linhas[2].charAt(13)).toBe('P');
    expect(linhas[3].charAt(13)).toBe('Q');
    expect(linhas[4].charAt(7)).toBe('5');
    expect(linhas[5].charAt(7)).toBe('9');
  });

  it('Segmento P carrega nosso número, vencimento e valor nas posições', () => {
    const arquivo = buildCnab240Remessa(config, [boleto], 1);
    const p = arquivo.split('\r\n')[2];
    expect(p.substring(37, 57)).toBe('00000000000000012345'); // 38-57
    expect(p.substring(73, 81)).toBe('25082026');             // 74-81
    expect(p.substring(81, 96)).toBe('000000000030000');      // 82-96 (R$ 300,00)
  });
});