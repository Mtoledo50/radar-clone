// =================================================================
// INÍCIO: backend/src/accounting/smart-import.service.ts (v3)
// =================================================================
/**
 * 🧠 SmartImportService — ETAPA 2 (ADR-066/068/069/071)
 *
 * 🆕 v3 — ANTI-DUPLICIDADE DE LANÇAMENTOS (pedido do Marcos):
 *   • getOverlap(): avisa quantos lançamentos já existem no período
 *     ("extrato 06/2026 já existe, até que dia?")
 *   • saveSmart(mode): 'ONLY_NEW' = importa só o que não tem (padrão)
 *                      'REPLACE' = apaga o período e reimporta tudo
 *   • deleteImportedStatement(): 🗑 exclui o extrato importado
 *     (faixa de datas ou tudo do cliente)
 *
 * 🛡️ REGRA DE OURO: NUNCA toca nas contas (AccountingAccount).
 * Só cria/apaga LANÇAMENTOS (AccountingEntry) com source='IMPORTACAO_EXTRATO'.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseStatement } from './domain/parse-statement';
import { buildDrafts, SuggestContext, AccountRef } from './domain/suggest-accounts';
import { LedgerService } from './ledger.service';

@Injectable()
export class SmartImportService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

  // =================================================================
  // 1) ANALISAR (sem mudanças da v2)
  // =================================================================
  async parseSmart(companyId: string, clientId: string, content: string, bankCode?: string) {
    const { rows, linhasIgnoradas } = parseStatement(content);
    if (rows.length === 0) throw new BadRequestException('Nenhuma linha válida no extrato.');

    // 🧭 ADR-072: sugestões usam o plano ATIVO do cliente (ex.: SCI 90132)
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId } });
    const accounts = await this.prisma.accountingAccount.findMany({
      where: client?.accountingPlan
        ? { companyId, planName: client.accountingPlan, isActive: true }
        : { OR: [{ companyId: null }, { companyId }], isActive: true },
      select: { id: true, code: true, name: true, seq: true },
    });
    const accountsByCode = new Map<string, AccountRef>(
      accounts.map((a) => [a.code, { id: a.id, code: a.code, name: a.name }]),
    );

    const digits = (s: string) => s.replace(/\D/g, '');
    const bankPool = accounts.filter(
      (a) => a.code.startsWith('01.1.1.01') || a.code.startsWith('01.1.1.02') || a.code.startsWith('01.1.1.03'),
    );
    const bankBySection = new Map<string, AccountRef>();
    for (const row of rows) {
      if (!row.bankAccount || bankBySection.has(row.bankAccount)) continue;
      const sec = digits(row.bankAccount);
      if (sec.length < 4) continue;
      const match = bankPool.find((a) => digits(a.name).includes(sec));
      if (match) bankBySection.set(row.bankAccount, { id: match.id, code: match.code, name: match.name });
    }
    const defaultBank =
      (bankCode && accountsByCode.get(bankCode)) ||
      bankPool.find((a) => a.code.startsWith('01.1.1.02')) ||
      null;

    const counterpartyMap = await this.ledgerService.getCounterpartyMap(companyId, clientId);
    const ctx: SuggestContext = { accountsByCode, counterpartyMap, bankBySection, defaultBank };
    const drafts = buildDrafts(rows, ctx);

    const stats = {
      total: drafts.length,
      alta: drafts.filter((d) => d.confidence === 'ALTA').length,
      media: drafts.filter((d) => d.confidence === 'MEDIA').length,
      revisar: drafts.filter((d) => d.confidence === 'REVISAR').length,
      totalEntradas: rows.filter((r) => r.side === 'ENTRADA').reduce((s, r) => s + r.amount, 0),
      totalSaidas: rows.filter((r) => r.side === 'SAIDA').reduce((s, r) => s + r.amount, 0),
    };
    return {
      drafts, stats, linhasIgnoradas,
      contasDetectadas: [...bankBySection.values()].map((a) => `${a.code} ${a.name}`),
    };
  }

  // =================================================================
  // 🆕 2) OVERLAP — "já existe extrato nesse período?"
  // =================================================================
  async getOverlap(companyId: string, clientId: string, start: string, end: string) {
    const where = {
      companyId,
      clientId,
      source: 'IMPORTACAO_EXTRATO',
      entryDate: { gte: new Date(start + 'T00:00:00'), lte: new Date(end + 'T23:59:59') },
    };
    const existingCount = await this.prisma.accountingEntry.count({ where });
    const last = await this.prisma.accountingEntry.findFirst({
      where, orderBy: { entryDate: 'desc' }, select: { entryDate: true },
    });
    const days = await this.prisma.accountingEntry.findMany({
      where, select: { entryDate: true }, distinct: ['entryDate'], orderBy: { entryDate: 'asc' },
    });
    const months = [...new Set(days.map((d) => d.entryDate.toISOString().slice(0, 7)))].sort();
    return {
      hasExisting: existingCount > 0,
      existingCount,
      lastDate: last?.entryDate ?? null,
      firstDate: days[0]?.entryDate ?? null,
      months, // ex.: ['2026-05','2026-06','2026-07']
    };
  }

  // =================================================================
  // 3) SALVAR c/ modo: ONLY_NEW (padrão) | REPLACE (substitui período)
  // =================================================================
  async saveSmart(
    companyId: string,
    clientId: string,
    drafts: any[],
    mode: 'ONLY_NEW' | 'REPLACE' = 'ONLY_NEW',
  ) {
    let created = 0, skipped = 0, deleted = 0;
    const valid = drafts.filter((d) => d.debit?.id && d.credit?.id);
    skipped += drafts.length - valid.length; // incompletos (🟠 sem conta)

    // REPLACE: apaga SOMENTE lançamentos de extrato na faixa do arquivo
    if (mode === 'REPLACE' && valid.length > 0) {
      const times = valid.map((d) => new Date(d.date + 'T00:00:00').getTime());
      const min = new Date(Math.min(...times));
      const max = new Date(Math.max(...times) + 86_399_000); // fim do dia
      const del = await this.prisma.accountingEntry.deleteMany({
        where: {
          companyId, clientId, source: 'IMPORTACAO_EXTRATO',
          entryDate: { gte: min, lte: max },
        },
      });
      deleted = del.count;
    }

    for (const d of valid) {
      // ONLY_NEW: fingerprint (cliente+data+descrição+valor) anti-duplicidade
      if (mode !== 'REPLACE') {
        const exists = await this.prisma.accountingEntry.findFirst({
          where: {
            companyId, clientId,
            entryDate: new Date(d.date),
            description: d.description,
            debitValue: d.amount,
          },
        });
        if (exists) { skipped++; continue; }
      }
      await this.prisma.accountingEntry.create({
        data: {
          companyId, clientId,
          entryDate: new Date(d.date),
          description: d.description,
          counterpartyName: d.counterparty || '',
          debitAccountId: d.debit.id,
          creditAccountId: d.credit.id,
          debitValue: d.amount,
          creditValue: d.amount,
          source: 'IMPORTACAO_EXTRATO',
          status: d.confidence === 'REVISAR' ? 'PENDENTE' : 'CONCILIADO',
        },
      });
      created++;
    }
    return { created, skipped, deleted };
  }

  // =================================================================
  // 🆕 4) 🗑 EXCLUIR EXTRATO IMPORTADO (faixa ou tudo do cliente)
  // =================================================================
  async deleteImportedStatement(companyId: string, clientId: string, start?: string, end?: string) {
    const where: any = { companyId, clientId, source: 'IMPORTACAO_EXTRATO' };
    if (start && end) {
      where.entryDate = { gte: new Date(start + 'T00:00:00'), lte: new Date(end + 'T23:59:59') };
    }
    const res = await this.prisma.accountingEntry.deleteMany({ where });
    return { deleted: res.count };
  }
}
// =================================================================
// FIM: backend/src/accounting/smart-import.service.ts (v3)
// =================================================================