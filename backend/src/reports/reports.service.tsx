// =================================================================
// ARQUIVO: backend/src/reports/reports.service.ts
// =================================================================
// Serviço de geração de relatórios PDF (ADR-097)
// Gera PDFs white-label usando @react-pdf/renderer
// Armazena em: backend/uploads/reports/{companyId}/{period}/
// =================================================================
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { renderToBuffer } from '@react-pdf/renderer';
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';
import { DreDocument } from './templates/DreDocument';
import { ProposalDocument } from './templates/ProposalDocument';
import { BalanceteDocument } from './templates/BalanceteDocument';

@Injectable()
export class ReportsService {
  private readonly uploadsDir = path.join(
    process.cwd(),
    'uploads',
    'reports',
  );

  constructor(private readonly prisma: PrismaService) {
    // Garante que o diretório existe
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Gera PDF do DRE do cliente para o último mês com dados.
   * Salva em disco e registra em MonthlyReport.
   */
  async generateDrePdf(companyId: string, clientId: string) {
    // 1. Busca dados do cliente e do escritório
    const [client, company] = await Promise.all([
      this.prisma.client.findFirst({
        where: { id: clientId, companyId, deletedAt: null },
      }),
      this.prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (!company) throw new NotFoundException('Empresa não encontrada');

    // 2. Busca último mês com lançamentos
    const lastEntry = await this.prisma.accountingEntry.findFirst({
      where: { clientId },
      orderBy: { entryDate: 'desc' },
      select: { entryDate: true },
    });

    if (!lastEntry) {
      throw new NotFoundException(
        'Nenhum lançamento contábil encontrado para este cliente',
      );
    }

    // 3. Calcula período
    const lastDate = new Date(lastEntry.entryDate);
    const year = lastDate.getFullYear();
    const month = lastDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const period = `${year}-${String(month + 1).padStart(2, '0')}`;
    const periodLabel = lastDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    // 4. Busca contas e agrega valores
    const [receitaAccounts, despesaAccounts] = await Promise.all([
      this.prisma.accountingAccount.findMany({
        where: { companyId, type: 'RECEITA' },
        select: { id: true },
      }),
      this.prisma.accountingAccount.findMany({
        where: { companyId, type: 'DESPESA' },
        select: { id: true },
      }),
    ]);

    const receitaIds = receitaAccounts.map((a) => a.id);
    const despesaIds = despesaAccounts.map((a) => a.id);

    const [receitas, despesas] = await Promise.all([
      this.prisma.accountingEntry.aggregate({
        where: {
          clientId,
          entryDate: { gte: firstDay, lte: lastDay },
          creditAccountId: { in: receitaIds },
        },
        _sum: { creditValue: true },
      }),
      this.prisma.accountingEntry.aggregate({
        where: {
          clientId,
          entryDate: { gte: firstDay, lte: lastDay },
          debitAccountId: { in: despesaIds },
        },
        _sum: { debitValue: true },
      }),
    ]);

    const totalReceitas = Number(receitas._sum.creditValue || 0);
    const totalDespesas = Number(despesas._sum.debitValue || 0);
    const resultado = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0;

    // 5. Renderiza PDF
const pdfBuffer = await renderToBuffer(
  <DreDocument
    companyName={client.companyName}
    cnpj={client.cnpj}
    period={period}
    periodLabel={periodLabel}
    receitas={totalReceitas}
    despesas={totalDespesas}
    resultado={resultado}
    margem={margem}
    primaryColor={company.primaryColor || '#0d9488'}
    secondaryColor={company.secondaryColor || '#f97316'}
    officeName={company.name}
    officeCnpj={company.cnpj}
  />,
);

    // 6. Salva em disco
    const periodDir = path.join(this.uploadsDir, companyId, period);
    if (!fs.existsSync(periodDir)) {
      fs.mkdirSync(periodDir, { recursive: true });
    }
    const fileName = `DRE_${client.companyName.replace(/\s+/g, '_')}_${period}.pdf`;
    const filePath = path.join(periodDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // 7. Registra em MonthlyReport (para aparecer no portal)
    const relativePath = path.join('reports', companyId, period, fileName);
    const report = await this.prisma.monthlyReport.upsert({
      where: {
        companyId_clientId_period: { companyId, clientId, period },
      },
      update: {
        pdfPath: relativePath,
        status: 'READY',
        summary: {
          receitas: totalReceitas,
          despesas: totalDespesas,
          resultado,
          margem,
        },
      },
      create: {
        companyId,
        clientId,
        period,
        pdfPath: relativePath,
        status: 'READY',
        summary: {
          receitas: totalReceitas,
          despesas: totalDespesas,
          resultado,
          margem,
        },
      },
    });

    return {
      reportId: report.id,
      fileName,
      filePath: relativePath,
      period,
      totalReceitas,
      totalDespesas,
      resultado,
      margem,
    };
  }

  /**
   * Gera PDF da Proposta Comercial.
   */
  async generateProposalPdf(companyId: string, proposalId: string) {
    const [proposal, company] = await Promise.all([
      this.prisma.proposal.findFirst({
        where: { id: proposalId, companyId },
      }),
      this.prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    if (!proposal) throw new NotFoundException('Proposta não encontrada');
    if (!company) throw new NotFoundException('Empresa não encontrada');

const pdfBuffer = await renderToBuffer(
  <ProposalDocument
    proposalNumber={proposal.proposalNumber}
    clientName={proposal.clientName}
    clientCnpj={proposal.clientCnpj}
    basePrice={proposal.basePrice}
    aboutOffice={proposal.aboutOffice}
    differentials={proposal.differentials}
    commercialTerms={proposal.commercialTerms}
    primaryColor={company.primaryColor || '#0d9488'}
    secondaryColor={company.secondaryColor || '#f97316'}
    officeName={company.name}
  />,
);

    const periodDir = path.join(this.uploadsDir, companyId, 'propostas');
    if (!fs.existsSync(periodDir)) {
      fs.mkdirSync(periodDir, { recursive: true });
    }
    const fileName = `Proposta_${proposal.proposalNumber}.pdf`;
    const filePath = path.join(periodDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath: path.join('reports', companyId, 'propostas', fileName),
    };
  }
    /**
   * 🆕 Gera PDF do Balancete Patrimonial do cliente (ADR-098).
   * Agrega AccountingEntry por conta e agrupa por AccountType.
   */
  async generateBalancetePdf(companyId: string, clientId: string) {
    // 1. Busca dados do cliente e do escritório
    const [client, company] = await Promise.all([
      this.prisma.client.findFirst({
        where: { id: clientId, companyId, deletedAt: null },
      }),
      this.prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (!company) throw new NotFoundException('Empresa não encontrada');

    // 2. Busca último mês com lançamentos
    const lastEntry = await this.prisma.accountingEntry.findFirst({
      where: { clientId },
      orderBy: { entryDate: 'desc' },
      select: { entryDate: true },
    });

    if (!lastEntry) {
      throw new NotFoundException(
        'Nenhum lançamento contábil encontrado para este cliente',
      );
    }

    const lastDate = new Date(lastEntry.entryDate);
    const year = lastDate.getFullYear();
    const month = lastDate.getMonth();
    const cutoffDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const period = `${year}-${String(month + 1).padStart(2, '0')}`;
    const periodLabel = lastDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    // 3. Busca todas as contas do tenant (ATIVO, PASSIVO, PATRIMONIO_LIQUIDO)
    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        companyId,
        type: { in: ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO'] },
        isActive: true,
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    if (accounts.length === 0) {
      throw new NotFoundException(
        'Nenhuma conta patrimonial cadastrada para este escritório',
      );
    }

    const accountIds = accounts.map((a) => a.id);

    // 4. Agrega débitos e créditos por conta (até a data de corte)
    const [debits, credits] = await Promise.all([
      this.prisma.accountingEntry.groupBy({
        by: ['debitAccountId'],
        where: {
          clientId,
          entryDate: { lte: cutoffDate },
          debitAccountId: { in: accountIds },
        },
        _sum: { debitValue: true },
      }),
      this.prisma.accountingEntry.groupBy({
        by: ['creditAccountId'],
        where: {
          clientId,
          entryDate: { lte: cutoffDate },
          creditAccountId: { in: accountIds },
        },
        _sum: { creditValue: true },
      }),
    ]);

    // 5. Monta mapa de saldos por conta
    const debitMap = new Map<string, number>();
    debits.forEach((d) => {
      if (d.debitAccountId) debitMap.set(d.debitAccountId, Number(d._sum.debitValue || 0));
    });
    const creditMap = new Map<string, number>();
    credits.forEach((c) => {
      if (c.creditAccountId) creditMap.set(c.creditAccountId, Number(c._sum.creditValue || 0));
    });

    // 6. Constrói lista de contas com saldos
    const balanceteAccounts = accounts.map((acc) => {
      const saldoDevedor = debitMap.get(acc.id) || 0;
      const saldoCredor = creditMap.get(acc.id) || 0;
      // Natureza: ATIVO = devedora; PASSIVO/PL = credora
      const saldoLiquido =
        acc.type === 'ATIVO'
          ? saldoDevedor - saldoCredor
          : saldoCredor - saldoDevedor;

      return {
        code: acc.code || acc.sciCode || acc.accountNumber || '—',
        name: acc.name,
        type: acc.type,
        level: acc.level || 1,
        saldoDevedor,
        saldoCredor,
        saldoLiquido,
      };
    });

    // 7. Calcula totais
    const totalAtivo = balanceteAccounts
      .filter((a) => a.type === 'ATIVO')
      .reduce((sum, a) => sum + a.saldoLiquido, 0);
    const totalPassivo = balanceteAccounts
      .filter((a) => a.type === 'PASSIVO')
      .reduce((sum, a) => sum + a.saldoLiquido, 0);
    const totalPL = balanceteAccounts
      .filter((a) => a.type === 'PATRIMONIO_LIQUIDO')
      .reduce((sum, a) => sum + a.saldoLiquido, 0);

    // 8. Renderiza PDF
const pdfBuffer = await renderToBuffer(
  <BalanceteDocument
    companyName={client.companyName}
    cnpj={client.cnpj}
    period={period}
    periodLabel={periodLabel}
    accounts={balanceteAccounts}
    totalAtivo={totalAtivo}
    totalPassivo={totalPassivo}
    totalPL={totalPL}
    primaryColor={company.primaryColor || '#0d9488'}
    secondaryColor={company.secondaryColor || '#f97316'}
    officeName={company.name}
    officeCnpj={company.cnpj}
  />,
);

    // 9. Salva em disco
    const periodDir = path.join(this.uploadsDir, companyId, period);
    if (!fs.existsSync(periodDir)) {
      fs.mkdirSync(periodDir, { recursive: true });
    }
    const fileName = `Balancete_${client.companyName.replace(/\s+/g, '_')}_${period}.pdf`;
    const filePath = path.join(periodDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    const relativePath = path.join('reports', companyId, period, fileName);

    return {
      fileName,
      filePath: relativePath,
      period,
      totalAtivo,
      totalPassivo,
      totalPL,
      totalAccounts: balanceteAccounts.length,
    };
  }
}