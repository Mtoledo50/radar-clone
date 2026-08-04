import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as xlsx from 'xlsx';

@Injectable()
export class AccountingImportService {
  constructor(private prisma: PrismaService) {}

  async processFile(filePath: string, fileName: string, companyId: string) {
    const ext = fileName.split('.').pop().toLowerCase();
    let rows: any[] = [];

    try {
      if (ext === 'csv') {
        rows = await this.parseCSV(filePath);
      } else if (ext === 'xlsx' || ext === 'xls') {
        rows = await this.parseExcel(filePath);
      } else {
        throw new BadRequestException('Formato de arquivo não suportado para processamento automático. Use CSV ou Excel.');
      }

      // Processar e classificar cada linha
      const processedEntries = await this.classifyEntries(rows, companyId);

      // Limpar o arquivo temporário
      fs.unlinkSync(filePath);

      return processedEntries;
    } catch (error) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new BadRequestException(`Erro ao processar arquivo: ${error.message}`);
    }
  }

  private parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' })) // Ajuste o separador se necessário (',' ou ';')
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private parseExcel(filePath: string): Promise<any[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return Promise.resolve(xlsx.utils.sheet_to_json(sheet));
  }

  private async classifyEntries(rows: any[], companyId: string) {
    const classified = [];

    for (const row of rows) {
      // Tenta identificar colunas comuns em extratos bancários
      const dateStr = row['Data'] || row['Data Lançamento'] || row['Date'];
      const description = row['Histórico'] || row['Descrição'] || row['Description'] || row['Documento'] || '';
      const valueStr = row['Valor'] || row['Value'] || row['Valor (R$)'] || '0';
      
      // Limpa o valor (remove R$, espaços, troca vírgula por ponto)
      const cleanValue = parseFloat(valueStr.toString().replace(/[^\d,-]/g, '').replace(',', '.'));
      
      if (isNaN(cleanValue) || cleanValue === 0) continue;

      // Lógica de Débito vs Crédito:
      // Se o valor for negativo no extrato, é saída (Crédito em conta bancária, Débito em despesa)
      // Se for positivo, é entrada (Débito em conta bancária, Crédito em receita)
      // *Nota: Ajuste essa lógica conforme o padrão do extrato do seu cliente*
      const isExpense = cleanValue < 0;
      const absoluteValue = Math.abs(cleanValue);

      // Tenta extrair nome da empresa do histórico (lógica simples por enquanto)
      const companyName = this.extractCompanyName(description);

      classified.push({
        date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
        description: description.toString().trim(),
        counterpartyName: companyName || 'Não identificado',
        counterpartyCpfCnpj: '', // Será preenchido se encontrarmos no banco
        amount: absoluteValue,
        type: isExpense ? 'DESPESA' : 'RECEITA',
        status: 'PENDENTE_REVISAO', // O usuário confirma no frontend
      });
    }

    return classified;
  }

  private extractCompanyName(description: string): string | null {
    // Lógica heurística simples: pega as primeiras palavras antes de números ou "CGC/CNPJ"
    const match = description.match(/^([A-Za-zÀ-ÿ\s\.]+?)(?:\s+CNPJ|\s+\d|$)/i);
    return match ? match[1].trim() : null;
  }

  async saveEntries(entries: any[], companyId: string) {
    const savedEntries = [];

    for (const entry of entries) {
      // Aqui você pode adicionar a lógica de buscar a conta contábil padrão baseada no tipo
      // Por enquanto, vamos salvar como PENDENTE para o usuário revisar no frontend
      
      const saved = await this.prisma.accountingEntry.create({
        data: {
          companyId,
          entryDate: new Date(entry.date),
          description: entry.description,
          counterpartyName: entry.counterpartyName,
          debitValue: entry.type === 'DESPESA' ? entry.amount : 0,
          creditValue: entry.type === 'RECEITA' ? entry.amount : 0,
          source: 'CSV_EXCEL',
          status: 'PENDENTE',
        },
      });
      savedEntries.push(saved);
    }

    return savedEntries;
  }
}