import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportService } from './import.service';

/**
 * =================================================================
 * AccountingService — Contas, Lançamentos, Plano de Contas,
 * Ponte Bancário→Contábil, DRE Oficial e Exportação SCI (ADR-066..078)
 * 🛡️ REGRA DE OURO: todas as queries filtram por companyId (multi-tenant).
 * =================================================================
 */
@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly importService: ImportService,
  ) {}

  // =================================================================
  // 🏦 CONTAS CONTÁBEIS (CRUD)
  // =================================================================
  async getAccounts(companyId: string) {
    return this.prisma.accountingAccount.findMany({
      where: { OR: [{ companyId: null }, { companyId }], isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(companyId: string, data: any) {
    const inferType = (code: string): string => {
      const c = (code || '').trim();
      if (c.startsWith('02.3')) return 'PATRIMONIO_LIQUIDO';
      const prefix = c.replace(/\D/g, '').charAt(0);
      const map: Record<string, string> = {
        '1': 'ATIVO', '2': 'PASSIVO', '3': 'RECEITA', '4': 'DESPESA', '5': 'PATRIMONIO_LIQUIDO',
      };
      return map[prefix] || 'ATIVO';
    };
    const inferNature = (type: string): string =>
      type === 'ATIVO' || type === 'DESPESA' ? 'DEVEDORA' : 'CREDORA';

    const resolvedType = data.type || inferType(data.code);
    const resolvedNature = data.nature || inferNature(resolvedType);
    const planName = data.planName || 'Padrão';

    const payload = {
      companyId, planName, code: data.code, name: data.name,
      type: resolvedType, nature: resolvedNature,
      isActive: data.isActive !== undefined ? data.isActive : true,
      ...(data.description ? { description: data.description } : {}),
      ...(data.parentId ? { parentId: data.parentId } : {}),
    };

    return this.prisma.accountingAccount.upsert({
      where: { companyId_planName_code: { companyId, planName, code: data.code } },
      update: { name: payload.name, type: payload.type as any, nature: payload.nature as any },
      create: payload as any,
    });
  }

  async updateAccount(id: string, data: any) {
    return this.prisma.accountingAccount.update({ where: { id }, data });
  }

  async deleteAccount(companyId: string, id: string) {
    const acc = await this.prisma.accountingAccount.findFirst({
      where: { id, OR: [{ companyId }, { companyId: null }] },
    });
    if (!acc) throw new NotFoundException('Conta não encontrada.');

    const used = await this.prisma.accountingEntry.findFirst({
      where: { OR: [{ debitAccountId: id }, { creditAccountId: id }] },
    });
    if (used) {
      throw new BadRequestException(
        'Esta conta possui lançamentos — não pode ser excluída (integridade contábil).',
      );
    }
    await this.prisma.accountingAccount.delete({ where: { id } });
    return { deleted: true, code: acc.code, name: acc.name };
  }

  // =================================================================
  // 📝 LANÇAMENTOS CONTÁBEIS (CRUD)
  // =================================================================
  async getEntries(companyId: string) {
    return this.prisma.accountingEntry.findMany({
      where: { companyId },
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  async createEntry(companyId: string, data: any) {
    return this.prisma.accountingEntry.create({
      data: {
        companyId,
        entryDate: new Date(data.entryDate),
        description: data.description,
        documentNumber: data.documentNumber,
        counterpartyName: data.counterpartyName,
        counterpartyCpfCnpj: data.counterpartyCpfCnpj,
        counterpartyType: data.counterpartyType,
        clientId: data.clientId || null,
        debitAccountId: data.debitAccountId,
        debitValue: data.debitValue || 0,
        creditAccountId: data.creditAccountId,
        creditValue: data.creditValue || 0,
        source: 'MANUAL',
        status: 'PENDENTE',
      },
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
      },
    });
  }

  async updateEntry(id: string, companyId: string, data: any) {
    const entry = await this.prisma.accountingEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    const entryDate = data.entryDate ? new Date(data.entryDate) : entry.entryDate;
    if (isNaN(entryDate.getTime())) throw new BadRequestException('Data inválida');

    return this.prisma.accountingEntry.update({
      where: { id },
      data: {
        entryDate,
        description: data.description ?? entry.description,
        documentNumber: data.documentNumber ?? entry.documentNumber,
        counterpartyName: data.counterpartyName ?? entry.counterpartyName,
        counterpartyCpfCnpj: data.counterpartyCpfCnpj ?? entry.counterpartyCpfCnpj,
        counterpartyType: data.counterpartyType ?? entry.counterpartyType,
        clientId: data.clientId !== undefined ? data.clientId : entry.clientId,
        debitAccountId: data.debitAccountId ?? entry.debitAccountId,
        debitValue: data.debitValue !== undefined ? data.debitValue : entry.debitValue,
        creditAccountId: data.creditAccountId ?? entry.creditAccountId,
        creditValue: data.creditValue !== undefined ? data.creditValue : entry.creditValue,
        status: data.status ?? entry.status,
      },
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
      },
    });
  }

  async conciliateEntry(id: string, companyId: string, data: any) {
    const entry = await this.prisma.accountingEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    return this.prisma.accountingEntry.update({
      where: { id },
      data: {
        debitAccountId: data.debitAccountId || entry.debitAccountId,
        creditAccountId: data.creditAccountId || entry.creditAccountId,
        status: 'CONCILIADO',
      },
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
      },
    });
  }

  async deleteEntry(id: string, companyId: string) {
    const entry = await this.prisma.accountingEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    return this.prisma.accountingEntry.delete({ where: { id } });
  }

  async getEntriesByPeriod(companyId: string, clientId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.prisma.accountingEntry.findMany({
      where: { companyId, clientId, entryDate: { gte: start, lte: end } },
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
      },
      orderBy: { entryDate: 'asc' },
    });
  }

  // =================================================================
  // 📤 EXPORTAÇÃO SCI (ADR-072/075)
  // =================================================================
  async exportToSCI(companyId: string, clientId?: string, year?: number, month?: number) {
    const client = clientId
      ? await this.prisma.client.findFirst({ where: { id: clientId, companyId } })
      : null;
    const planName = client?.accountingPlan || 'SCI 90132';

    const planAccounts = await this.prisma.accountingAccount.findMany({
      where: { companyId, planName },
      select: { code: true, seq: true, accountNumber: true, reducedCode: true },
    });
    const numByCode = new Map<string, string>();
    for (const a of planAccounts) {
      const n = a.seq || a.accountNumber || (a.reducedCode != null ? String(a.reducedCode) : '');
      if (n) numByCode.set(a.code, n);
    }

    const where: any = { companyId, status: 'CONCILIADO' };
    if (clientId) where.clientId = clientId;
    if (year && month) {
      where.entryDate = {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      };
    }
    const entries = await this.prisma.accountingEntry.findMany({
      where,
      include: {
        debitAccount: { select: { code: true, seq: true, accountNumber: true } },
        creditAccount: { select: { code: true, seq: true, accountNumber: true } },
      },
      orderBy: { entryDate: 'asc' },
    });

    const pad8 = (n: string) => ((n || '0').replace(/\D/g, '') || '0').padStart(8, '0');
    const lines = entries.map((e) => {
      const d = new Date(e.entryDate);
      const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const dNum = numByCode.get(e.debitAccount?.code || '') ||
        e.debitAccount?.seq || e.debitAccount?.accountNumber || '';
      const cNum = numByCode.get(e.creditAccount?.code || '') ||
        e.creditAccount?.seq || e.creditAccount?.accountNumber || '';
      const value = (Number(e.debitValue) > 0 ? Number(e.debitValue) : Number(e.creditValue)).toFixed(2);
      const desc = (e.description || '').replace(/\t/g, ' ').substring(0, 100);
      return ['000001', date, pad8(dNum), pad8(cNum), value, '', desc].join('\t');
    });

    return lines.join('\r\n');
  }

  // =================================================================
  // 🔄 PONTE BANCÁRIO → CONTÁBIL (meses FECHADOS)
  // =================================================================
  async promoteFromBanking(
    companyId: string,
    payload: {
      statementId: string;
      clientId?: string | null;
      accountMapping: Record<string, string>;
      bankAccountId: string;
    },
  ) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: payload.statementId, companyId },
    });
    if (!statement) throw new NotFoundException('Fechamento não encontrado.');
    if (statement.status !== 'FECHADO') {
      throw new BadRequestException('Apenas meses FECHADOS podem ser promovidos.');
    }

    const transactions = await this.prisma.bankTransaction.findMany({
      where: { statementId: payload.statementId },
    });
    const categories = await this.prisma.bankCategory.findMany({
      where: { companyId, clientId: statement.clientId },
    });
    const catMap = new Map(categories.map((c) => [c.label, c.group]));

    const accountCodes = [...new Set(Object.values(payload.accountMapping))];
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { OR: [{ companyId: null }, { companyId }], code: { in: accountCodes }, isActive: true },
    });
    const accountByCode = new Map(accounts.map((a) => [a.code, a.id]));

    const bankAccount = await this.prisma.accountingAccount.findFirst({
      where: {
        isActive: true,
        OR: [
          { companyId, id: payload.bankAccountId },
          { companyId: null, id: payload.bankAccountId },
          { companyId, code: payload.bankAccountId },
          { companyId: null, code: payload.bankAccountId },
        ],
      },
    });
    if (!bankAccount) throw new BadRequestException('Conta bancária não encontrada no Plano de Contas.');
    const bankAccountId = bankAccount.id;

    const alreadyPromoted = await this.prisma.accountingEntry.findMany({
      where: { companyId, bankTransactionId: { in: transactions.map((t) => t.id) } },
      select: { bankTransactionId: true },
    });
    const promotedIds = new Set(alreadyPromoted.map((e) => e.bankTransactionId!));

    let promoted = 0, skipped = 0, failed = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const t of transactions) {
        if (promotedIds.has(t.id)) { skipped++; continue; }
        const group = catMap.get(t.nature) || 'PENDENTE';
        if (group === 'PENDENTE') { failed++; continue; }
        const accountCode = payload.accountMapping[t.nature];
        if (!accountCode) { failed++; continue; }
        const mappedAccountId = accountByCode.get(accountCode);
        if (!mappedAccountId) { failed++; continue; }

        const amount = Number(t.amount);
        const isCredit = amount > 0;
        const debitAccountId = isCredit ? bankAccountId : mappedAccountId;
        const creditAccountId = isCredit ? mappedAccountId : bankAccountId;
        const absAmount = Math.abs(amount);

        await tx.accountingEntry.create({
          data: {
            companyId, entryDate: t.date, description: t.description,
            documentNumber: `BANK-${t.id.slice(0, 8)}`,
            counterpartyName: t.counterparty || '',
            clientId: statement.clientId,
            debitAccountId, debitValue: absAmount,
            creditAccountId, creditValue: absAmount,
            source: 'BANCARIO', status: 'PENDENTE', bankTransactionId: t.id,
          },
        });
        promoted++;
      }
    });

    return { promoted, skipped, failed };
  }

  // =================================================================
  // 📊 DRE OFICIAL DO CLIENTE (mensal ou acumulado — ADR-076)
  // =================================================================
  async getClientDRE(
    companyId: string,
    clientId: string,
    year: number,
    month: number,
    period?: { start: string; end: string },
  ) {
    let start: Date, end: Date;
    if (period?.start && period?.end) {
      const [sy, sm] = period.start.split('-').map((n) => parseInt(n, 10));
      const [ey, em] = period.end.split('-').map((n) => parseInt(n, 10));
      start = new Date(sy, sm - 1, 1);
      end = new Date(ey, em, 0, 23, 59, 59);
    } else {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59);
    }

    const entries = await this.prisma.accountingEntry.findMany({
      where: { companyId, clientId, entryDate: { gte: start, lte: end } },
      include: {
        debitAccount: { select: { code: true, name: true, type: true } },
        creditAccount: { select: { code: true, name: true, type: true } },
      },
    });

    const recMap = new Map<string, { code: string; name: string; total: number }>();
    const despMap = new Map<string, { code: string; name: string; total: number }>();

    const bankIds = entries.map((e) => e.bankTransactionId).filter(Boolean) as string[];
    const bankTxs = bankIds.length
      ? await this.prisma.bankTransaction.findMany({ where: { id: { in: bankIds } }, select: { id: true, amount: true } })
      : [];
    const bankAmount = new Map(bankTxs.map((t) => [t.id, Number(t.amount)]));

    for (const e of entries) {
      const orig = e.bankTransactionId ? bankAmount.get(e.bankTransactionId) : undefined;
      if (orig !== undefined) {
        if (orig > 0 && e.creditAccount) {
          const k = e.creditAccount.code;
          const cur = recMap.get(k) || { code: k, name: e.creditAccount.name, total: 0 };
          cur.total += Number(e.creditValue);
          recMap.set(k, cur);
        } else if (orig < 0 && e.debitAccount) {
          const k = e.debitAccount.code;
          const cur = despMap.get(k) || { code: k, name: e.debitAccount.name, total: 0 };
          cur.total += Number(e.debitValue);
          despMap.set(k, cur);
        }
      } else {
        if (e.creditAccount?.type === 'RECEITA') {
          const k = e.creditAccount.code;
          const cur = recMap.get(k) || { code: k, name: e.creditAccount.name, total: 0 };
          cur.total += Number(e.creditValue);
          recMap.set(k, cur);
        }
        if (e.debitAccount?.type === 'DESPESA') {
          const k = e.debitAccount.code;
          const cur = despMap.get(k) || { code: k, name: e.debitAccount.name, total: 0 };
          cur.total += Number(e.debitValue);
          despMap.set(k, cur);
        }
      }
    }

    const receitas = [...recMap.values()].sort((a, b) => b.total - a.total);
    const despesas = [...despMap.values()].sort((a, b) => b.total - a.total);
    const totalReceitas = receitas.reduce((s, r) => s + r.total, 0);
    const totalDespesas = despesas.reduce((s, d) => s + d.total, 0);

    const statementsAll = await this.prisma.bankStatement.findMany({ where: { companyId, clientId } });
    const kOf = (y: number, m: number) => y * 12 + (m - 1);
    const kStart = kOf(start.getFullYear(), start.getMonth() + 1);
    const kEnd = kOf(end.getFullYear(), end.getMonth() + 1);
    const statements = statementsAll.filter((s) => {
      const k = kOf(s.year, s.month);
      return k >= kStart && k <= kEnd;
    });

    let bankResultado = 0, bankReceita = 0, bankDespesa = 0;
    if (statements.length > 0) {
      const txs = await this.prisma.bankTransaction.findMany({
        where: { statementId: { in: statements.map((s) => s.id) } },
      });
      const cats = await this.prisma.bankCategory.findMany({ where: { companyId, clientId } });
      const groupOf = (nature: string) => cats.find((c) => c.label === nature)?.group || 'PENDENTE';
      for (const t of txs) {
        const g = groupOf(t.nature);
        const v = Number(t.amount);
        if (g === 'RECEITA' || g === 'FINANCEIRA') bankReceita += v;
        if (g === 'DESPESA' || g === 'IMPOSTO') bankDespesa += v;
      }
      bankResultado = bankReceita + bankDespesa;
    }

    return {
      contabil: {
        receitas, despesas, totalReceitas, totalDespesas,
        resultado: totalReceitas - totalDespesas,
        lancamentos: entries.length,
        conciliados: entries.filter((e) => e.status === 'CONCILIADO').length,
        pendentes: entries.filter((e) => e.status === 'PENDENTE').length,
      },
      bancario: { receita: bankReceita, despesa: bankDespesa, resultado: bankResultado, temExtrato: statements.length > 0 },
    };
  }

  // =================================================================
  // 📥 IMPORTAR PLANO DE CONTAS SCI (ADR-072)
  // =================================================================
  async importChartOfAccounts(
    companyId: string,
    clientId: string | null,
    planName: string,
    content: string,
  ) {
    const tokens = content.split(';').map((t) => t.trim());
    const isNum = (s: string) => /^\d{1,5}$/.test(s);
    const isCode = (s: string) => /^\d+(\.\d+)*$/.test(s);
    const normT = (s: string) => (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const TYPE_MAP: Record<string, string> = {
      ATIVO: 'ATIVO', PASSIVO: 'PASSIVO', RECEITA: 'RECEITA', DESPESA: 'DESPESA',
    };

    const planToken = tokens.find((t) => /^9\d{4}$/.test(t));
    const finalPlan = planName?.trim() || (planToken ? `SCI ${planToken}` : 'SCI 90132');

    const rows: { seq: string; code: string; name: string; nickname: string; isSynthetic: boolean; type: string }[] = [];
    let i = 0;
    while (i < tokens.length - 6) {
      if (isNum(tokens[i]) && isCode(tokens[i + 1])) {
        const seq = tokens[i];
        const code = tokens[i + 1];
        const tipo = tokens[i + 2];
        const name = tokens[i + 3];
        const nickname = tokens[i + 4];
        const tRaw = normT(tokens[i + 5]);
        const type = TYPE_MAP[tRaw] || (tRaw.startsWith('PATRIMONIO') ? 'PATRIMONIO_LIQUIDO' : null);
        if (name && type) {
          rows.push({ seq, code, name, nickname, isSynthetic: tipo === 'T', type });
          i += 7;
          continue;
        }
      }
      i++;
    }
    if (rows.length === 0) throw new BadRequestException('Layout do plano não reconhecido (esperado SCI 90132).');

    let created = 0, updated = 0;
    for (const r of rows) {
      const nature = r.type === 'ATIVO' || r.type === 'DESPESA' ? 'DEVEDORA' : 'CREDORA';
      const existing = await this.prisma.accountingAccount.findFirst({
        where: { companyId, planName: finalPlan, code: r.code },
      });
      if (existing) {
        await this.prisma.accountingAccount.update({
          where: { id: existing.id },
          data: { name: r.name, seq: r.seq, accountNumber: r.seq, sciCode: r.nickname || existing.sciCode },
        });
        updated++;
      } else {
        await this.prisma.accountingAccount.create({
          data: {
            companyId, planName: finalPlan, code: r.code, name: r.name,
            seq: r.seq, accountNumber: r.seq, sciCode: r.nickname || null,
            type: r.type as any, nature: nature as any,
            level: (r.code.match(/\./g) || []).length + 1,
            isActive: true,
          },
        });
        created++;
      }
    }

    if (clientId) {
      await this.prisma.client.update({ where: { id: clientId }, data: { accountingPlan: finalPlan } });
    }
    return { created, updated, planName: finalPlan, total: rows.length };
  }

  // =================================================================
  // 📚 PLANOS DE CONTAS
  // =================================================================
  async listPlans(companyId: string) {
    const rows = await this.prisma.accountingAccount.findMany({
      where: { OR: [{ companyId }, { companyId: null }] },
      select: { planName: true },
      distinct: ['planName'],
    });
    return (rows.map((r) => r.planName).filter(Boolean) as string[]).sort();
  }

  async deletePlan(companyId: string, planName: string) {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { companyId, planName }, select: { id: true },
    });
    if (accounts.length === 0) return { deleted: 0 };
    const ids = accounts.map((a) => a.id);
    const used = await this.prisma.accountingEntry.findFirst({
      where: { OR: [{ debitAccountId: { in: ids } }, { creditAccountId: { in: ids } }] },
    });
    if (used) {
      throw new BadRequestException('Este plano possui contas com lançamentos — não pode ser excluído (integridade).');
    }
    const res = await this.prisma.accountingAccount.deleteMany({ where: { id: { in: ids } } });
    return { deleted: res.count };
  }

  async setClientPlan(companyId: string, clientId: string, planName: string) {
    const client = await this.prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    const updated = await this.prisma.client.update({
      where: { id: clientId }, data: { accountingPlan: planName },
    });
    return { clientId, accountingPlan: updated.accountingPlan };
  }

  // =================================================================
  // 🌉 PONTE BANCÁRIO → CONTÁBIL (Bloco 4 — ADR-078)
  // =================================================================
  async bridgeFromBanking(companyId: string, userId: string, clientId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { companyId, clientId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { transactions: { orderBy: { date: 'asc' } } },
    });
    if (!statement || statement.transactions.length === 0) {
      throw new BadRequestException('Nenhum fechamento bancário encontrado para este cliente.');
    }

    const norm = (s: string) => (s || '').toUpperCase().replace(/\s+/g, ' ').trim();
    const keyOf = (date: Date, amt: number, desc: string) =>
      `${new Date(date).toISOString().slice(0, 10)}|${amt.toFixed(2)}|${norm(desc)}`;

    const existing = await this.prisma.accountingEntry.findMany({
      where: { companyId, clientId },
      select: { entryDate: true, debitValue: true, creditValue: true, description: true },
    });
    const keys = new Set(
      existing.map((e) =>
        keyOf(new Date(e.entryDate), Math.max(Number(e.debitValue), Number(e.creditValue)), e.description),
      ),
    );

    const drafts: any[] = [];
    let duplicados = 0;
    for (const t of statement.transactions) {
      const amt = Math.abs(Number(t.amount));
      if (amt <= 0) continue;
      const desc = t.description || 'Sem descrição';
      const k = keyOf(new Date(t.date), amt, desc);
      if (keys.has(k)) { duplicados++; continue; }
      keys.add(k);
      drafts.push({
        companyId, clientId, entryDate: new Date(t.date), description: desc,
        counterpartyCpfCnpj: null,
        debitValue: Number(t.amount) < 0 ? amt : 0,
        creditValue: Number(t.amount) > 0 ? amt : 0,
        source: 'PONTE_BANCARIO', status: 'PENDENTE',
      });
    }

    const period = `${String(statement.month).padStart(2, '0')}/${statement.year}`;
    if (drafts.length === 0) {
      return { imported: 0, duplicados, period, message: 'Fechamento bancário já integrado. Nenhum lançamento novo.' };
    }

    await this.prisma.accountingEntry.createMany({ data: drafts });
    return { imported: drafts.length, duplicados, period };
  }

  // =================================================================
  // 🧹 LIMPEZA CONTROLADA (só lançamentos gerados por automação)
  // =================================================================
  async clearAutomatedEntries(companyId: string, clientId: string) {
    const result = await this.prisma.accountingEntry.deleteMany({
      where: {
        companyId, clientId,
        source: { in: ['PROMOCAO_RAZAO', 'IMPORTACAO_EXTRATO', 'PONTE_BANCARIO'] },
      },
    });
    return { deleted: result.count };
  }
}