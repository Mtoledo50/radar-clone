// =================================================================
// 🆕 SPRINT 29: MOTOR DE CONCILIAÇÃO BANCO × NF-e
// =================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MatchSuggestion {
  bankTransaction: any;
  fiscalInvoice: any;
  score: number;
  breakdown: { valor: number; nome: number; data: number };
}

@Injectable()
export class BankingReconcileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normaliza texto para comparação (remove acentos, lowercase, trim)
   */
  private normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * Calcula similaridade Jaccard entre dois textos
   */
  private jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(this.normalize(a).split(/\s+/));
    const setB = new Set(this.normalize(b).split(/\s+/));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Calcula score de matching entre transação bancária e NF-e
   * Pesos: Valor 60% | Nome 30% | Data 10%
   */
  private calculateScore(bankTx: any, invoice: any): { score: number; breakdown: any } {
    // 1. Score de valor (60%)
    const bankAmount = Math.abs(Number(bankTx.amount));
    const invoiceTotal = Number(invoice.totalValue);
    const diff = Math.abs(bankAmount - invoiceTotal);
    const valorScore = diff <= 0.01 ? 100 : Math.max(0, 100 - diff * 10);

    // 2. Score de nome (30%)
    const bankCounterparty = bankTx.counterparty || '';
    const invoiceSupplier = invoice.supplier?.name || '';
    const nomeScore = this.jaccardSimilarity(bankCounterparty, invoiceSupplier) * 100;

    // 3. Score de data (10%) - tolerância de ±30 dias
    const bankDate = new Date(bankTx.date);
    const invoiceDate = new Date(invoice.emissionDate);
    const daysDiff = Math.abs((bankDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    const dataScore = Math.max(0, 100 - daysDiff * 3.33); // -3.33 pontos por dia

    const score = valorScore * 0.6 + nomeScore * 0.3 + dataScore * 0.1;

    return {
      score: Math.round(score * 10) / 10,
      breakdown: {
        valor: Math.round(valorScore * 10) / 10,
        nome: Math.round(nomeScore * 10) / 10,
        data: Math.round(dataScore * 10) / 10,
      },
    };
  }

  /**
   * Gera sugestões de matching para um cliente+mês
   */
  async suggest(
    companyId: string,
    clientId: string,
    year: number,
    month: number,
  ) {
    // 1. Busca débitos bancários do mês (amount < 0)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const statement = await this.prisma.bankStatement.findFirst({
      where: { companyId, clientId, year, month },
    });

    if (!statement) {
      throw new NotFoundException('Fechamento não encontrado para este mês.');
    }

    const bankTransactions = await this.prisma.bankTransaction.findMany({
      where: {
        statementId: statement.id,
        amount: { lt: 0 }, // apenas débitos
      },
      orderBy: { date: 'asc' },
    });

    // 2. Busca NF-e de entrada do cliente no período (±30 dias)
    const invoiceStartDate = new Date(startDate);
    invoiceStartDate.setDate(invoiceStartDate.getDate() - 30);
    const invoiceEndDate = new Date(endDate);
    invoiceEndDate.setDate(invoiceEndDate.getDate() + 30);

    const invoices = await this.prisma.fiscalInvoice.findMany({
      where: {
        companyId,
        clientId,
        documentType: 'NFE_ENTRADA',
        emissionDate: { gte: invoiceStartDate, lte: invoiceEndDate },
      },
      include: {
        supplier: { select: { name: true, cnpj: true } },
      },
      orderBy: { emissionDate: 'asc' },
    });

    // 3. Busca matches já existentes (para não sugerir duplicados)
    const existingMatches = await this.prisma.bankNfeMatch.findMany({
      where: {
        companyId,
        OR: [
          { bankTransactionId: { in: bankTransactions.map((t) => t.id) } },
          { fiscalInvoiceId: { in: invoices.map((i) => i.id) } },
        ],
        status: { in: ['CONFIRMADO', 'SUGESTAO'] },
      },
    });

    const matchedBankIds = new Set(existingMatches.map((m) => m.bankTransactionId));
    const matchedInvoiceIds = new Set(existingMatches.map((m) => m.fiscalInvoiceId));

    // 4. Calcula scores para todos os pares possíveis
    const suggestions: MatchSuggestion[] = [];

    for (const bankTx of bankTransactions) {
      if (matchedBankIds.has(bankTx.id)) continue; // já conciliado

      for (const invoice of invoices) {
        if (matchedInvoiceIds.has(invoice.id)) continue; // já conciliado

        const { score, breakdown } = this.calculateScore(bankTx, invoice);

        if (score >= 50) { // threshold mínimo
          suggestions.push({
            bankTransaction: bankTx,
            fiscalInvoice: invoice,
            score,
            breakdown,
          });
        }
      }
    }

    // 5. Ordena por score (melhores primeiro)
    suggestions.sort((a, b) => b.score - a.score);

    // 6. Remove duplicados (mesma NF-e sugerida para múltiplos débitos)
    const uniqueSuggestions: MatchSuggestion[] = [];
    const usedInvoiceIds = new Set<string>();

    for (const s of suggestions) {
      if (!usedInvoiceIds.has(s.fiscalInvoice.id)) {
        uniqueSuggestions.push(s);
        usedInvoiceIds.add(s.fiscalInvoice.id);
      }
    }

    // 7. Identifica não conciliados
    const unmatchedBanks = bankTransactions.filter((t) => !matchedBankIds.has(t.id));
    const unmatchedInvoices = invoices.filter((i) => !matchedInvoiceIds.has(i.id));

    return {
      suggestions: uniqueSuggestions,
      unmatched: {
        banks: unmatchedBanks,
        invoices: unmatchedInvoices,
      },
      stats: {
        totalBanks: bankTransactions.length,
        totalInvoices: invoices.length,
        conciliado: existingMatches.filter((m) => m.status === 'CONFIRMADO').length,
        sugestoes: uniqueSuggestions.length,
      },
    };
  }

  /**
   * Confirma ou descarta matches
   */
  async confirm(
    companyId: string,
    userId: string,
    matches: Array<{
      bankTransactionId: string;
      fiscalInvoiceId: string;
      action: 'confirm' | 'discard';
      score?: number;
      breakdown?: any;
    }>,
  ) {
    let confirmed = 0;
    let discarded = 0;

    for (const match of matches) {
      if (match.action === 'confirm') {
        await this.prisma.bankNfeMatch.upsert({
          where: {
            bankTransactionId_fiscalInvoiceId: {
              bankTransactionId: match.bankTransactionId,
              fiscalInvoiceId: match.fiscalInvoiceId,
            },
          },
          update: {
            status: 'CONFIRMADO',
            confirmedAt: new Date(),
            confirmedBy: userId,
          },
          create: {
            companyId,
            bankTransactionId: match.bankTransactionId,
            fiscalInvoiceId: match.fiscalInvoiceId,
            score: match.score || 0,
            matchType: 'AUTO',
            status: 'CONFIRMADO',
            scoreBreakdown: match.breakdown || {},
            confirmedAt: new Date(),
            confirmedBy: userId,
          },
        });
        confirmed++;
      } else {
        await this.prisma.bankNfeMatch.upsert({
          where: {
            bankTransactionId_fiscalInvoiceId: {
              bankTransactionId: match.bankTransactionId,
              fiscalInvoiceId: match.fiscalInvoiceId,
            },
          },
          update: { status: 'DESCARTADO' },
          create: {
            companyId,
            bankTransactionId: match.bankTransactionId,
            fiscalInvoiceId: match.fiscalInvoiceId,
            score: match.score || 0,
            matchType: 'AUTO',
            status: 'DESCARTADO',
            scoreBreakdown: match.breakdown || {},
          },
        });
        discarded++;
      }
    }

    return { confirmed, discarded };
  }

  /**
   * Lista matches confirmados e pendentes
   */
  async list(companyId: string, clientId: string, year: number, month: number) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { companyId, clientId, year, month },
    });

    if (!statement) {
      return { confirmed: [], pending: [], stats: { total: 0, conciliado: 0, pendente: 0 } };
    }

    const matches = await this.prisma.bankNfeMatch.findMany({
      where: {
        companyId,
        bankTransaction: { statementId: statement.id },
      },
      include: {
        bankTransaction: true,
        fiscalInvoice: {
          include: { supplier: { select: { name: true, cnpj: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const confirmed = matches.filter((m) => m.status === 'CONFIRMADO');
    const pending = matches.filter((m) => m.status === 'SUGESTAO');

    return {
      confirmed,
      pending,
      stats: {
        total: matches.length,
        conciliado: confirmed.length,
        pendente: pending.length,
      },
    };
  }
}