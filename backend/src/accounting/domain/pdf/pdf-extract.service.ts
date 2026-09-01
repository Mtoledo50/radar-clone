import { BadRequestException, Injectable } from '@nestjs/common';

import { BANK_ADAPTERS, resolveAdapter } from './index';
// 🛡️ CJS interop: pdf-parse exporta via module.exports (sem default ESM)
// eslint-disable-next-line @typescript-eslint/no-var-requires
// 🛡️ pdf-parse v1 (pinado em 1.1.1) exporta a função via module.exports.
// Se alguém reinstalar o v2 no futuro, o erro será claro, não silencioso.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseLib = require('pdf-parse');
const pdfParseFn: any =
  typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib?.default;

@Injectable()
export class PdfExtractService {
  private round2(v: number) { return Math.round((v + Number.EPSILON) * 100) / 100; }

  listAdapters() {
    return [
      { id: 'auto', label: '🔍 Detectar automaticamente' },
      ...BANK_ADAPTERS.map((a) => ({ id: a.id, label: a.label })),
    ];
  }

 async extract(buffer: Buffer, bankId?: string) {
  // 🔍 Debug: validar o buffer recebido
  console.log('📄 Buffer recebido:', {
    isBuffer: Buffer.isBuffer(buffer),
    length: buffer?.length,
    type: typeof buffer,
  });

  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('Arquivo PDF vazio ou não recebido.');
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new BadRequestException('Formato de arquivo inválido. Esperado: Buffer.');
  }

  // 🔧 Converter Buffer para Uint8Array (formato esperado pelo pdf-parse)
  const uint8Array = new Uint8Array(buffer);

  let text = '';
  try {
    if (typeof pdfParseFn !== 'function') {
      throw new BadRequestException(
        'pdf-parse incompatível. Rode no backend: npm install pdf-parse@1.1.1',
      );
    }
    const pdf: any = await pdfParseFn(uint8Array);
    text = pdf?.text || '';
    console.log('✅ PDF extraído com sucesso:', {
      pages: pdf?.numpages,
      textLength: text.length,
    });
  } catch (e: any) {
    console.error('❌ Erro ao extrair PDF:', e.message);
    throw new BadRequestException(`Não consegui ler o PDF: ${e.message}`);
  }

  if (!text.trim()) {
    throw new BadRequestException('PDF sem texto extraível (possivelmente digitalizado/imagem).');
  }

  const adapter = resolveAdapter(text, bankId);
  console.log('🏦 Adapter selecionado:', adapter.label);

  const rows = adapter.parse(text);
  if (!rows.length) {
    throw new BadRequestException(
      `O adapter "${adapter.label}" não reconheceu lançamentos neste PDF. ` +
      `Confira o banco selecionado ou envie o CSV padrão.`,
    );
  }

  return {
    bank: adapter.id,
    bankLabel: adapter.label,
    rows,
    totalRows: rows.length,
    totalDebit: this.round2(rows.reduce((s, r) => s + r.debit, 0)),
    totalCredit: this.round2(rows.reduce((s, r) => s + r.credit, 0)),
  };
}
}