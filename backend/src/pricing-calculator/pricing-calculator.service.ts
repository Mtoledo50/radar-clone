import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingCalculatorService {
  constructor(private prisma: PrismaService) {}

  async getConfig(companyId: string) {
    let config = await this.prisma.pricingConfig.findUnique({
      where: { companyId },
    });

    if (!config) {
      config = await this.prisma.pricingConfig.create({
        data: { companyId },
      });
    }

    // Calcular valores derivados
    const employeeCost = config.salaryAverage * (1 + config.chargesPercent / 100);
    const costPerHour = employeeCost / config.hoursPerMonth;
    const factorMarkupFC = 1 - (config.taxesPercent + config.backOfficePercent + config.adminPercent + config.marginFC) / 100;
    const factorMarkupDP = 1 - (config.taxesPercent + config.backOfficePercent + config.adminPercent + config.marginDP) / 100;

    return {
      ...config,
      derived: {
        employeeCost,
        costPerHour,
        factorMarkupFC,
        factorMarkupDP,
      },
    };
  }

  async updateConfig(companyId: string, data: any) {
    return this.prisma.pricingConfig.upsert({
      where: { companyId },
      update: data,
      create: { companyId, ...data },
    });
  }

  async getHourRules(companyId: string) {
    return this.prisma.pricingHourRule.findMany({
      where: { companyId },
      orderBy: [{ regime: 'asc' }, { activity: 'asc' }],
    });
  }

  async createHourRule(companyId: string, data: any) {
    return this.prisma.pricingHourRule.create({
      data: { companyId, ...data },
    });
  }

  async updateHourRule(id: string, data: any) {
    return this.prisma.pricingHourRule.update({
      where: { id },
      data,
    });
  }

  async deleteHourRule(id: string) {
    return this.prisma.pricingHourRule.delete({
      where: { id },
    });
  }

  async calculate(companyId: string, data: any) {
    const { taxRegime, activity, monthlyRevenue, employeeCount, dpMethod, dpValue, currentCharge } = data;

    // Buscar regras de horas
    const rules = await this.prisma.pricingHourRule.findMany({
      where: {
        companyId,
        regime: { in: [taxRegime, 'Qualquer'] },
        activity: { in: [activity, 'Qualquer'] },
      },
    });

    // Encontrar regra aplicável
    let applicableRule = rules.find(
      (r) =>
        r.regime === taxRegime &&
        r.activity === activity &&
        (!r.revenueMin || monthlyRevenue >= r.revenueMin) &&
        (!r.revenueMax || monthlyRevenue <= r.revenueMax)
    );

    if (!applicableRule) {
      applicableRule = rules.find(
        (r) =>
          r.regime === 'Qualquer' &&
          r.activity === 'Qualquer' &&
          (!r.revenueMin || monthlyRevenue >= r.revenueMin) &&
          (!r.revenueMax || monthlyRevenue <= r.revenueMax)
      );
    }

    if (!applicableRule) {
      throw new NotFoundException('Nenhuma regra encontrada para este perfil');
    }

    // Buscar configurações
    const config = await this.getConfig(companyId);

    // Calcular horas totais
    const hoursFiscal = applicableRule.hoursFiscal;
    const hoursAccounting = applicableRule.hoursAccounting;
    const totalHours = hoursFiscal + hoursAccounting;

    // Calcular custo
    const costFC = totalHours * config.derived.costPerHour;
    const costDP = dpMethod === 'MARGIN' 
      ? (employeeCount * dpValue * config.derived.factorMarkupDP) / 100
      : employeeCount * dpValue;

    // Calcular preço base
    const basePrice = (costFC * config.derived.factorMarkupFC) + costDP;

    // Buscar planos comerciais
    const plans = await this.prisma.commercialPlan.findMany({
      where: { companyId },
      orderBy: { multiplier: 'asc' },
      include: {
        planItems: { include: { serviceItem: true } },
      },
    });

    // Calcular preço por plano
    const planPrices = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      multiplier: plan.multiplier,
      finalPrice: basePrice * plan.multiplier,
      badge: plan.badge,
    }));

    // Calcular "deixando dinheiro na mesa"
    const leavingOnTable = currentCharge && currentCharge < basePrice ? basePrice - currentCharge : 0;

    return {
      basePrice,
      hoursFiscal,
      hoursAccounting,
      totalHours,
      costFC,
      costDP,
      leavingOnTable,
      planPrices,
      appliedRule: applicableRule,
    };
  }

  async saveCalculation(companyId: string, userId: string, data: any) {
    return this.prisma.pricingCalculation.create({
      data: {
        companyId,
        userId,
        ...data,
      },
    });
  }

  async getCalculations(companyId: string, status?: string) {
    return this.prisma.pricingCalculation.findMany({
      where: {
        companyId,
        status: status || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}