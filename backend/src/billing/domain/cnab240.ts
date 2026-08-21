// =================================================================
// INÍCIO: backend/src/billing/domain/cnab240.ts
// =================================================================
/**
 * 🏦 Cnab240 — FD-5 (domínio puro, ADR-061)
 * Gerador de remessa CNAB 240 v1 (layout simplificado e determinístico):
 * header arquivo (rec 0) + header lote (rec 1) + segmentos P/Q por
 * cobrança + trailers (rec 5 e 9). Linhas sempre 240 posições.
 * ⚠️ v1 educacional: homologar layout com o banco no v2.
 */

export interface CnabInstruction {
  clientName: string;
  document: string | null;
  amount: number;      // R$
  dueDate: Date;
  ourNumber: string;
}

const digits = (s: string) => (s || '').replace(/\D+/g, '');
const left = (s: string, n: number) => String(s || '').padEnd(n, ' ').slice(0, n);
const right = (s: string, n: number) => String(s || '').replace(/\D+/g, '').padStart(n, '0').slice(-n);
const dmy = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
const cents = (v: number) => right(String(Math.round(v * 100)), 13);
const line240 = (s: string) => s.padEnd(240, ' ').slice(0, 240);

/** Gera o txt de remessa CNAB 240 v1. */
export function generateCnab240(
  companyName: string,
  companyDoc: string,
  items: CnabInstruction[],
): string {
  const lines: string[] = [];
  const today = new Date();
  const bank = right('001', 3);

  // ── Registro 0: header do arquivo ──
  lines.push(line240(
    bank + right('0000', 4) + '0' + '2' + right(digits(companyDoc), 14) +
    left('', 20) + right('00000', 5) + '0' + right('000000000000', 12) + '0' +
    left(companyName, 30) + left('BANCO DO BRASIL', 30) + left('', 10) +
    '1' + dmy(today) + '000000' + right('000001', 6),
  ));

  // ── Registro 1: header do lote de cobrança ──
  lines.push(line240(
    bank + right('0001', 4) + '1' + 'R' + '01' + '00' + '00' + '000' +
    '2' + right(digits(companyDoc), 14) + left('', 20) +
    left(companyName, 30) + left('', 40) + left('', 40) +
    right('000000000000001', 15),
  ));

  // ── Segmentos P + Q por cobrança ──
  let seq = 1;
  for (const it of items) {
    // Segmento P (título)
    lines.push(line240(
      bank + right('0001', 4) + '3' + right(String(seq++), 5) + 'P' + left('', 1) +
      '01' + right('00000', 5) + '0' + right('000000000000', 12) + '0' +
      right(it.ourNumber, 20) + '1' + '1' + '0' + '00' +
      dmy(it.dueDate) + cents(it.amount) + left('', 20) + '00' +
      '0' + left('', 3) + '0' + left('', 40),
    ));
    // Segmento Q (pagador)
    lines.push(line240(
      bank + right('0001', 4) + '3' + right(String(seq++), 5) + 'Q' + left('', 1) +
      '01' + (it.document && digits(it.document).length === 11 ? '1' : '2') +
      right(digits(it.document), 15) + left(it.clientName, 40) + left('', 40) +
      left('', 15) + '000' + left('', 40),
    ));
  }

  // ── Registro 5: trailer do lote ──
  lines.push(line240(
    bank + right('0001', 4) + '5' + left('', 9) +
    right(String(items.length * 2), 6) +
    right(String(Math.round(items.reduce((s, i) => s + i.amount, 0) * 100)), 17),
  ));

  // ── Registro 9: trailer do arquivo ──
  lines.push(line240(
    bank + right('9999', 4) + '9' + left('', 9) +
    right('000001', 6) + right(String(items.length * 2 + 4), 6),
  ));

  return lines.join('\r\n');
}
// =================================================================
// FIM: backend/src/billing/domain/cnab240.ts
// =================================================================