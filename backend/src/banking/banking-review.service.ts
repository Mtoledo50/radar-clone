// =================================================================
// 🆕 SPRINT 32: WIZARD DE REVISÃO DE LANÇAMENTOS
// =================================================================
// Agrupa lançamentos pendentes por contraparte e sugere a categoria
// baseada na memória de aprendizado (BankClassificationRule).
// =================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ReviewGroup {
  counterparty: string;
  normalizedPattern: string;
  count: number;
  totalAmount: number;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    nature: string;
  }>;
  suggestedNature: string | null;
  confidence: number;
  ruleHits: number;
}

@Injectable()
export class BankingReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * Normaliza texto para matching (remove acentos, lowercase, trim)
   */
  private normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  /**
   * Busca a melhor regra de classificação para um padrão
   */
  private async findBestRule(
    companyId: string,
    pattern: string,
  ): Promise<{ nature: string; hits: number; confidence: number } | null> {
    const rules = await this.prisma.bankClassificationRule.findMany({
      where: { companyId },
      orderBy: { hits: 'desc' },
    });

    // Busca match exato ou por substring
    const normalizedPattern = this.normalize(pattern);

    for (const rule of rules) {
      const normalizedRule = this.normalize(rule.pattern);
      if (
        normalizedRule === normalizedPattern ||
        normalizedPattern.includes(normalizedRule) ||
        normalizedRule.includes(normalizedPattern)
      ) {
        // Confiança baseada em hits (quanto mais usada, mais confiável)
        const confidence = Math.min(100, 50 + rule.hits * 5);
        return {
          nature: rule.nature,
          hits: rule.hits,
          confidence,
        };
      }
    }

    return null;
  }

  /**
   * Agrupa transações pendentes por contraparte e sugere natureza
   */
  async getReviewGroups(
    companyId: string,
    clientId: string | null,
    year: number,
    month: number,
  ): Promise<{
    groups: ReviewGroup[];
    totalPending: number;
    totalAmount: number;
  }> {
    // 1. Busca o statement do mês
    const statement = await this.prisma.bankStatement.findFirst({
      where: { companyId, clientId, year, month },
    });

    if (!statement) {
      return { groups: [], totalPending: 0, totalAmount: 0 };
    }

    // 2. Busca transações pendentes ou não classificadas
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        statementId: statement.id,
        OR: [
          { nature: 'NAO_CLASSIFICADO' },
          { nature: 'PENDENTE' },
          { nature: null },
        ],
      },
      orderBy: { date: 'asc' },
    });

    if (transactions.length === 0) {
      return { groups: [], totalPending: 0, totalAmount: 0 };
    }

    // 3. Agrupa por contraparte normalizada
    const groupMap = new Map<string, ReviewGroup>();

    for (const tx of transactions) {
      const counterparty = tx.counterparty || tx.description || 'Sem contraparte';
      const normalizedPattern = this.normalize(counterparty);
      const key = normalizedPattern || 'unknown';

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          counterparty,
          normalizedPattern,
          count: 0,
          totalAmount: 0,
          transactions: [],
          suggestedNature: null,
          confidence: 0,
          ruleHits: 0,
        });
      }

      const group = groupMap.get(key)!;
      group.count++;
      group.totalAmount += Number(tx.amount);
      group.transactions.push({
        id: tx.id,
        date: tx.date.toISOString(),
        description: tx.description,
        amount: Number(tx.amount),
        nature: tx.nature,
      });
    }

    // 4. Para cada grupo, busca a melhor sugestão
    const groups = Array.from(groupMap.values());

    for (const group of groups) {
      const rule = await this.findBestRule(companyId, group.counterparty);
      if (rule) {
        group.suggestedNature = rule.nature;
        group.confidence = rule.confidence;
        group.ruleHits = rule.hits;
      }
    }

    // 5. Ordena por confiança (maior primeiro) e depois por valor absoluto
    groups.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return Math.abs(b.totalAmount) - Math.abs(a.totalAmount);
    });

    const totalAmount = transactions.reduce(
      (sum, tx) => sum + Math.abs(Number(tx.amount)),
      0,
    );

    return {
      groups,
      totalPending: transactions.length,
      totalAmount,
    };
  }

  /**
   * Aplica natureza em lote e opcionalmente aprende a regra
   */
  async applyReview(
    companyId: string,
    items: Array<{
      transactionIds: string[];
      nature: string;
      learn: boolean;
      counterparty?: string;
    }>,
  ): Promise<{
    updated: number;
    rulesCreated: number;
    rulesUpdated: number;
  }> {
    let updated = 0;
    let rulesCreated = 0;
    let rulesUpdated = 0;

    for (const item of items) {
      // 1. Atualiza as transações em transação atômica
      await this.prisma.$transaction(async (tx) => {
        for (const txId of item.transactionIds) {
          await tx.bankTransaction.update({
            where: { id: txId, companyId },
            data: { nature: item.nature, classifiedBy: 'MANUAL' },
          });
          updated++;
        }
      });

      // 2. Se learn=true, cria ou incrementa a regra
      if (item.learn && item.counterparty) {
        const normalizedPattern = this.normalize(item.counterparty);

        const existing = await this.prisma.bankClassificationRule.findUnique({
          where: { companyId_pattern: { companyId, pattern: normalizedPattern } },
        });

        if (existing) {
          await this.prisma.bankClassificationRule.update({
            where: { id: existing.id },
            data: {
              hits: existing.hits + item.transactionIds.length,
              nature: item.nature, // atualiza se mudou
            },
          });
          rulesUpdated++;
        } else {
          await this.prisma.bankClassificationRule.create({
            data: {
              companyId,
              pattern: normalizedPattern,
              nature: item.nature,
              hits: item.transactionIds.length,
            },
          });
          rulesCreated++;
        }
      }
    }

    return { updated, rulesCreated, rulesUpdated };
  }
}