/**
 * =================================================================
 * 🤖 SERVIÇO DE CONCILIAÇÃO BANCÁRIA AUTOMÁTICA
 * =================================================================
 * 
 * RESPONSABILIDADE:
 * Realizar o matching automático entre lançamentos do controle de caixa
 * (Excel) e a base contábil (CSV), sugerindo as contas de Débito e Crédito
 * corretas com base no plano de contas padrão (SCI 90113).
 * 
 * ESTRATÉGIA DE MATCHING (em ordem de prioridade):
 * 1. Match por VALOR EXATO (tolerância de R$ 0,01)
 * 2. Match por SIMILARIDADE DE TEXTO (Jaccard similarity > 60%)
 * 3. Se não encontrar, marca como "NAO_VINCULADO" para revisão manual
 * 
 * FLUXO:
 * 1. Recebe 2 arquivos (Excel + CSV)
 * 2. Faz parsing e normalização de ambos
 * 3. Busca o plano de contas global (companyId: null)
 * 4. Para cada lançamento do controle de caixa, tenta vincular com a base contábil
 * 5. Retorna lista com sugestões de contas para o frontend revisar
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as xlsx from 'xlsx';

/**
 * Interface que representa um lançamento do controle de caixa (Excel)
 */
interface CashControlEntry {
  date: Date;
  description: string;
  counterpartyName: string;
  counterpartyCpfCnpj: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
}

/**
 * Interface que representa um lançamento da base contábil (CSV)
 */
interface AccountingBaseEntry {
  date: Date;
  debitCode: string;
  creditCode: string;
  value: number;
  description: string;
  complement: string;
}

/**
 * Interface que representa o resultado final da conciliação
 * (o que será enviado para o frontend revisar)
 */
