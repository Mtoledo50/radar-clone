// =================================================================
// INÍCIO: import.service.ts
// =================================================================
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as csv from 'csv-parser';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // INÍCIO: Método parseBankStatement
  // =================================================================
  async parseBankStatement(filePath: string, fileName: string, companyId: string) {
    try {
      console.log(`\n Lendo arquivo: ${fileName}`);
      const results: any[] = [];
      let linhasIgnoradas = 0;

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ',' }))
          .on('data', (row) => {
            const data = this.normalizeKeys(row);

            const dateStr = data['DATA'];
            const debitoStr = data['DÉBITO'] || data['DEBITO'];
            const creditoStr = data['CRÉDITO'] || data['CREDITO'];
            const description = data['COMPLEMENTO'] || '';
            const cnpj = data['CNPJ'] || '';

            // Pular cabeçalho ou linhas vazias
            if (!dateStr || dateStr.toLowerCase() === 'data') {
              return;
            }

            const date = this.parseDate(dateStr);
            if (!date) {
              linhasIgnoradas++;
              return;
            }

            let amount = 0;
            let type: 'ENTRADA' | 'SAIDA' = 'ENTRADA';

            const valDebito = this.parseValor(debitoStr);
            const valCredito = this.parseValor(creditoStr);

            if (valDebito > 0) {
              amount = valDebito;
              type = 'SAIDA';
            } else if (valCredito > 0) {
              amount = valCredito;
              type = 'ENTRADA';
            } else {
              linhasIgnoradas++;
              return;
            }

            results.push({
              date: date.toISOString(),
              description: description.trim(),
              counterpartyCpfCnpj: cnpj.trim(),
              amount: amount,
              type: type,
              status: 'PENDENTE',
            });
          })
          .on('end', () => {
            console.log(`✅ Parse concluído: ${results.length} válidos, ${linhasIgnoradas} ignoradas`);
            resolve(results);
          })
          .on('error', reject);
      });

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        entries: results,
        linhasProcessadas: results.length,
        linhasIgnoradas,
      };
    } catch (error: any) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new BadRequestException(`Erro ao ler arquivo: ${error.message}`);
    }
  }
  // =================================================================
  // FIM: Método parseBankStatement
  // =================================================================

  // =================================================================
  // INÍCIO: Métodos Auxiliares de Parse
  // =================================================================
  private normalizeKeys(row: any): any {
    const normalized: any = {};
    for (const key in row) {
      const cleanKey = key
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
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
    if (dateStr.includes('-')) {
      return new Date(dateStr);
    }
    return null;
  }

  private parseValor(valorStr: string): number {
    if (!valorStr) return 0;
    let clean = valorStr.toString().replace('R$', '').trim();
    if (clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
    const valor = parseFloat(clean);
    return isNaN(valor) ? 0 : valor;
  }
  // =================================================================
  // FIM: Métodos Auxiliares de Parse
  // =================================================================

  // =================================================================
  // INÍCIO: Método saveImportedEntries (CORRIGIDO)
  // =================================================================
  async saveImportedEntries(entries: any[], companyId: string, userId: string, clientId?: string) {
    const saved = [];
    
    for (const entry of entries) {
      const created = await this.prisma.accountingEntry.create({
        data: {
          companyId,
          clientId: clientId || null, // 🔥 CORREÇÃO: Salva o clientId se existir
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
  // FIM: Método saveImportedEntries
  // =================================================================
}
// =================================================================
// FIM: import.service.ts
// =================================================================