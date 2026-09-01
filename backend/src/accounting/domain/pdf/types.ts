// =================================================================
// INÍCIO: backend/src/accounting/domain/pdf/types.ts
// =================================================================
export interface NormalizedRow {
  date: string;        // dd/mm/aaaa
  description: string; // complemento
  debit: number;       // saída (valor negativo no extrato / sufixo D)
  credit: number;      // entrada (sem sinal / sufixo C)
}

export interface BankAdapter {
  id: string;
  label: string;
  detect: (text: string) => boolean;
  parse: (text: string) => NormalizedRow[];
}

export const NUM = '\\d{1,3}(?:\\.\\d{3})*,\\d{2}'; // 1.234,56

export function money(s: string): number {
  let c = s.replace(/R\$|\s/g, '');
  if (c.includes(',')) c = c.replace(/\./g, '').replace(',', '.');
  const v = parseFloat(c);
  return isNaN(v) ? 0 : v;
}

// Ruído de cabeçalho/rodapé (usado só pelos adapters linha-a-linha)
const NOISE = [
  /saldo do dia/i, /saldo anterior/i, /^SALDO/i, /S A L D O/, /Cobrança referente/,
  /Tar\. agrupadas/, /Rende Facil/, /\*\*\*/, /OBSERVAÇÕES/, /Transação efetuada/,
  /Serviço de Atendimento|SAC|Ouvidoria/, /https?:\/\//, /autoatendimento/,
  /Agência|AGENCIA:/, /Conta corrente|CONTA\.\./, /Período do extrato/, /Lançamentos/,
  /Dt\. balancete/, /Valor R\$/, /Cooperativa:/, /Impresso em/, /Associado:/,
  /Cliente-/, /Consultas-/, /Visualizar Pix/, /Aceita Pix/, /Tudo em um so lugar/,
  /Tenha mais controle/, /G33\d/, /Emitido em/, /Descrição Data Valor/,
  /Data Descrição Documento/, /CNPJ:/, /Fone 3003/, /ibpj\.sicredi/,
  /Banco do Brasil/, /B A N R I S U L/, /NOME\.\.\./, /IDENTIFICACAO:/,
  /SALDO DISPONIVEL/, /INVEST RESGATE/, /SALDO LIVRE/, /SALDO INICIAL/,
  /PREZADO CLIENTE/, /VALOR DA COTA/, /DIA HISTORICO DOCUMENTO/,
  /MOVIMENTOS DA CONTA/, /EXTRATO EMITIDO/, /SALDO ANT EM/,
];
export const isNoise = (l: string) => NOISE.some((r) => r.test(l));
// =================================================================
// FIM: types.ts
// =================================================================