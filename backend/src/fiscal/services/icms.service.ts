import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 🧮 IcmsService — Apuração de ICMS Mensal
 * =================================================================
 * Gerencia o fechamento mensal do ICMS (créditos das compras × débitos
 * das vendas) por empresa (tenant) e opcionalmente por cliente.
 *
 * 🆕 Sprint 8: Suporte completo a `clientId`:
 *   - Chave única composta: companyId + clientId + year + month
 *   - Créditos calculados apenas das NF-e do cliente selecionado
 *   - Apurações segregadas por cliente
 *
 * 🛡️ Regras fiscais:
 * - Mês FECHADO não pode ser editado (integridade do SPED)
 * - Créditos são recalculados automaticamente das NF-e de entrada
 * - Débitos são informados manualmente (vendas × alíquota)
 * =================================================================
 */
@Injectable()
export class IcmsService {
  constructor(private readonly prisma: PrismaService) {}

  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  private monthRange(year: number, month: number) {
    return {
      gte: new Date(year, month - 1, 1, 0, 0, 0),
      lt: new Date(year, month, 1, 0, 0, 0),
    };
  }

  /**
   * Calcula créditos automáticos das NF-e de entrada no mês.
   * 🆕 Sprint 8: filtra por clientId se fornecido.
   */
  private async computeCredits(
    companyId: string,
    year: number,
    month: number,
    clientId?: string, // 🆕 Sprint 8
  ) {
    const where: Prisma.FiscalInvoiceWhereInput = {
      companyId,
      status: { in: ['PARSED', 'CONFIRMED'] },
      emissionDate: this.monthRange(year, month),
    };
    if (clientId) {
      where.clientId = clientId; // 🆕 Sprint 8
    }

    const invoices = await this.prisma.fiscalInvoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        series: true,
        emissionDate: true,
        totalValue: true,
        icmsValue: true,
        icmsStValue: true,
        supplier: { select: { name: true, cnpj: true } },
      },
      orderBy: { emissionDate: 'asc' },
    });

    let creditsIcms = 0;
    let creditsSt = 0;
    let purchasesValue = 0;

    for (const inv of invoices) {
      creditsIcms += Number(inv.icmsValue);
      creditsSt += Number(inv.icmsStValue);
      purchasesValue += Number(inv.totalValue);
    }

    return {
      invoicesCount: invoices.length,
      purchasesValue: this.round2(purchasesValue),
      creditsIcms: this.round2(creditsIcms),
      creditsIcmsSt: this.round2(creditsSt),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        series: inv.series,
        emissionDate: inv.emissionDate,
        totalValue: Number(inv.totalValue),
        icmsValue: Number(inv.icmsValue),
        icmsStValue: Number(inv.icmsStValue),
        supplier: inv.supplier,
      })),
    };
  }

  /**
   * Resumo anual dos 12 meses com totais de créditos, débitos e saldo.
   * 🆕 Sprint 8: filtra por clientId se fornecido.
   */
  async getYearSummary(
    companyId: string,
    year: number,
    clientId?: string, // 🆕 Sprint 8
  ) {
    const range = {
      gte: new Date(year, 0, 1, 0, 0, 0),
      lt: new Date(year + 1, 0, 1, 0, 0, 0),
    };

    const invWhere: Prisma.FiscalInvoiceWhereInput = {
      companyId,
      status: { in: ['PARSED', 'CONFIRMED'] },
      emissionDate: range,
    };
    if (clientId) {
      invWhere.clientId = clientId; // 🆕 Sprint 8
    }

    const [invoices, apurations] = await Promise.all([
      this.prisma.fiscalInvoice.findMany({
        where: invWhere,
        select: {
          emissionDate: true,
          totalValue: true,
          icmsValue: true,
          icmsStValue: true,
        },
      }),
      this.prisma.fiscalIcmsApuration.findMany({
        where: {
          companyId,
          year,
          ...(clientId && { clientId }), // 🆕 Sprint 8
        },
      }),
    ]);

    const apurByMonth = new Map(apurations.map((a) => [a.month, a]));
    let totalCredits = 0;
    let totalDebits = 0;

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const invs = invoices.filter(
        (inv) => new Date(inv.emissionDate).getMonth() === i,
      );

      const creditsIcms = this.round2(
        invs.reduce((s, inv) => s + Number(inv.icmsValue), 0),
      );
      const creditsSt = this.round2(
        invs.reduce((s, inv) => s + Number(inv.icmsStValue), 0),
      );
      const purchasesValue = this.round2(
        invs.reduce((s, inv) => s + Number(inv.totalValue), 0),
      );

      const apur = apurByMonth.get(month);
      const debitsIcms = Number(apur?.debitsIcms ?? 0);
      const balance = this.round2(debitsIcms - creditsIcms);

      totalCredits += creditsIcms;
      totalDebits += debitsIcms;

      return {
        month,
        invoicesCount: invs.length,
        purchasesValue,
        creditsIcms,
        creditsIcmsSt: creditsSt,
        salesValue: Number(apur?.salesValue ?? 0),
        debitRate: Number(apur?.debitRate ?? 0),
        debitsIcms,
        balance,
        status: apur?.status ?? 'ABERTA',
      };
    });

    return {
      year,
      totalCredits: this.round2(totalCredits),
      totalDebits: this.round2(totalDebits),
      totalBalance: this.round2(totalDebits - totalCredits),
      months,
    };
  }

  /**
   * Detalhe completo de um mês específico.
   * 🆕 Sprint 8: usa chave composta companyId_clientId_year_month.
   */
  async getDetail(
    companyId: string,
    year: number,
    month: number,
    clientId?: string, // 🆕 Sprint 8
  ) {
    this.validateMonth(month);

    const credits = await this.computeCredits(companyId, year, month, clientId);

    const apuration = await this.prisma.fiscalIcmsApuration.findUnique({
      where: {
        companyId_clientId_year_month: { // 🆕 Sprint 8: chave composta
          companyId,
          clientId: clientId || null,
          year,
          month,
        },
      },
    });

    const salesValue = Number(apuration?.salesValue ?? 0);
    const debitRate = Number(apuration?.debitRate ?? 0);
    const debitsIcms = this.round2((salesValue * debitRate) / 100);
    const balance = this.round2(debitsIcms - credits.creditsIcms);

    return {
      year,
      month,
      ...credits,
      salesValue,
      debitRate,
      debitsIcms,
      balance,
      status: apuration?.status ?? 'ABERTA',
      closedAt: apuration?.closedAt,
      observations: apuration?.observations,
    };
  }

  /**
   * Salva os débitos manuais do mês (vendas × alíquota).
   * 🆕 Sprint 8: usa chave composta companyId_clientId_year_month.
   *
   * @throws BadRequestException se o mês estiver FECHADO
   */
  async save(
    companyId: string,
    data: {
      year: number;
      month: number;
      salesValue: number;
      debitRate: number;
      observations?: string;
      clientId?: string; // 🆕 Sprint 8
    },
  ) {
    this.validateMonth(data.month);

    const existing = await this.prisma.fiscalIcmsApuration.findUnique({
      where: {
        companyId_clientId_year_month: { // 🆕 Sprint 8
          companyId,
          clientId: data.clientId || null,
          year: data.year,
          month: data.month,
        },
      },
    });

    if (existing?.status === 'FECHADA') {
      throw new BadRequestException(
        'Apuração fechada não pode ser editada. Reabra o mês antes.',
      );
    }

    const credits = await this.computeCredits(
      companyId,
      data.year,
      data.month,
      data.clientId, // 🆕 Sprint 8
    );

    const salesValue = Number(data.salesValue ?? 0);
    const debitRate = Number(data.debitRate ?? 0);
    const debitsIcms = this.round2((salesValue * debitRate) / 100);
    const balance = this.round2(debitsIcms - credits.creditsIcms);

    await this.prisma.fiscalIcmsApuration.upsert({
      where: {
        companyId_clientId_year_month: { // 🆕 Sprint 8
          companyId,
          clientId: data.clientId || null,
          year: data.year,
          month: data.month,
        },
      },
      update: {
        salesValue,
        debitRate,
        debitsIcms,
        balance,
        creditsIcms: credits.creditsIcms,
        creditsIcmsSt: credits.creditsIcmsSt,
        purchasesValue: credits.purchasesValue,
        invoicesCount: credits.invoicesCount,
        observations: data.observations,
      },
      create: {
        companyId,
        clientId: data.clientId || null, // 🆕 Sprint 8
        year: data.year,
        month: data.month,
        salesValue,
        debitRate,
        debitsIcms,
        balance,
        creditsIcms: credits.creditsIcms,
        creditsIcmsSt: credits.creditsIcmsSt,
        purchasesValue: credits.purchasesValue,
        invoicesCount: credits.invoicesCount,
        observations: data.observations,
      },
    });

    return this.getDetail(companyId, data.year, data.month, data.clientId);
  }

  /**
   * Fecha o mês, travando futuras edições (compliance fiscal).
   * 🆕 Sprint 8: usa chave composta companyId_clientId_year_month.
   */
  async close(
    companyId: string,
    year: number,
    month: number,
    clientId?: string, // 🆕 Sprint 8
  ) {
    this.validateMonth(month);

    const a = await this.prisma.fiscalIcmsApuration.findUnique({
      where: {
        companyId_clientId_year_month: { // 🆕 Sprint 8
          companyId,
          clientId: clientId || null,
          year,
          month,
        },
      },
    });

    await this.save(companyId, {
      year,
      month,
      salesValue: Number(a?.salesValue ?? 0),
      debitRate: Number(a?.debitRate ?? 0),
      clientId, // 🆕 Sprint 8
    });

    return this.prisma.fiscalIcmsApuration.update({
      where: {
        companyId_clientId_year_month: { // 🆕 Sprint 8
          companyId,
          clientId: clientId || null,
          year,
          month,
        },
      },
      data: { status: 'FECHADA', closedAt: new Date() },
    });
  }

  /**
   * Reabre um mês anteriormente fechado, permitindo ajustes.
   * 🆕 Sprint 8: usa chave composta companyId_clientId_year_month.
   */
  async reopen(
    companyId: string,
    year: number,
    month: number,
    clientId?: string, // 🆕 Sprint 8
  ) {
    this.validateMonth(month);

    return this.prisma.fiscalIcmsApuration.update({
      where: {
        companyId_clientId_year_month: { // 🆕 Sprint 8
          companyId,
          clientId: clientId || null,
          year,
          month,
        },
      },
      data: { status: 'ABERTA', closedAt: null },
    });
  }

  private validateMonth(month: number) {
    if (!month || month < 1 || month > 12) {
      throw new BadRequestException('Mês inválido. Use 1 a 12.');
    }
  }
}