// =================================================================
// INÍCIO: accounting.service.ts
// =================================================================
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(companyId: string) {
    return this.prisma.accountingAccount.findMany({
      where: {
        OR: [{ companyId: null }, { companyId }],
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(companyId: string, data: any) {
    return this.prisma.accountingAccount.create({ data: { companyId, ...data } });
  }

  async updateAccount(id: string, data: any) {
    return this.prisma.accountingAccount.update({ where: { id }, data });
  }

  async deleteAccount(id: string) {
    return this.prisma.accountingAccount.update({ where: { id }, data: { isActive: false } });
  }

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

// =================================================================
// INÍCIO: Método updateEntry (CORRIGIDO)
// =================================================================
async updateEntry(id: string, companyId: string, data: any) {
  // Busca o lançamento existente para preservar campos não enviados
  const entry = await this.prisma.accountingEntry.findFirst({ 
    where: { id, companyId } 
  });
  if (!entry) throw new NotFoundException('Lançamento não encontrado');

  // ✅ CORREÇÃO: Só atualiza entryDate se foi enviado e é válido
  const entryDate = data.entryDate ? new Date(data.entryDate) : entry.entryDate;
  
  // Valida se a data é válida
  if (isNaN(entryDate.getTime())) {
    throw new BadRequestException('Data inválida');
  }

  return this.prisma.accountingEntry.update({
    where: { id },
    data: {
      entryDate: entryDate, // ✅ Usa a data existente se não foi enviada
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
  // =================================================================
  // INÍCIO: Método conciliateEntry
  // =================================================================
  async conciliateEntry(id: string, companyId: string, data: any) {
    const entry = await this.prisma.accountingEntry.findFirst({ 
      where: { id, companyId } 
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
  // =================================================================
  // FIM: Método conciliateEntry
  // =================================================================
// =================================================================
// FIM: Método updateEntry
// =================================================================

  async deleteEntry(id: string, companyId: string) {
    const entry = await this.prisma.accountingEntry.findFirst({ where: { id, companyId } });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');
    return this.prisma.accountingEntry.delete({ where: { id } });
  }

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
      const description = (entry.description || 'Lançamento Importado').substring(0, 100).replace(/,/g, ' ');
      return `${date},${debitCode},${creditCode},${value},,${description},,,,`;
    });

    return lines.join('\n');
  }
}
// =================================================================
// FIM: accounting.service.ts
// =================================================================