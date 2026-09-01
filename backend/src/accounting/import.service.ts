import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import csv from 'csv-parser';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📥 PARSE DE EXTRATO VIA TEXTO (sem arquivo físico — usado pela Tela 1)
  // =================================================================
  parseBankStatementFromText(content: string) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delim = this.detectDelimiter(lines[0]);
    const header = lines[0].split(delim).map((h) =>
      h.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
    );
    const idx = (keys: string[]) =>
      header.findIndex((h) => keys.some((k) => h.includes(k)));
    const iDate = idx(['DATA']);
    const iDeb = idx(['DEBITO']);
    const iCred = idx(['CREDITO']);
    const iComp = idx(['COMPLEMENTO', 'HISTORICO', 'DESCRICAO']);
    const iCnpj = idx(['CNPJ', 'CPF']);

    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(delim).map((s) => (s || '').trim());
      const date = this.parseDate(c[iDate] || '');
      if (!date) continue;

      const valDebito = this.parseValor(c[iDeb] || '');
      const valCredito = this.parseValor(c[iCred] || '');
      if (valDebito <= 0 && valCredito <= 0) continue;

      results.push({
        date: date.toISOString(),
        description: (c[iComp] || '').trim(),
        counterpartyCpfCnpj: (c[iCnpj] || '').trim() || null,
        amount: valDebito > 0 ? valDebito : valCredito,
        type: valDebito > 0 ? 'SAIDA' : 'ENTRADA',
        status: 'PENDENTE',
      });
    }
    return results;
  }

  private detectDelimiter(line: string): string {
    return [';', '\t', '|', ','].reduce(
      (best, d) => (line.split(d).length > line.split(best).length ? d : best),
      ',',
    );
  }

  // =================================================================
  // 📥 PARSE VIA ARQUIVO (fluxo Multer existente — mantido)
  // =================================================================
  async parseBankStatement(filePath: string, fileName: string, companyId: string) {
    try {
      const results: any[] = [];
      let linhasIgnoradas = 0;

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ',' }))
          .on('data', (row) => {
            const data = this.normalizeKeys(row);
            const dateStr = data['DATA'];
            if (!dateStr || dateStr.toLowerCase() === 'data') return;
            const date = this.parseDate(dateStr);
            if (!date) { linhasIgnoradas++; return; }

            const valDebito = this.parseValor(data['DEBITO'] || '');
            const valCredito = this.parseValor(data['CREDITO'] || '');
            if (valDebito <= 0 && valCredito <= 0) { linhasIgnoradas++; return; }

            results.push({
              date: date.toISOString(),
              description: (data['COMPLEMENTO'] || '').trim(),
              counterpartyCpfCnpj: (data['CNPJ'] || '').trim() || null,
              amount: valDebito > 0 ? valDebito : valCredito,
              type: valDebito > 0 ? 'SAIDA' : 'ENTRADA',
              status: 'PENDENTE',
            });
          })
          .on('end', () => resolve(results))
          .on('error', reject);
      });

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return { entries: results, linhasProcessadas: results.length, linhasIgnoradas };
    } catch (error: any) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new BadRequestException(`Erro ao ler arquivo: ${error.message}`);
    }
  }

  // =================================================================
  // 💾 SALVAR LANÇAMENTOS IMPORTADOS (mantido + clientId)
  // =================================================================
  async saveImportedEntries(entries: any[], companyId: string, userId: string, clientId?: string) {
    const saved = [];
    for (const entry of entries) {
      const created = await this.prisma.accountingEntry.create({
        data: {
          companyId,
          clientId: clientId || null,
          entryDate: new Date(entry.date),
          description: entry.description,
          counterpartyCpfCnpj: entry.counterpartyCpfCnpj || null,
          debitValue: entry.type === 'SAIDA' ? entry.amount : 0,
          creditValue: entry.type === 'ENTRADA' ? entry.amount : 0,
          source: 'IMPORTACAO_EXTRATO',
          status: 'PENDENTE',
        },
      });
      saved.push(created);
    }
    return saved;
  }

  // =================================================================
  // 🔧 HELPERS
  // =================================================================
  private normalizeKeys(row: any): any {
    const normalized: any = {};
    for (const key in row) {
      const cleanKey = key.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      normalized[cleanKey] = row[key];
    }
    return normalized;
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    if (dateStr.includes('-')) return new Date(dateStr);
    return null;
  }

  private parseValor(valorStr: string): number {
    if (!valorStr) return 0;
    let clean = valorStr.toString().replace('R$', '').trim();
    if (clean.includes(',')) clean = clean.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(clean);
    return isNaN(valor) ? 0 : valor;
  }
}