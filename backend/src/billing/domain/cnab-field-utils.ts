/**
 * =================================================================
 * CNAB Field Utils — helpers compartilhados 240/400 (domínio puro)
 * =================================================================
 * Funções de campo (padding, datas, valores) usadas por parsers e
 * builders. Posições comentadas no padrão FEBRABAN (1-based).
 *
 * ADR-084: domínio puro, síncrono, testável sem banco/HTTP.
 * =================================================================
 */

/** Preenche com zeros à ESQUERDA (campos numéricos). */
export function padLeft(value: string | number, length: number): string {
  return String(value).padStart(length, '0');
}

/** Preenche com espaços à DIREITA (campos alfanuméricos) e trunca. */
export function padRight(value: string, length: number): string {
  return value.padEnd(length, ' ').substring(0, length);
}

/** Mantém só dígitos (normaliza CNPJ/CEP/nosso número). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Extrai campo da linha (start/end 0-based, já com trim). */
export function field(line: string, start: number, end: number): string {
  return line.substring(start, end).trim();
}

/** Valor em REAIS → string CNAB em CENTAVOS com zeros à esquerda. */
export function moneyToCnab(value: number, length: number): string {
  const cents = Math.round(value * 100);
  return padLeft(cents, length);
}

/** String CNAB em centavos → valor em REAIS (0 se inválido). */
export function cnabToMoney(valueStr: string): number {
  const clean = valueStr.trim();
  if (!/^\d+$/.test(clean)) return 0;
  return parseInt(clean, 10) / 100;
}

/** Date → DDMMAAAA (8 dígitos). */
export function dateToCnab8(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}${m}${date.getFullYear()}`;
}

/** Date → DDMMAA (6 dígitos). */
export function dateToCnab6(date: Date): string {
  return dateToCnab8(date).substring(0, 6);
}

/** DDMMAAAA → Date (null se zerado/inválido). */
export function cnab8ToDate(valueStr: string): Date | null {
  const v = valueStr.trim();
  if (v.length !== 8 || !/^\d{8}$/.test(v) || v === '00000000') return null;
  const day = parseInt(v.substring(0, 2), 10);
  const month = parseInt(v.substring(2, 4), 10) - 1;
  const year = parseInt(v.substring(4, 8), 10);
  return new Date(year, month, day);
}

/** DDMMAA → Date (null se zerado/inválido). */
export function cnab6ToDate(valueStr: string): Date | null {
  const v = valueStr.trim();
  if (v.length !== 6 || !/^\d{6}$/.test(v) || v === '000000') return null;
  const day = parseInt(v.substring(0, 2), 10);
  const month = parseInt(v.substring(2, 4), 10) - 1;
  let year = parseInt(v.substring(4, 6), 10);
  year += year < 50 ? 2000 : 1900;
  return new Date(year, month, day);
}

/** Nome do banco pelo código FEBRABAN (compartilhado 240/400). */
export function nomeBanco(codigo: string): string {
  const bancos: Record<string, string> = {
    '001': 'Banco do Brasil',
    '033': 'Santander',
    '104': 'Caixa Econômica Federal',
    '237': 'Bradesco',
    '341': 'Itaú',
  };
  return bancos[codigo] || `Banco ${codigo}`;
}

/** Descrição legível do código de movimento CNAB 240 (FEBRABAN). */
export function descricaoMovimento240(codigo: string): string {
  const descricoes: Record<string, string> = {
    '01': 'Entrada confirmada',
    '02': 'Baixa simples',
    '03': 'Confirmação de registro',
    '06': 'Liquidação',
    '09': 'Baixa por pedido',
    '14': 'Alteração de vencimento',
    '17': 'Liquidação após baixa',
    '23': 'Entrada em cartório',
    '26': 'Rejeição',
    '27': 'Alteração de dados',
    '30': 'Débito de tarifas',
  };
  return descricoes[codigo] || `Movimento ${codigo}`;
}