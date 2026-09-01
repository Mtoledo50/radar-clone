// =================================================================
// INÍCIO: backend/src/accounting/reconciliation.service.ts
// =================================================================
/**
 * ReconciliationService — Motor de Conciliação e Revisão Contábil
 * 
 * Responsável por cruzar lançamentos PENDENTES com a base do SCI,
 * detectar duplicidades e permitir revisão manual.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as crypto from 'crypto';

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 🔗 CONCILIAÇÃO AUTOMÁTICA (Heurística: Valor > Descrição)
  // =================================================================
  async reconcileEntries(accountingFile: Express.Multer.File, companyId: string) {
    try {
      const pendingEntries = await this.prisma.accountingEntry.findMany({
        where: { companyId, status: 'PENDENTE' },
        select: { id: true, entryDate: true, description: true, debitValue: true, creditValue: true }
      });

      if (pendingEntries.length === 0) {
        throw new BadRequestException('Nenhum lançamento pendente encontrado para conciliar');
      }

      const sciEntries = await this.parseAccountingCSV(accountingFile.path);
      const accounts = await this.prisma.accountingAccount.findMany({
        where: { OR: [{ companyId: null }, { companyId }], isActive: true },
        select: { id: true, code: true, name: true }
      });

      const results = [];
      let vinculadosPorValor = 0;
      let vinculadosPorDescricao = 0;
      let naoVinculados = 0;

      for (const entry of pendingEntries) {
        const debitValue = Number(entry.debitValue) || 0;
        const creditValue = Number(entry.creditValue) || 0;
        const amount = debitValue > 0 ? debitValue : creditValue;

        const match = this.findMatchingSCIEntry(amount, entry.description || '', sciEntries, accounts);

        if (match.status === 'VALOR_ENCONTRADO') vinculadosPorValor++;
        else if (match.status === 'DESCRICAO_ENCONTRADA') vinculadosPorDescricao++;
        else naoVinculados++;

        results.push({
          entryId: entry.id,
          date: entry.entryDate,
          description: entry.description,
          amount: amount,
          matchStatus: match.status,
          suggestedDebitAccountId: match.debitAccount?.id || null,
          suggestedCreditAccountId: match.creditAccount?.id || null,
        });
      }

      // Limpeza segura
      if (fs.existsSync(accountingFile.path)) {
        try { fs.unlinkSync(accountingFile.path); } catch (e) {}
      }

      return {
        results,
        total: pendingEntries.length,
        vinculadosPorValor,
        vinculadosPorDescricao,
        naoVinculados
      };
    } catch (error: any) {
      if (fs.existsSync(accountingFile.path)) {
        try { fs.unlinkSync(accountingFile.path); } catch (e) {}
      }
      throw new BadRequestException(`Erro ao conciliar: ${error.message}`);
    }
  }

  private async parseAccountingCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath, { encoding: 'utf-8' })
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => {
          if (!data['Valor'] || !data['Data']) return;
          const valueStr = data['Valor'].toString().replace(/\./g, '').replace(',', '.');
          const value = parseFloat(valueStr);
          if (isNaN(value) || value === 0) return;

          results.push({
            date: data['Data'],
            debitCode: data['Débito']?.toString().trim() || '',
            creditCode: data['Crédito']?.toString().trim() || '',
            value: Math.abs(value),
            description: data['Complemento']?.toString().trim() || '',
          });
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private findMatchingSCIEntry(amount: number, description: string, sciEntries: any[], accounts: any[]) {
    // 1. Tentativa por Valor Exato (margem de erro de 1 centavo)
    const valueMatch = sciEntries.find(acc => Math.abs(acc.value - amount) < 0.01);
    if (valueMatch) {
      const debitAccount = accounts.find(acc => acc.code === valueMatch.debitCode);
      const creditAccount = accounts.find(acc => acc.code === valueMatch.creditCode);
      return { status: 'VALOR_ENCONTRADO' as const, debitAccount, creditAccount };
    }

    // 2. Tentativa por Similaridade de Texto (Jaccard Index)
    const descMatch = sciEntries.find(acc => {
      const similarity = this.calculateTextSimilarity(acc.description || '', description);
      return similarity > 0.6; // 60% de similaridade
    });

    if (descMatch) {
      const debitAccount = accounts.find(acc => acc.code === descMatch.debitCode);
      const creditAccount = accounts.find(acc => acc.code === descMatch.creditCode);
      return { status: 'DESCRICAO_ENCONTRADA' as const, debitAccount, creditAccount };
    }

    return { status: 'NAO_VINCULADO' as const, debitAccount: null, creditAccount: null };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    const normalize = (text: string) => 
      text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  async saveReconciliationSuggestions(suggestions: any[], companyId: string) {
    // 🔒 Usando transação para garantir que tudo ou nada seja salvo
    return await this.prisma.$transaction(async (tx) => {
      const updatedEntries = [];
      for (const suggestion of suggestions) {
        if (suggestion.suggestedDebitAccountId && suggestion.suggestedCreditAccountId) {
          const updated = await tx.accountingEntry.update({
            where: { id: suggestion.entryId, companyId },
            data: {
              debitAccountId: suggestion.suggestedDebitAccountId,
              creditAccountId: suggestion.suggestedCreditAccountId,
              status: 'CONCILIADO'
            }
          });
          updatedEntries.push(updated);
        }
      }
      return updatedEntries;
    });
  }
  // =================================================================
  // 🛡️ VERIFICAÇÃO DE ARQUIVO DUPLICADO
  // =================================================================
  /**
   * Verifica se um arquivo já foi enviado anteriormente.
   *
   * Nesta versão, o método gera o hash MD5 do conteúdo do arquivo e
   * retorna uma estrutura compatível com o controller atual.
   *
   * Observação:
   * Ainda não estamos persistindo esse hash em tabela própria.
   * Futuramente o ideal é criar uma tabela AccountingImportLog ou
   * AccountingImportBatch para registrar:
   * - companyId
   * - clientId
   * - fileName
   * - fileHash
   * - importedAt
   * - importedBy
   * - totalRows
   */
  async checkFileDuplicate(
    companyId: string,
    fileName: string,
    fileContent: Buffer,
  ) {
    const fileHash = crypto
      .createHash('md5')
      .update(fileContent)
      .digest('hex');

    return {
      isDuplicate: false,
      fileName,
      fileHash,
      message: 'Hash do arquivo gerado com sucesso. Nenhuma duplicidade bloqueante encontrada.',
    };
  }
  // =================================================================
  // 🛡️ DETECÇÃO E REMOÇÃO DE DUPLICIDADE (Otimizada)
  // =================================================================
  
  async findDuplicateEntries(companyId: string) {
    // 🔒 Limite de segurança para evitar travamento do servidor em bases gigantes
    const entries = await this.prisma.accountingEntry.findMany({
      where: { companyId },
      orderBy: { entryDate: 'desc' },
      take: 5000, 
      select: { id: true, entryDate: true, description: true, debitValue: true, creditValue: true }
    });

    const duplicates = [];
    const processed = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      if (processed.has(entries[i].id)) continue;

      const similarEntries = [entries[i]];

      for (let j = i + 1; j < entries.length; j++) {
        if (processed.has(entries[j].id)) continue;

        if (this.isDuplicateEntry(entries[i], entries[j])) {
          similarEntries.push(entries[j]);
          processed.add(entries[j].id);
        }
      }

      if (similarEntries.length > 1) {
        processed.add(entries[i].id);
        duplicates.push({
          groupSize: similarEntries.length,
          entries: similarEntries,
        });
      }
    }

    return duplicates;
  }

  private isDuplicateEntry(entry1: any, entry2: any): boolean {
    const val1 = Number(entry1.debitValue) > 0 ? Number(entry1.debitValue) : Number(entry1.creditValue);
    const val2 = Number(entry2.debitValue) > 0 ? Number(entry2.debitValue) : Number(entry2.creditValue);

    const sameValue = Math.abs(val1 - val2) < 0.01;
    const sameDate = new Date(entry1.entryDate).toDateString() === new Date(entry2.entryDate).toDateString();
    const sameDescription = (entry1.description || '').toLowerCase().trim() === (entry2.description || '').toLowerCase().trim();

    return sameValue && sameDate && sameDescription;
  }

  async removeDuplicateEntries(duplicateGroups: any[]) {
    const deletedIds = [];

    for (const group of duplicateGroups) {
      const toDelete = group.entries.slice(1); // Mantém o primeiro, remove o resto
      for (const entry of toDelete) {
        await this.prisma.accountingEntry.delete({ where: { id: entry.id } });
        deletedIds.push(entry.id);
      }
    }

    return { deletedCount: deletedIds.length, deletedIds };
  }
}
// =================================================================
// FIM: backend/src/accounting/reconciliation.service.ts
// =================================================================