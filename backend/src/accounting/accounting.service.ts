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
  async createAccount(companyId: string, data: any) {
    // Inferência do tipo pelo primeiro dígito do código
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

    // Inferência da natureza pelo tipo
    const inferNature = (type: string): string => {
      if (type === 'ATIVO' || type === 'DESPESA') return 'DEVEDORA';
      return 'CREDORA'; // PASSIVO, PATRIMONIO_LIQUIDO, RECEITA
    };

    const resolvedType = data.type || inferType(data.code);
    const resolvedNature = data.nature || inferNature(resolvedType);

    // Cast `as any` resolve a incompatibilidade de enums do Prisma
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

    return this.prisma.accountingAccount.create({ data: payload as any });
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
    accountCodes.push(payload.bankAccountId);

    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        OR: [{ companyId: null }, { companyId }],
        code: { in: accountCodes },
        isActive: true,
      },
    });
    const accountByCode = new Map(accounts.map((a) => [a.code, a.id]));

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

        // Resolve conta bancária
        const bankAccountId = accountByCode.get(payload.bankAccountId);
        if (!bankAccountId) {
          failed++;
          continue;
        }

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
}
// =================================================================
// FIM: accounting.service.ts
// =================================================================