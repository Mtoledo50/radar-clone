// =================================================================
// INÍCIO: backend/src/accounting/trial-balance.service.ts
// =================================================================
/**
 * 📒 TrialBalanceService — VERSÃO FINAL ESTÁVEL (ADR-066/067/070)
 *
 * 🛡️ REGRA DE OURO DESTA VERSÃO: usa SOMENTE campos que existem no
 * Prisma Client atual (seq, code, name, isSynthetic, saldos).
 * NADA de `accountNumber` — elimina a deriva schema/client de vez.
 *
 * Fluxo: importa balancete (idempotente) + sincroniza o plano de
 * contas do tenant (nome + seq) pelo balancete do cliente.
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseTrialBalance, TrialBalanceRowParsed } from './domain/parse-trial-balance';

/**
 * 🧭 Tipo contábil pelo código no plano do cliente (SCI 90113):
 * 01 ATIVO • 02 PASSIVO (02.3 = PL) • 03 RECEITA • 04 DESPESA • 05 PL
 */
function inferTypeByCode(code: string): string {
  if (code.startsWith('01')) return 'ATIVO';
  if (code.startsWith('02.3')) return 'PATRIMONIO_LIQUIDO';
  if (code.startsWith('02')) return 'PASSIVO';
  if (code.startsWith('03')) return 'RECEITA';
  if (code.startsWith('04')) return 'DESPESA';
  return 'PATRIMONIO_LIQUIDO';
}

@Injectable()
export class TrialBalanceService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 1) IMPORTAR BALANCETE (idempotente por cliente+competência)
  // =================================================================
  async importTrialBalance(
    companyId: string,
    clientId: string,
    competence: string,
    content: string,
    fileName?: string,
  ) {
    const parsed = parseTrialBalance(content);
    if (parsed.rows.length === 0) {
      throw new BadRequestException('CSV vazio ou formato inválido.');
    }

    // Idempotência (ADR-067): reimportar substitui o período
    const existing = await this.prisma.trialBalance.findFirst({
      where: { companyId, clientId, competence },
    });
    if (existing) {
      await this.prisma.trialBalance.delete({ where: { id: existing.id } });
    }

    // Cabeçalho + linhas em transação ACID — SOMENTE campos do client
    const tb = await this.prisma.$transaction(async (tx) => {
      const t = await tx.trialBalance.create({
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
      await tx.trialBalanceRow.createMany({
        data: parsed.rows.map((r) => ({
          trialBalanceId: t.id,
          seq: r.seq,               // ✅ "Conta" SCI (819) — único campo sequencial
          code: r.code,             // "Classificação" (01.1.1.02.026)
          name: r.name,
          isSynthetic: r.isSynthetic,
          prevBalance: r.prevBalance,
          debit: r.debit,
          credit: r.credit,
          currentBalance: r.currentBalance,
        })),
      });
      return t;
    });

    // Sincroniza o plano de contas pelo balancete — no plano ATIVO do cliente (ADR-072)
    const sync = await this.syncChartOfAccounts(companyId, clientId, parsed.rows);

    return {
      id: tb.id,
      competence: tb.competence,
      rowCount: tb.rowCount,
      totalDebit: tb.totalDebit,
      totalCredit: tb.totalCredit,
      sync,
    };
  }

  // =================================================================
  // 2) LISTAR / VER LINHAS
  // =================================================================
  async listTrialBalances(companyId: string, clientId: string) {
    return this.prisma.trialBalance.findMany({
      where: { companyId, clientId },
      orderBy: { competence: 'desc' },
      include: { _count: { select: { rows: true } } },
    });
  }

  async getTrialBalanceRows(trialBalanceId: string, companyId: string) {
    const tb = await this.prisma.trialBalance.findFirst({
      where: { id: trialBalanceId, companyId },
      include: { rows: { orderBy: { code: 'asc' } } },
    });
    if (!tb) throw new NotFoundException('Balancete não encontrado.');
    return tb;
  }

  // =================================================================
  // 3) 🗑 EXCLUIR BALANCETE (lixeira da tela)
  // =================================================================
  async deleteTrialBalance(companyId: string, id: string) {
    const tb = await this.prisma.trialBalance.findFirst({
      where: { id, companyId },
    });
    if (!tb) throw new NotFoundException('Balancete não encontrado.');
    await this.prisma.trialBalance.delete({ where: { id } }); // rows em cascata
    return { deleted: true };
  }

  // =================================================================
  // 4) SINCRONIZAR PLANO DE CONTAS PELO BALANCETE (ADR-070)
  // =================================================================
  /**
   * Atualiza nome + seq da conta existente ou cria a faltante.
   * Upsert lógico por (companyId + planName + code).
   * 🛡️ Sem `accountNumber` — somente campos garantidos no client.
   */
  async syncChartOfAccounts(companyId: string, clientId: string, rows: TrialBalanceRowParsed[]) {
    // 🧭 ADR-072: o balancete alimenta o plano ATIVO do cliente (90132, 90514...)
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId } });
    const planName = client?.accountingPlan || 'SCI 90113';
    let updated = 0;
    let created = 0;

    for (const r of rows) {
      if (!r.code) continue;
      const type = inferTypeByCode(r.code);
      const nature =
        type === 'ATIVO' || type === 'DESPESA' ? 'DEVEDORA' : 'CREDORA';
      const level = (r.code.match(/\./g) || []).length + 1;

      const acc = await this.prisma.accountingAccount.findFirst({
        where: { companyId, planName, code: r.code },
      });

      if (acc) {
        await this.prisma.accountingAccount.update({
          where: { id: acc.id },
          data: { name: r.name, seq: r.seq },
        });
        updated++;
      } else {
        await this.prisma.accountingAccount.create({
          data: {
            companyId,
            planName,
            seq: r.seq,
            code: r.code,
            name: r.name,
            type: type as any,
            nature: nature as any,
            level,
            isActive: true,
          },
        });
        created++;
      }
    }
    return { updated, created };
  }
}
// =================================================================
// FIM: backend/src/accounting/trial-balance.service.ts
// =================================================================