export interface ReconciledEntry {
  id: string; // ID temporário para o frontend
  date: Date;
  description: string;
  counterpartyName: string;
  counterpartyCpfCnpj: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  matchStatus: 'VALOR_ENCONTRADO' | 'DESCRICAO_ENCONTRADA' | 'NAO_VINCULADO';
  debitAccountId: string | null;
  creditAccountId: string | null;
  matchedFrom?: {
    debitCode: string;
    creditCode: string;
    description: string;
    value: number;
  };
}

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  /**
   * =================================================================
   * 🎯 MÉTODO PRINCIPAL: PROCESSAR CONCILIAÇÃO
   * =================================================================
   * 
   * Recebe os caminhos dos 2 arquivos e o companyId do usuário.
   * Retorna uma lista de lançamentos com sugestões de contas contábeis.
   */
  async processReconciliation(
    cashControlFile: Express.Multer.File,
    accountingFile: Express.Multer.File,
    companyId: string
  ): Promise<ReconciledEntry[]> {
    try {
      // 1. Parse do arquivo Excel (controle de caixa)
      console.log('📊 Lendo controle de caixa...');
      const cashEntries = await this.parseCashControlExcel(cashControlFile.path);
      console.log(`✅ ${cashEntries.length} lançamentos encontrados no controle de caixa`);

      // 2. Parse do arquivo CSV (base contábil)
      console.log('📄 Lendo base contábil...');
      const accountingEntries = await this.parseAccountingCSV(accountingFile.path);
      console.log(`✅ ${accountingEntries.length} lançamentos encontrados na base contábil`);

      // 3. Buscar plano de contas global (companyId: null = padrão SCI 90113)
      console.log('🔍 Buscando plano de contas global...');
      const accounts = await this.prisma.accountingAccount.findMany({
        where: { 
          OR: [
            { companyId: null }, // Contas globais/padrão
            { companyId: companyId } // Contas específicas da empresa
          ],
          isActive: true 
        }
      });
      console.log(`✅ ${accounts.length} contas contábeis carregadas`);

      // 4. Para cada lançamento do controle de caixa, tentar vincular
      console.log('🔗 Iniciando matching automático...');
      const reconciledEntries: ReconciledEntry[] = [];
      
      for (const cashEntry of cashEntries) {
        const match = this.findMatchingAccountingEntry(
          cashEntry, 
          accountingEntries, 
          accounts
        );
        
        reconciledEntries.push({
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: cashEntry.date,
          description: cashEntry.description,
          counterpartyName: cashEntry.counterpartyName,
          counterpartyCpfCnpj: cashEntry.counterpartyCpfCnpj,
          amount: cashEntry.amount,
          type: cashEntry.type,
          matchStatus: match.status,
          debitAccountId: match.debitAccount?.id || null,
          creditAccountId: match.creditAccount?.id || null,
          matchedFrom: match.source ? {
            debitCode: match.source.debitCode,
            creditCode: match.source.creditCode,
            description: match.source.description,
            value: match.source.value
          } : undefined
        });
      }

      // 5. Limpar arquivos temporários do disco
      this.cleanupTempFiles([cashControlFile.path, accountingFile.path]);

      // 6. Log de estatísticas
      const stats = {
        total: reconciledEntries.length,
        valorEncontrado: reconciledEntries.filter(e => e.matchStatus === 'VALOR_ENCONTRADO').length,
        descricaoEncontrada: reconciledEntries.filter(e => e.matchStatus === 'DESCRICAO_ENCONTRADA').length,
        naoVinculado: reconciledEntries.filter(e => e.matchStatus === 'NAO_VINCULADO').length,
      };
      console.log('📈 Estatísticas da conciliação:', stats);

      return reconciledEntries;
      
    } catch (error: any) {
      console.error('❌ ERRO NA CONCILIAÇÃO:', error);
      // Limpar arquivos em caso de erro
      this.cleanupTempFiles([cashControlFile.path, accountingFile.path]);
      throw new BadRequestException(`Erro ao processar conciliação: ${error.message}`);
    }
  }

  /**
   * =================================================================
   * 📊 PARSE DO EXCEL (CONTROLE DE CAIXA)
   * =================================================================
   * 
   * Lê o arquivo Excel e extrai os lançamentos no formato padronizado.
   * Espera colunas: DATA, HISTÓRICO, CPF/CNPJ, ENTRADA, SAÍDA, VALOR
   */
  private async parseCashControlExcel(filePath: string): Promise<CashControlEntry[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Converter planilha para JSON (array de objetos)
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    const entries: CashControlEntry[] = [];
    
    for (const row of jsonData) {
      // Ignorar linhas vazias ou sem dados essenciais
      if (!row['DATA'] || !row['VALOR']) continue;
      
      // Parse da data (aceita múltiplos formatos)
      const date = this.parseBrazilianDate(row['DATA']);
      
      // Parse do valor monetário (formato brasileiro: R$ 1.234,56)
      const amount = this.parseBrazilianCurrency(row['VALOR']);
      if (amount === 0) continue;
      
      // Determinar se é ENTRADA ou SAÍDA
      const isEntrada = row['ENTRADA']?.toString().toUpperCase() === 'SIM';
      const isSaida = row['SAÍDA']?.toString().toUpperCase() === 'SIM' || 
                      row['SAIDA']?.toString().toUpperCase() === 'SIM';
      
      const type = isEntrada ? 'ENTRADA' : 'SAIDA';
      
      // Extrair descrição e nome da contraparte
      const description = row['HISTÓRICO']?.toString() || 
                         row['HISTORICO']?.toString() || 
                         '';
      
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
   * 📄 PARSE DO CSV (BASE CONTÁBIL)
   * =================================================================
   * 
   * Lê o arquivo CSV e extrai os lançamentos no formato padronizado.
   * Espera colunas: Data, Débito, Crédito, Valor, Histórico, Complemento
   */
  private async parseAccountingCSV(filePath: string): Promise<AccountingBaseEntry[]> {
    return new Promise((resolve, reject) => {
      const results: AccountingBaseEntry[] = [];
      
      // csv-parser lê o arquivo linha por linha
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' })) // Separador padrão de CSVs brasileiros
        .on('data', (data) => {
          // Ignorar linhas sem dados essenciais
          if (!data['Data'] || !data['Valor']) return;
          
          const date = this.parseBrazilianDate(data['Data']);
          const value = this.parseBrazilianCurrency(data['Valor']);
          if (value === 0) return;
          
          results.push({
            date,
            debitCode: data['Débito']?.toString().trim() || 
                      data['Debito']?.toString().trim() || '',
            creditCode: data['Crédito']?.toString().trim() || 
                       data['Credito']?.toString().trim() || '',
            value,
            description: data['Histórico']?.toString().trim() || 
                        data['Historico']?.toString().trim() || '',
            complement: data['Complemento']?.toString().trim() || ''
          });
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * =================================================================
   * 🔍 ENCONTRAR MATCH ENTRE CONTROLE DE CAIXA E BASE CONTÁBIL
   * =================================================================
   * 
   * Estratégia em 2 etapas:
   * 1. Tentar match por VALOR EXATO (tolerância de R$ 0,01)
   * 2. Se falhar, tentar match por SIMILARIDADE DE TEXTO (Jaccard > 60%)
   */
  private findMatchingAccountingEntry(
    cashEntry: CashControlEntry,
    accountingEntries: AccountingBaseEntry[],
    accounts: any[]
  ) {
    // ===== TENTATIVA 1: Match por VALOR EXATO =====
    const valueMatch = accountingEntries.find(acc => 
      Math.abs(acc.value - cashEntry.amount) < 0.01 // Tolerância de 1 centavo
    );
    
    if (valueMatch) {
      // Encontrou match por valor! Buscar as contas contábeis correspondentes
      const debitAccount = accounts.find(acc => acc.code === valueMatch.debitCode);
      const creditAccount = accounts.find(acc => acc.code === valueMatch.creditCode);
      
      return {
        status: 'VALOR_ENCONTRADO' as const,
        debitAccount,
        creditAccount,
        source: valueMatch
      };
    }
    
    // ===== TENTATIVA 2: Match por SIMILARIDADE DE TEXTO =====
    const descMatch = accountingEntries.find(acc => {
      // Calcular similaridade entre a descrição do caixa e da base contábil
      const similarity = this.calculateTextSimilarity(
        acc.description, 
        cashEntry.description
      );
      return similarity > 0.6; // 60% de similaridade mínima
    });
    
    if (descMatch) {
      // Encontrou match por descrição! Buscar as contas contábeis
      const debitAccount = accounts.find(acc => acc.code === descMatch.debitCode);
      const creditAccount = accounts.find(acc => acc.code === descMatch.creditCode);
      
      return {
        status: 'DESCRICAO_ENCONTRADA' as const,
        debitAccount,
        creditAccount,
        source: descMatch
      };
    }
    
    // ===== NÃO ENCONTROU MATCH =====
    return {
      status: 'NAO_VINCULADO' as const,
      debitAccount: null,
      creditAccount: null,
      source: null
    };
  }

  /**
   * =================================================================
   * 🔧 FUNÇÕES AUXILIARES DE PARSE E NORMALIZAÇÃO
   * =================================================================
   */

  /**
   * Parse de data no formato brasileiro (DD/MM/YY ou DD/MM/YYYY)
   * Também lida com datas serializadas do Excel (números)
   */
  private parseBrazilianDate(dateVal: any): Date {
    if (!dateVal) return new Date();
    
    // Se for número (data serial do Excel), converte para Date
    if (typeof dateVal === 'number') {
      return new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    }
    
    const dateStr = dateVal.toString().trim();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months são 0-indexed
    let year = parseInt(parts[2], 10);
    
    // Se o ano tem 2 dígitos, assumir 2000+
    if (year < 100) year += 2000;
    
    const parsedDate = new Date(year, month, day);
    
    // Validação básica para garantir que a data é válida
    if (parsedDate.getFullYear() === year && 
        parsedDate.getMonth() === month && 
        parsedDate.getDate() === day) {
      return parsedDate;
    }
    
    return new Date(); // Fallback
  }

  /**
   * Parse de valor monetário no formato brasileiro (R$ 1.234,56)
   */
  private parseBrazilianCurrency(valueVal: any): number {
    if (!valueVal) return 0;
    const valueStr = valueVal.toString().trim();
    
    // Remover "R$", espaços e pontos de milhar, trocar vírgula por ponto
    const cleanStr = valueStr
      .replace(/R\$/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const value = parseFloat(cleanStr);
    return isNaN(value) ? 0 : value;
  }

  /**
   * Extrair nome da contraparte do histórico
   * Remove prefixos como "HONOR.:" e sufixos como "- CONSULTA ONLINE"
   */
  private extractCounterpartyName(description: string): string {
    const cleanDesc = description
      // Remove prefixos comuns
      .replace(/^(HONOR\.?:?\s*|HONORÁRIOS\s+(?:DE\s+)?(?:CONTADORA|ADVOCATÍCIOS)?\s*:?\s*)/i, '')
      // Remove sufixos comuns
      .replace(/\s*-\s*(?:CONSULTA\s+(?:ONLINE|PRESENCIAL|VIRTUAL)|ANUIDADE|PROC\.|NF\s+EMITIDA|EM\s+ESPÉCIE|SEM\s+RECIBO).*$/i, '')
      // Remove textos entre parênteses
      .replace(/\s*\([^)]*\)/g, '')
      .trim();
    
    // Se após a limpeza ficar muito curto, retorna o original truncado
    return cleanDesc.length > 3 ? cleanDesc : description.substring(0, 60).trim();
  }

  /**
   * =================================================================
   * 📊 CALCULAR SIMILARIDADE ENTRE DOIS TEXTOS (Jaccard Similarity)
   * =================================================================
   * 
   * Retorna um valor entre 0 e 1, onde:
   * - 0 = completamente diferentes
   * - 1 = idênticos
   * 
   * Estratégia:
   * 1. Normaliza os textos (lowercase, remove pontuação)
   * 2. Divide em palavras (tokens)
   * 3. Ignora palavras muito curtas (< 4 caracteres)
   * 4. Calcula interseção / união dos conjuntos de palavras
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Função auxiliar para normalizar e tokenizar
    const normalize = (text: string) => 
      text.toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove pontuação
          .split(/\s+/)
          .filter(w => w.length > 3); // Ignora palavras curtas (de, da, do, etc.)

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));
    
    // Se algum texto ficou vazio após normalização, retorna 0
    if (words1.size === 0 || words2.size === 0) return 0;
    
    // Calcular interseção (palavras em comum)
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    
    // Calcular união (todas as palavras únicas)
    const union = new Set([...words1, ...words2]);
    
    // Jaccard Similarity = |interseção| / |união|
    return intersection.size / union.size;
  }

  /**
   * =================================================================
   * 🧹 LIMPAR ARQUIVOS TEMPORÁRIOS DO DISCO
   * =================================================================
   */
  private cleanupTempFiles(filePaths: string[]): void {
    for (const path of filePaths) {
      try {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      } catch (error) {
        console.warn(`⚠️ Não foi possível deletar arquivo temporário: ${path}`);
      }
    }
  }
}