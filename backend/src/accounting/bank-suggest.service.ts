// =================================================================
// INÍCIO: backend/src/accounting/bank-suggest.service.ts (ADR-107)
// =================================================================
/**
 * BankSuggestService — Sugestão de contas D/C direto no extrato bancário.
 * Prioridade determinística: REGRA aprendida > AUTO (razão histórico) > REVISAR.
 * Apply cria AccountingEntry PENDENTE vinculada à BankTransaction (idempotente).
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BankSuggestService {
  constructor(private prisma: PrismaService) {}

  private normalize(s: string): string {
    return (s || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Códigos de caixa/banco no razão (blocos bancários) */
  private isBankCode(code: string): boolean {
    return /^0?1\.1\.1/.test(code || '') || /^0?1\.1\.2/.test(code || '');
  }

  // =================================================================
  // 🔍 ANALISAR: gera sugestões por transação do fechamento
  // =================================================================
  async analyze(companyId: string, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId },
      include: { transactions: { orderBy: { date: 'asc' } } },
    });
    if (!statement) throw new NotFoundException('Fechamento não encontrado.');

    const clientId = statement.clientId;
    const txIds = statement.transactions.map((t) => t.id);

    const [linked, rules, ledger, accounts] = await Promise.all([
      this.prisma.accountingEntry.findMany({
        where: { bankTransactionId: { in: txIds } },
        select: { bankTransactionId: true },
      }),
      this.prisma.counterpartyAccountRule.findMany({
        where: { companyId, OR: [{ clientId }, { clientId: null }] },
      }),
      clientId
        ? this.prisma.clientLedgerEntry.findMany({
            where: { companyId, clientId },
            select: { counterparty: true, accountCode: true },
          })
        : Promise.resolve([] as { counterparty: string; accountCode: string }[]),
      this.prisma.accountingAccount.findMany({
        where: { OR: [{ companyId }, { companyId: null }], isActive: true },
        select: { id: true, code: true, name: true },
      }),
    ]);

    const linkedSet = new Set(linked.map((l) => l.bankTransactionId));
    const accByCode = new Map(accounts.map((a) => [a.code, a]));
    const bankFallback =
      accounts.find((a) => a.code.startsWith('1.1.1')) ||
      accounts.find((a) => a.code.startsWith('1.1.2')) ||
      null;

    const suggestions = statement.transactions.map((t) => {
      const key = this.normalize(t.counterparty || t.description);
      const income = Number(t.amount) > 0;
      const base = {
        bankTransactionId: t.id,
        date: t.date,
        description: t.description,
        counterparty: t.counterparty,
        amount: Number(t.amount),
        alreadyLinked: linkedSet.has(t.id),
        confidence: 'REVISAR' as 'AUTO' | 'REGRA' | 'REVISAR',
        debitAccountId: null as string | null,
        creditAccountId: null as string | null,
      };
      if (!key) return base;

      // 1) REGRA aprendida: contraparte → contas D/C já gravadas
      const rule = rules.find(
        (r) => r.pattern && (key === r.pattern || (r.pattern.length >= 4 && key.includes(r.pattern))),
      );
      if (rule?.debitAccountId && rule?.creditAccountId) {
        return { ...base, confidence: 'REGRA' as const, debitAccountId: rule.debitAccountId, creditAccountId: rule.creditAccountId };
      }

      // 2) AUTO: razão histórico — conta mais frequente da contraparte
      const lines = ledger.filter((l) => this.normalize(l.counterparty) === key);
      if (lines.length > 0) {
        const freq = new Map<string, number>();
        for (const l of lines) {
          if (this.isBankCode(l.accountCode)) continue;
          freq.set(l.accountCode, (freq.get(l.accountCode) || 0) + 1);
        }
        let bestCode: string | null = null;
        let bestN = 0;
        freq.forEach((n, code) => { if (n > bestN) { bestN = n; bestCode = code; } });
        const counterAcc = bestCode ? accByCode.get(bestCode) : undefined;
        if (counterAcc && bankFallback) {
          return {
            ...base,
            confidence: 'AUTO' as const,
            debitAccountId: income ? bankFallback.id : counterAcc.id,
            creditAccountId: income ? counterAcc.id : bankFallback.id,
          };
        }
      }

      // 3) REVISAR: pré-preenche só o lado bancário
      return {
        ...base,
        debitAccountId: income && bankFallback ? bankFallback.id : null,
        creditAccountId: !income && bankFallback ? bankFallback.id : null,
      };
    });

    return { suggestions, total: suggestions.length };
  }

  // =================================================================
  // 💾 APLICAR: cria lançamentos PENDENTES + aprende regras (opcional)
  // =================================================================
  async apply(
    companyId: string,
    statementId: string,
    clientId: string | null,
    learn: boolean,
    items: { bankTransactionId: string; debitAccountId: string; creditAccountId: string }[],
  ) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId },
      include: { transactions: true },
    });
    if (!statement) throw new NotFoundException('Fechamento não encontrado.');

    const txById = new Map(statement.transactions.map((t) => [t.id, t]));
    const linked = await this.prisma.accountingEntry.findMany({
      where: { bankTransactionId: { in: items.map((i) => i.bankTransactionId) } },
      select: { bankTransactionId: true },
    });
    const linkedSet = new Set(linked.map((l) => l.bankTransactionId));
    const effectiveClientId = clientId || statement.clientId || null;

    let created = 0, skipped = 0, learned = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const t = txById.get(item.bankTransactionId);
        if (!t || linkedSet.has(t.id) || !item.debitAccountId || !item.creditAccountId) { skipped++; continue; }
        const amount = Math.abs(Number(t.amount));
        if (!amount) { skipped++; continue; }

        // Partida dobrada espelhada (D = C), status PENDENTE (decisão ADR-107)
        await tx.accountingEntry.create({
          data: {
            companyId,
            clientId: effectiveClientId,
            entryDate: t.date,
            description: t.description,
            counterpartyName: t.counterparty || null,
            debitAccountId: item.debitAccountId,
            creditAccountId: item.creditAccountId,
            debitValue: amount,
            creditValue: amount,
            bankTransactionId: t.id,
            source: 'SUGESTAO_BANCARIA',
            status: 'PENDENTE',
          },
        });
        created++;

        if (learn && effectiveClientId) {
          const pattern = this.normalize(t.counterparty || t.description);
          if (pattern) {
            await tx.counterpartyAccountRule.upsert({
              where: { companyId_clientId_pattern: { companyId, clientId: effectiveClientId, pattern } },
              update: {
                debitAccountId: item.debitAccountId,
                creditAccountId: item.creditAccountId,
                hits: { increment: 1 },
              },
              create: {
                companyId,
                clientId: effectiveClientId,
                pattern,
                debitAccountId: item.debitAccountId,
                creditAccountId: item.creditAccountId,
              },
            });
            learned++;
          }
        }
      }
    });

    return { created, skipped, learned };
  }
}
// =================================================================
// FIM: backend/src/accounting/bank-suggest.service.ts
// =================================================================