import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // CONTAS CONTÁBEIS
  // =================================================================
    // =================================================================
  // CONTAS CONTÁBEIS
  // =================================================================
  async getAccounts(companyId: string) {
    // Busca contas globais (companyId: null) + contas específicas da empresa
    return this.prisma.accountingAccount.findMany({
      where: {
        OR: [
          { companyId: null }, // 🔥 Contas globais/padrão (SCI 90113)
          { companyId: companyId } // Contas específicas da empresa
        ],
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(companyId: string, data: any) {
    return this.prisma.accountingAccount.create({
      data: { companyId, ...data },
    });
  }

  async updateAccount(id: string, data: any) {
    return this.prisma.accountingAccount.update({
      where: { id },
      data,
    });
  }

  async deleteAccount(id: string) {
    return this.prisma.accountingAccount.update({
      where: { id },
      data: { isActive: false }, // Soft delete
    });
  }

  // =================================================================
  // LANÇAMENTOS CONTÁBEIS
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
    // Verifica se pertence à empresa
    const entry = await this.prisma.accountingEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    return this.prisma.accountingEntry.update({
      where: { id },
      data: {
        entryDate: new Date(data.entryDate),
        description: data.description,
        documentNumber: data.documentNumber,
        counterpartyName: data.counterpartyName,
        counterpartyCpfCnpj: data.counterpartyCpfCnpj,
        counterpartyType: data.counterpartyType,
        debitAccountId: data.debitAccountId,
        debitValue: data.debitValue || 0,
        creditAccountId: data.creditAccountId,
        creditValue: data.creditValue || 0,
        status: data.status,
      },
      include: {
        debitAccount: { select: { code: true, name: true } },
        creditAccount: { select: { code: true, name: true } },
      },
    });
  }

  async deleteEntry(id: string, companyId: string) {
    const entry = await this.prisma.accountingEntry.findFirst({
      where: { id, companyId },
    });
    if (!entry) throw new NotFoundException('Lançamento não encontrado');

    return this.prisma.accountingEntry.delete({
      where: { id },
    });
  }
}