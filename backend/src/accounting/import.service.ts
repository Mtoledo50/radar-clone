// =================================================================
// INÍCIO: backend/src/accounting/import.service.ts
// =================================================================
/**
 * ImportService — Processamento de Extratos Bancários
 * 
 * Responsável por ler, parsear e validar arquivos de extrato (CSV/TXT).
 * Compatível com o formato: Descrição;Data;Valor(Débito);Valor(Crédito)
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

export interface ParsedBankEntry {
  date: string;
  description: string;
  counterpartyCpfCnpj: string | null;
  debitValue: number;
  creditValue: number;
  type: 'SAIDA' | 'ENTRADA';
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📥 PARSE DE EXTRATO VIA TEXTO — ADR-073 (corrige colunas "Valor" duplicadas)
  // =================================================================
  /**
   * Trata os 3 formatos reais de extrato:
   *  A) Padrão Radar:  Data;Débito;Crédito;Complemento;CNPJ
   *  B) Banco (seu CSV): Descrição;Categoria;Data;Valor(crédito);Valor(débito negativo)
   *  C) Coluna única:   sinal negativo = débito, positivo = crédito
   * A linha de totais do banco é ignorada automaticamente (não tem data).
   */
  parseBankStatementFromText(content: string) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const delim = this.detectDelimiter(lines[0]);
    const header = lines[0]
      .split(delim)
      .map((h) => h.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

    const idx = (keys: string[]) =>
      header.findIndex((h) => keys.some((k) => h.includes(k)));

    const iDate = idx(['DATA']);
    if (iDate === -1) return []; // formato não reconhecido

    const iDesc = idx(['DESCRICAO', 'HISTORICO', 'COMPLEMENTO']);
    const iCnpj = idx(['CNPJ', 'CPF']);
    const iDeb = idx(['DEBITO']);
    const iCred = idx(['CREDITO']);

    // 🛡️ Captura TODAS as colunas chamadas "VALOR" (bancos duplicam o nome)
    const iValues = header
      .map((h, i) => (h.includes('VALOR') ? i : -1))
      .filter((i) => i !== -1);

    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(delim).map((s) => (s || '').trim());
      const date = this.parseDate(c[iDate] || '');
      if (!date) continue; // ignora rodapé/totais do banco

      let valDebito = 0;
      let valCredito = 0;

      if (iDeb !== -1 || iCred !== -1) {
        // Formato A: colunas explícitas Débito/Crédito
        valDebito = Math.abs(this.parseValor(c[iDeb] || ''));
        valCredito = Math.abs(this.parseValor(c[iCred] || ''));
      } else if (iValues.length >= 2) {
        // Formato B (SEU CSV): duas colunas "Valor" → o SINAL decide
        for (const vi of iValues) {
          const v = this.parseValor(c[vi] || '');
          if (v < 0) valDebito += Math.abs(v);
          else if (v > 0) valCredito += v;
        }
      } else if (iValues.length === 1) {
        // Formato C: coluna única → o SINAL decide
        const v = this.parseValor(c[iValues[0]] || '');
        if (v < 0) valDebito = Math.abs(v);
        else valCredito = v;
      }

      if (valDebito <= 0 && valCredito <= 0) continue;

      results.push({
        date: date.toISOString(),
        description: (c[iDesc !== -1 ? iDesc : 0] || 'Sem descrição').trim(),
        counterpartyCpfCnpj:
          iCnpj !== -1 ? (c[iCnpj] || '').replace(/\D/g, '') || null : null,
        // Campos novos E legado (compatibilidade com todos os consumers)
        debitValue: valDebito,
        creditValue: valCredito,
        amount: valDebito > 0 ? valDebito : valCredito,
        type: valDebito > 0 ? 'SAIDA' : 'ENTRADA',
        status: 'PENDENTE',
      });
    }
    return results;
  }
  // =================================================================
  // 📥 PARSE VIA ARQUIVO (Fluxo Multer) — ADR-073: Parser Unificado
  // =================================================================
  /**
   * Lê o arquivo enviado e delega ao parser de texto (fonte única de verdade).
   * Garante tratamento idêntico ao fluxo copiar/colar para formatos reais de banco:
   * colunas "Valor" duplicadas, categoria sem cabeçalho e linha de totais.
   */
  async parseBankStatement(filePath: string, fileName: string, companyId: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entries = this.parseBankStatementFromText(content);

      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* limpeza segura */ }
      }

      return {
        entries,
        linhasProcessadas: entries.length,
        linhasIgnoradas: 0,
      };
    } catch (error: any) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* limpeza segura */ }
      }
      throw new BadRequestException(`Erro ao processar arquivo ${fileName}: ${error.message}`);
    }
  }
  // =================================================================
  // 💾 SALVAR LANÇAMENTOS IMPORTADOS
  // =================================================================
  /**
   * Salva lançamentos importados no banco mantendo compatibilidade com
   * controllers e services antigos.
   *
   * IMPORTANTE:
   * - Este método deve retornar um ARRAY de lançamentos criados.
   * - Vários pontos do sistema usam result.length.
   * - Portanto, não retornar { count, message } aqui.
   *
   * Aceita tanto o formato novo:
   *   { date, description, debitValue, creditValue }
   *
   * quanto o formato antigo:
   *   { date, description, amount, type: 'SAIDA' | 'ENTRADA' }
   */
  async saveImportedEntries(
    entries: any[],
    companyId: string,
    userId: string,
    clientId?: string,
  ) {
    if (!entries || entries.length === 0) {
      return [];
    }

    const createdEntries = await this.prisma.$transaction(
      entries.map((entry) => {
        const entryDate = new Date(entry.date || entry.entryDate);

        const debitValue =
          entry.debitValue !== undefined
            ? Number(entry.debitValue)
            : entry.type === 'SAIDA'
              ? Number(entry.amount || 0)
              : 0;

        const creditValue =
          entry.creditValue !== undefined
            ? Number(entry.creditValue)
            : entry.type === 'ENTRADA'
              ? Number(entry.amount || 0)
              : 0;

        return this.prisma.accountingEntry.create({
          data: {
            companyId,
            clientId: clientId || null,
            entryDate,
            description: entry.description || 'Sem descrição',
            counterpartyCpfCnpj:
              entry.counterpartyCpfCnpj ||
              entry.counterpartyCnpj ||
              null,

            debitValue,
            creditValue,

            debitAccountId: entry.debitAccountId || null,
            creditAccountId: entry.creditAccountId || null,

            source: entry.source || 'IMPORTACAO_EXTRATO',
            status: entry.status || 'PENDENTE',
          },
        });
      }),
    );

    return createdEntries;
  }
  // =================================================================
  // 🔧 HELPERS ROBUSTOS
  // =================================================================
  private detectDelimiter(line: string): string {
    // Prioriza ';' que é o padrão brasileiro de CSV contábil/bancário
    if (line.includes(';')) return ';';
    if (line.includes('\t')) return '\t';
    if (line.includes('|')) return '|';
    return ',';
  }

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
      // Garante que o ano tenha 4 dígitos
      const fullYear = year.length === 2 ? `20${year}` : year;
      return new Date(`${fullYear}-${month}-${day}T12:00:00.000Z`);
    }
    if (dateStr.includes('-')) return new Date(dateStr);
    return null;
  }

  private parseValor(valorStr: string): number {
    if (!valorStr) return 0;
    let clean = valorStr.toString().replace('R$', '').replace(/\s/g, '').trim();
    
    // Formato brasileiro: 1.000,00 -> 1000.00
    if (clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
    
    const valor = parseFloat(clean);
    return isNaN(valor) ? 0 : valor;
  }
}
// =================================================================
// FIM: backend/src/accounting/import.service.ts
// =================================================================