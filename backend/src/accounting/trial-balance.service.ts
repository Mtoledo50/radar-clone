// =================================================================
// INÍCIO: backend/src/accounting/trial-balance.service.ts
// =================================================================
/**
 * 📒 TrialBalanceService — ETAPA 1 (ADR-066)
 * Gerencia a importação e consulta de balancetes iniciais por cliente.
 * 
 * FLUXO:
 *   1. Frontend lê o CSV → envia como { content, clientId, competence }
 *   2. Parser de domínio transforma em linhas estruturadas
 *   3. Service grava no banco (idempotente: reimportar substitui)
 * 
 * IDEMPOTÊNCIA (ADR-067):
 *   Se já existe balancete para (companyId, clientId, competence),
 *   apaga o anterior e grava o novo. Nunca duplica.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseTrialBalance } from './domain/parse-trial-balance';

@Injectable()
export class TrialBalanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Importa balancete a partir do conteúdo CSV (texto).
   * Idempotente: reimportar substitui o anterior do mesmo período.
   */
  async importTrialBalance(
    companyId: string,
    clientId: string,
    competence: string, // 'YYYY-MM'
    content: string,
    fileName?: string,
  ) {
    // 1. Parse do conteúdo (domínio puro, testável)
    const parsed = parseTrialBalance(content);
    if (parsed.rows.length === 0) {
      throw new NotFoundException('CSV vazio ou formato inválido.');
    }

    // 2. Idempotência: apaga balancete anterior do mesmo período (se existir)
    const existing = await this.prisma.trialBalance.findFirst({
      where: { companyId, clientId, competence },
    });
    if (existing) {
      await this.prisma.trialBalance.delete({ where: { id: existing.id } });
      // Cascade apaga as rows automaticamente
    }

    // 3. Cria o novo balancete + linhas em transação ACID
    const trialBalance = await this.prisma.$transaction(async (tx) => {
      const tb = await tx.trialBalance.create({
        data: {
          companyId,
          clientId,
          competence,
          fileName,
          rowCount: parsed.rows.length,
          totalDebit: parsed.totalDebit,
          totalCredit: parsed.totalCredit,
        },
      });

      // Insere as linhas (contas com saldos)
      await tx.trialBalanceRow.createMany({
        data: parsed.rows.map((row) => ({
          trialBalanceId: tb.id,
          accountNumber: row.accountNumber, // 🆕
          code: row.code,
          name: row.name,
          isSynthetic: row.isSynthetic,
          prevBalance: row.prevBalance,
          debit: row.debit,
          credit: row.credit,
          currentBalance: row.currentBalance,
        })),
      });

      return tb;
    });

    return {
      id: trialBalance.id,
      competence: trialBalance.competence,
      rowCount: trialBalance.rowCount,
      totalDebit: trialBalance.totalDebit,
      totalCredit: trialBalance.totalCredit,
    };
  }

  /**
   * Lista todos os balancetes do cliente (cabeçalhos).
   */
  async listTrialBalances(companyId: string, clientId: string) {
    return this.prisma.trialBalance.findMany({
      where: { companyId, clientId },
      orderBy: { competence: 'desc' },
      include: { _count: { select: { rows: true } } },
    });
  }

  /**
   * Retorna as linhas de um balancete específico.
   */
  async getTrialBalanceRows(trialBalanceId: string, companyId: string) {
    const tb = await this.prisma.trialBalance.findFirst({
      where: { id: trialBalanceId, companyId },
      include: { rows: { orderBy: { code: 'asc' } } },
    });
    if (!tb) throw new NotFoundException('Balancete não encontrado.');
    return tb;
  }

  /**
   * Retorna o saldo atual de uma conta específica no balancete mais recente.
   * Usado para comparação na hora do lançamento mensal.
   */
  async getAccountBalance(
    companyId: string,
    clientId: string,
    accountCode: string,
  ) {
    const tb = await this.prisma.trialBalance.findFirst({
      where: { companyId, clientId },
      orderBy: { competence: 'desc' },
      include: {
        rows: {
          where: { code: accountCode },
          take: 1,
        },
      },
    });
    if (!tb || tb.rows.length === 0) return null;
    return {
      competence: tb.competence,
      prevBalance: tb.rows[0].prevBalance,
      currentBalance: tb.rows[0].currentBalance,
    };
  }
}
// =================================================================
// FIM: backend/src/accounting/trial-balance.service.ts
// =================================================================