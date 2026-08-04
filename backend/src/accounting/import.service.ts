import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as xlsx from 'xlsx';

/**
 * =================================================================
 * 🤖 SERVIÇO DE IMPORTAÇÃO INTELIGENTE DE EXTRATOS
 * =================================================================
 * 
 * RESPONSABILIDADES:
 * 1. Ler arquivos Excel (controle de caixa) e CSV (lançamentos contábeis)
 * 2. Realizar matching automático por VALOR e DESCRIÇÃO
 * 3. Sugerir contas de Débito e Crédito automaticamente
 * 4. Permitir revisão manual antes de salvar
 * 
 * FLUXO:
 * 1. Usuário faz upload do Excel (controle de caixa) + CSV (histórico contábil)
 * 2. Sistema tenta vincular cada lançamento do Excel com o CSV
 * 3. Retorna lista com status: VINCULADO, VALOR_ENCONTRADO, DESCRICAO_ENCONTRADA, NAO_VINCULADO
 * 4. Usuário revisa e ajusta contas quando necessário
 * 5. Usuário salva todos os lançamentos de uma vez
 */
@Injectable()
export class AccountingImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * =================================================================
   * 🎯 PROCESSAR IMPORTAÇÃO COM MATCHING AUTOMÁTICO
   * =================================================================
   * 
   * @param cashControlFile - Arquivo Excel com controle de caixa
   * @param accountingFile - Arquivo CSV com lançamentos contábeis
   * @param companyId - ID da empresa
   * @returns Lista de lançamentos processados com sugestões de contas
   */
  async processCashControlWithMatching(
    cashControlFile: Express.Multer.File,
    accountingFile: Express.Multer.File,
    companyId: string
  ) {
    try {
      // 1. Ler o arquivo de controle de caixa (Excel)
      const cashEntries = await this.parseCashControlExcel(cashControlFile.path);
      
      // 2. Ler o arquivo de lançamentos contábeis (CSV)
      const accountingEntries = await this.parseAccountingCSV(accountingFile.path);
      
      // 3. Buscar todas as contas contábeis da empresa (para mapear códigos)
      const accounts = await this.prisma.accountingAccount.findMany({
        where: { OR: [{ companyId: null }, { companyId }], isActive: true }
      });
      
      // 4. Para cada lançamento do controle de caixa, tentar vincular
      const processedEntries = [];
      for (const cashEntry of cashEntries) {
        const match = this.findMatchingAccountingEntry(cashEntry, accountingEntries, accounts);
        
        processedEntries.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          date: cashEntry.date,
          description: cashEntry.description,
          counterpartyName: cashEntry.counterpartyName,
          counterpartyCpfCnpj: cashEntry.counterpartyCpfCnpj,
          amount: cashEntry.amount,
          type: cashEntry.type, // 'ENTRADA' ou 'SAIDA'
          matchStatus: match.status,
          suggestedDebitAccountId: match.debitAccount?.id || null,
          suggestedCreditAccountId: match.creditAccount?.id || null,
          matchedFrom: match.source ? {
            debitCode: match.source.debitCode,
            creditCode: match.source.creditCode,
            description: match.source.description,
            value: match.source.value
          } : null
        });
      }
      
      // 5. Limpar arquivos temporários
      if (fs.existsSync(cashControlFile.path)) fs.unlinkSync(cashControlFile.path);
      if (fs.existsSync(accountingFile.path)) fs.unlinkSync(accountingFile.path);
      
      return processedEntries;
      
    } catch (error: any) {
      console.error('❌ ERRO NO PROCESSAMENTO:', error);
      throw new BadRequestException(`Erro ao processar arquivos: ${error.message}`);
    }
  }

  /**
   * =================================================================
   * 📊 LER ARQUIVO EXCEL (CONTROLE DE CAIXA)
   * =================================================================
   * 
   * Formato esperado:
   * | DATA | HISTÓRICO | CPF/CNPJ | ENTRADA | SAÍDA | VALOR |
   */
  private async parseCashControlExcel(filePath: string): Promise<any[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    
    const entries = [];
    
    for (const row of jsonData) {
      // Ignorar linhas vazias ou de cabeçalho
      if (!row['DATA'] || !row['VALOR']) continue;
      
      // Parsear data (formato: "1/2/26" ou "01/02/2026")
      const dateStr = row['DATA'].toString();
      const date = this.parseBrazilianDate(dateStr);
      
      // Parsear valor (formato: "R$ 1.234,56")
      const valueStr = row['VALOR'].toString();
      const amount = this.parseBrazilianCurrency(valueStr);
      
      if (amount === 0) continue;
      
      // Determinar tipo (ENTRADA ou SAÍDA)
      const isEntrada = row['ENTRADA']?.toString().toUpperCase() === 'SIM';
      const isSaida = row['SAÍDA']?.toString().toUpperCase() === 'SIM' || 
                      row['SAIDA']?.toString().toUpperCase() === 'SIM';
      
      const type = isEntrada ? 'ENTRADA' : 'SAIDA';
      
      // Extrair nome da contraparte do histórico
      const description = row['HISTÓRICO']?.toString() || row['HISTORICO']?.toString() || '';
      const counterpartyName = this.extractCounterpartyName(description);
      const counterpartyCpfCnpj = row['CPF/CNPJ']?.toString() || '';
      
      entries.push({
        date,
        description,
        counterpartyName,
        counterpartyCpfCnpj,
        amount,
        type
      });
    }
    
    return entries;
  }

  /**
   * =================================================================
   * 📄 LER ARQUIVO CSV (LANÇAMENTOS CONTÁBEIS)
   * =================================================================
   * 
   * Formato esperado:
   * | Chave | Cód. empresa | Data | Débito | Crédito | Valor | Histórico | ...
   */
  private async parseAccountingCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => {
          // Ignorar linhas vazias
          if (!data['Data'] || !data['Valor']) return;
          
          // Parsear data
          const date = this.parseBrazilianDate(data['Data']);
          
          // Parsear valor
          const amount = this.parseBrazilianCurrency(data['Valor']);
          
          if (amount === 0) return;
          
          results.push({
            date,
            debitCode: data['Débito']?.toString() || '',
            creditCode: data['Crédito']?.toString() || '',
            value: amount,
            description: data['Histórico']?.toString() || '',
            complement: data['Complemento']?.toString() || ''
          });
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * =================================================================
   * 🔍 ENCONTRAR MATCH ENTRE LANÇAMENTO DO CAIXA E CONTÁBIL
   * =================================================================
   * 
   * ESTRATÉGIA:
   * 1. Tentar match por VALOR EXATO (tolerância de centavos)
   * 2. Se falhar, tentar match por DESCRIÇÃO (similaridade de texto)
   * 3. Se não encontrar, retornar status NAO_VINCULADO
   */
  private findMatchingAccountingEntry(
    cashEntry: any,
    accountingEntries: any[],
    accounts: any[]
  ) {
    // TENTATIVA 1: Match por valor exato
    const valueMatch = accountingEntries.find(acc => 
      Math.abs(acc.value - cashEntry.amount) < 0.01 // Tolerância de 1 centavo
    );
    
    if (valueMatch) {
      const debitAccount = accounts.find(acc => acc.code === valueMatch.debitCode);
      const creditAccount = accounts.find(acc => acc.code === valueMatch.creditCode);
      
      return {
        status: 'VALOR_ENCONTRADO',
        debitAccount,
        creditAccount,
        source: valueMatch
      };
    }
    
    // TENTATIVA 2: Match por descrição (similaridade)
    const descMatch = accountingEntries.find(acc => {
      const similarity = this.calculateTextSimilarity(acc.description, cashEntry.description);
      return similarity > 0.6; // 60% de similaridade
    });
    
    if (descMatch) {
      const debitAccount = accounts.find(acc => acc.code === descMatch.debitCode);
      const creditAccount = accounts.find(acc => acc.code === descMatch.creditCode);
      
      return {
        status: 'DESCRICAO_ENCONTRADA',
        debitAccount,
        creditAccount,
        source: descMatch
      };
    }
    
    // NÃO ENCONTROU MATCH
    return {
      status: 'NAO_VINCULADO',
      debitAccount: null,
      creditAccount: null,
      source: null
    };
  }

  /**
   * =================================================================
   * 💾 SALVAR LANÇAMENTOS CONFIRMADOS PELO USUÁRIO
   * =================================================================
   */
  async saveConfirmedEntries(entries: any[], companyId: string) {
    const savedEntries = [];
    
    for (const entry of entries) {
      // Validar se tem contas de débito e crédito
      if (!entry.debitAccountId || !entry.creditAccountId) {
        throw new BadRequestException(`Lançamento "${entry.description}" não possui contas de débito/crédito`);
      }
      
      const saved = await this.prisma.accountingEntry.create({
        data: {
          companyId,
          entryDate: new Date(entry.date),
          description: entry.description,
          counterpartyName: entry.counterpartyName,
          counterpartyCpfCnpj: entry.counterpartyCpfCnpj,
          debitAccountId: entry.debitAccountId,
          debitValue: entry.type === 'SAIDA' ? entry.amount : 0,
          creditAccountId: entry.creditAccountId,
          creditValue: entry.type === 'ENTRADA' ? entry.amount : 0,
          source: 'IMPORTACAO_EXCEL',
          status: 'CONCILIADO'
        }
      });
      
      savedEntries.push(saved);
    }
    
    return savedEntries;
  }

  // =================================================================
  // 🔧 FUNÇÕES AUXILIARES
  // =================================================================

  /**
   * Parsear data no formato brasileiro (DD/MM/YY ou DD/MM/YYYY)
   */
  private parseBrazilianDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
    let year = parseInt(parts[2]);
    
    // Se o ano tem 2 dígitos, assumir 2000+
    if (year < 100) year += 2000;
    
    return new Date(year, month, day);
  }

  /**
   * Parsear valor monetário no formato brasileiro (R$ 1.234,56)
   */
  private parseBrazilianCurrency(valueStr: string): number {
    // Remover "R$", espaços e pontos de milhar
    const cleanStr = valueStr
      .replace(/R\$/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const value = parseFloat(cleanStr);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Extrair nome da contraparte do histórico
   */
  private extractCounterpartyName(description: string): string {
    // Tentar extrair nome antes de palavras-chave como "HONOR.", "CONSULTA", etc
    const match = description.match(/^(HONOR\.?:?\s*)?(.+?)(?:\s*\(|\s*-\s*CONSULTA|\s*-\s*ANUIDADE|$)/i);
    return match ? match[2].trim() : description.substring(0, 50);
  }

  /**
   * Calcular similaridade entre dois textos (0 a 1)
   * Usa Jaccard similarity baseado em palavras
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}