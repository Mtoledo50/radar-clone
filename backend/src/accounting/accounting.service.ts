// =================================================================
// INÍCIO: accounting.service.ts
// =================================================================
/**
 * AccountingService
 * Gerencia toda a lógica de contabilidade: contas, lançamentos,
 * conciliação, exportação SCI e promoção bancária.
 * 
 * 🆕 Sprint 25.2: ponte Bancário → Contábil com partida dobrada
 * 🆕 Sprint 25.2.1: inferência automática de type + nature
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 🏦 CONTAS CONTÁBEIS (CRUD)
  // =================================================================

  /**
   * Lista todas as contas ativas (globais + específicas da empresa)
   */
  async getAccounts(companyId: string) {
    return this.prisma.accountingAccount.findMany({
      where: {
        OR: [{ companyId: null }, { companyId }],
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * 🆕 Sprint 25.2.1: cria conta contábil com inferência automática de
   * `type` (AccountType) e `nature` (AccountNature) pelo prefixo do código.
   *
   * Enum AccountType:   ATIVO | PASSIVO | PATRIMONIO_LIQUIDO | RECEITA | DESPESA
   * Enum AccountNature: DEVEDORA | CREDORA
   *
   * Regra contábil:
   *   ATIVO + DESPESA          → DEVEDORA (saldo cresce no débito)
   *   PASSIVO + PL + RECEITA   → CREDORA  (saldo cresce no crédito)
   */
    /**
   * 🆕 Sprint 25.2.1: cria conta contábil com inferência automática de
   * `type` e `nature` + IDEMPOTÊNCIA (upsert por companyId+code).
   *
   * Comportamento:
   *   - Se a conta já existe → retorna a existente (sem erro)
   *   - Se não existe → cria com type/nature inferidos pelo prefixo
   *
   * Regra contábil:
   *   ATIVO + DESPESA          → DEVEDORA
   *   PASSIVO + PL + RECEITA   → CREDORA
   */
  async createAccount(companyId: string, data: any) {
    const inferType = (code: string): string => {
      const prefix = (code || '').replace(/\D/g, '').charAt(0);
      const map: Record<string, string> = {
        '1': 'ATIVO',
        '2': 'PASSIVO',
        '3': 'PATRIMONIO_LIQUIDO',
        '4': 'RECEITA',
        '5': 'DESPESA',
      };
      return map[prefix] || 'ATIVO';
    };

    const inferNature = (type: string): string => {
      if (type === 'ATIVO' || type === 'DESPESA') return 'DEVEDORA';
      return 'CREDORA';
    };

    const resolvedType = data.type || inferType(data.code);
    const resolvedNature = data.nature || inferNature(resolvedType);

    const payload = {
      companyId,
      code: data.code,
      name: data.name,
      type: resolvedType,
      nature: resolvedNature,
      isActive: data.isActive !== undefined ? data.isActive : true,
      ...(data.description ? { description: data.description } : {}),
      ...(data.parentId ? { parentId: data.parentId } : {}),
    };

    // 🆕 UPSERT idempotente: cria se não existe, retorna se já existe
    return this.prisma.accountingAccount.upsert({
      where: {
        companyId_code: { companyId, code: data.code },
      },
      update: {
        // Se já existe, só atualiza o nome (permite renomear sem perder vínculo)
        name: payload.name,
        type: payload.type as any,
        nature: payload.nature as any,
      },
      create: payload as any,
    });
  }

  /**
   * Atualiza os dados de uma conta contábil
   */
  async updateAccount(id: string, data: any) {
    return this.prisma.accountingAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete: marca a conta como inativa (não exclui do banco)
   */
  async deleteAccount(id: string) {
    return this.prisma.accountingAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // =================================================================
  // 📝 LANÇAMENTOS CONTÁBEIS (CRUD)
  // =================================================================

  /**
   * Lista todos os lançamentos da empresa, incluindo nomes das contas
   */
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

  /**
   * Cria um lançamento contábil manual
   */
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

  /**
   * Atualiza lançamento existente (preserva campos não enviados)
   */
  async updateEntry(id: string, companyId: string, data: any) {
    const entry = await this.prisma.accountingEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    const entryDate = data.entryDate ? new Date(data.entryDate) : entry.entryDate;
    if (isNaN(entryDate.getTime())) {
      throw new BadRequestException('Data inválida');
    }

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

  /**
   * Concilia um lançamento: atualiza contas e marca status como CONCILIADO
   */
  async conciliateEntry(id: string, companyId: string, data: any) {
    const entry = await this.prisma.accountingEntry.findFirst({
      where: { id, companyId },
    });
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

  /**
   * Exclui permanentemente um lançamento
   */
  async deleteEntry(id: string, companyId: string) {
    const entry = await this.prisma.accountingEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    return this.prisma.accountingEntry.delete({ where: { id } });
  }

  // =================================================================
  // 📤 EXPORTAÇÃO SCI
  // =================================================================

  /**
   * Gera arquivo de texto formatado para importação no SCI.
   * Aceita filtros opcionais de ano/mês.
   */
  async exportToSCI(companyId: string, year?: number, month?: number) {
    const where: any = { companyId, status: 'CONCILIADO' };
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      where.entryDate = { gte: startDate, lte: endDate };
    }

    const entries = await this.prisma.accountingEntry.findMany({
      where,
      include: { debitAccount: true, creditAccount: true },
      orderBy: { entryDate: 'asc' },
    });

    const lines = entries.map((entry) => {
      const date = new Date(entry.entryDate).toLocaleDateString('pt-BR');
      const debitCode = entry.debitAccount?.code?.replace(/\D/g, '') || '0';
      const creditCode = entry.creditAccount?.code?.replace(/\D/g, '') || '0';
      const debitVal = Number(entry.debitValue);
      const creditVal = Number(entry.creditValue);
      const value = (debitVal > 0 ? debitVal : creditVal).toFixed(2);
      const description = (entry.description || 'Lançamento Importado')
        .substring(0, 100)
        .replace(/,/g, ' ');
      return `${date},${debitCode},${creditCode},${value},,${description},,,,`;
    });

    return lines.join('\n');
  }

  // =================================================================
  // 🆕 SPRINT 25.2: PROMOVER TRANSAÇÕES BANCÁRIAS → CONTÁBIL
  // =================================================================
  /**
   * Transforma transações bancárias de um mês FECHADO em lançamentos
   * contábeis de partida dobrada.
   *
   * 🛡️ Regras:
   *   - Idempotente: ignora transações já promovidas (sem duplicar)
   *   - Rastreável: `bankTransactionId` vincula ao extrato original
   *   - Partida dobrada automática:
   *       • Crédito bancário → D Banco / C Receita
   *       • Débito bancário  → D Despesa / C Banco
   *   - Só aceita meses com status = FECHADO
   */
  async promoteFromBanking(
    companyId: string,
    payload: {
      statementId: string;
      clientId?: string | null;
      accountMapping: Record<string, string>; // natureza → código contábil
      bankAccountId: string; // ID da conta bancária (Caixa)
    },
  ) {
    // 1. Valida o fechamento
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: payload.statementId, companyId },
    });
    if (!statement) throw new NotFoundException('Fechamento não encontrado.');
    if (statement.status !== 'FECHADO') {
      throw new BadRequestException('Apenas meses FECHADOS podem ser promovidos.');
    }

    // 2. Busca todas as transações do mês
    const transactions = await this.prisma.bankTransaction.findMany({
      where: { statementId: payload.statementId },
    });

    // 3. Resolve categoria → grupo DRE
    const categories = await this.prisma.bankCategory.findMany({
      where: { companyId, clientId: statement.clientId },
    });
    const catMap = new Map(categories.map((c) => [c.label, c.group]));

    // 4. Busca todas as contas contábeis necessárias pelo código
      const accountCodes = [...new Set(Object.values(payload.accountMapping))];

    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        OR: [{ companyId: null }, { companyId }],
        code: { in: accountCodes },
        isActive: true,
      },
    });
    const accountByCode = new Map(accounts.map((a) => [a.code, a.id]));

    // 🆕 26.1: conta bancária chega como ID (combobox) — resolve por ID ou código
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
    if (!bankAccount) {
      throw new BadRequestException('Conta bancária não encontrada no Plano de Contas.');
    }
    const bankAccountId = bankAccount.id;

    // 5. Identifica transações já promovidas (idempotência)
    const alreadyPromoted = await this.prisma.accountingEntry.findMany({
      where: {
        companyId,
        bankTransactionId: { in: transactions.map((t) => t.id) },
      },
      select: { bankTransactionId: true },
    });
    const promotedIds = new Set(alreadyPromoted.map((e) => e.bankTransactionId!));

    // 6. Processa cada transação em uma transação ACID
    let promoted = 0;
    let skipped = 0;
    let failed = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const t of transactions) {
        // Já promovida anteriormente
        if (promotedIds.has(t.id)) {
          skipped++;
          continue;
        }

        // Resolve grupo da categoria
        const group = catMap.get(t.nature) || 'PENDENTE';
        if (group === 'PENDENTE') {
          failed++;
          continue;
        }

        // Resolve conta contábil mapeada
        const accountCode = payload.accountMapping[t.nature];
        if (!accountCode) {
          failed++;
          continue;
        }
        const mappedAccountId = accountByCode.get(accountCode);
        if (!mappedAccountId) {
          failed++;
          continue;
        }

              // bankAccountId já resolvido acima (por ID ou código)

        // Partida dobrada
        const amount = Number(t.amount);
        const isCredit = amount > 0;
        const debitAccountId = isCredit ? bankAccountId : mappedAccountId;
        const creditAccountId = isCredit ? mappedAccountId : bankAccountId;
        const absAmount = Math.abs(amount);

        await tx.accountingEntry.create({
          data: {
            companyId,
            entryDate: t.date,
            description: t.description,
            documentNumber: `BANK-${t.id.slice(0, 8)}`,
            counterpartyName: t.counterparty || '',
            clientId: statement.clientId,
            debitAccountId,
            debitValue: absAmount,
            creditAccountId,
            creditValue: absAmount,
            source: 'BANCARIO',
            status: 'PENDENTE',
            bankTransactionId: t.id,
          },
        });

        promoted++;
      }
    });

    return { promoted, skipped, failed };
  }
    // =================================================================
  // 🆕 SPRINT 26: DRE OFICIAL DO CLIENTE (lançamentos promovidos)
  // =================================================================
  /**
   * Agrega AccountingEntry do cliente no mês por tipo de conta:
   *   • Receitas  = contas tipo RECEITA creditadas
   *   • Despesas  = contas tipo DESPESA debitadas
   * E retorna o confronto com o DRE bancário (gerencial) do mesmo mês.
   */
  async getClientDRE(
    companyId: string,
    clientId: string,
    year: number,
    month: number,
  ) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    // 1. Lançamentos contábeis do cliente no mês
    const entries = await this.prisma.accountingEntry.findMany({
      where: { companyId, clientId, entryDate: { gte: start, lte: end } },
      include: {
        debitAccount: { select: { code: true, name: true, type: true } },
        creditAccount: { select: { code: true, name: true, type: true } },
      },
    });

      const recMap = new Map<string, { code: string; name: string; total: number }>();
    const despMap = new Map<string, { code: string; name: string; total: number }>();

    // 🆕 26.1: lançamentos promovidos classificam pelo SINAL da transação
    // bancária original (crédito → receita / débito → despesa), independente
    // da convenção do plano de contas. Manuais caem no tipo da conta.
    const bankIds = entries.map((e) => e.bankTransactionId).filter(Boolean) as string[];
    const bankTxs = bankIds.length
      ? await this.prisma.bankTransaction.findMany({
          where: { id: { in: bankIds } },
          select: { id: true, amount: true },
        })
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

    // 2. Confronto com o DRE BANCÁRIO (gerencial) do mesmo mês
    const statements = await this.prisma.bankStatement.findMany({
      where: { companyId, clientId, year, month },
    });
    let bankResultado = 0;
    let bankReceita = 0;
    let bankDespesa = 0;
    if (statements.length > 0) {
      const txs = await this.prisma.bankTransaction.findMany({
        where: { statementId: { in: statements.map((s) => s.id) } },
      });
      const cats = await this.prisma.bankCategory.findMany({
        where: { companyId, clientId },
      });
      const groupOf = (nature: string) =>
        cats.find((c) => c.label === nature)?.group || 'PENDENTE';
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
        receitas,
        despesas,
        totalReceitas,
        totalDespesas,
        resultado: totalReceitas - totalDespesas,
        lancamentos: entries.length,
        conciliados: entries.filter((e) => e.status === 'CONCILIADO').length,
        pendentes: entries.filter((e) => e.status === 'PENDENTE').length,
      },
      bancario: {
        receita: bankReceita,
        despesa: bankDespesa,
        resultado: bankResultado,
        temExtrato: statements.length > 0,
      },
    };
  }
}
// =================================================================
// FIM: accounting.service.ts
// =================================================================