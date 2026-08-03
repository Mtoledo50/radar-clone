/**
 * PricingCalculatorService
 * Motor de cálculo de precificação contábil.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
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

    const employeeCost = config.salaryAverage * (1 + config.chargesPercent / 100);
    const costPerHour = employeeCost / config.hoursPerMonth;
    const markupFC = 1 - (config.taxesPercent + config.backOfficePercent + config.adminPercent + config.marginFC) / 100;
    const markupDP = 1 - (config.taxesPercent + config.backOfficePercent + config.adminPercent + config.marginDP) / 100;

    return {
      ...config,
      derived: {
        employeeCost: Math.round(employeeCost * 100) / 100,
        costPerHour: Math.round(costPerHour * 100) / 100,
        markupFC: Math.round(markupFC * 10000) / 10000,
        markupDP: Math.round(markupDP * 10000) / 10000,
      },
    };
  }

  async updateConfig(companyId: string, data: any) {
    const { derived, ...validData } = data;
    return this.prisma.pricingConfig.upsert({
      where: { companyId },
      update: validData,
      create: { companyId, ...validData },
    });
  }

  async getHourRules(companyId: string) {
    return this.prisma.pricingHourRule.findMany({
      where: { companyId },
      orderBy: [{ regime: 'asc' }, { activity: 'asc' }, { revenueMin: 'asc' }],
    });
  }

  async createHourRule(companyId: string, data: any) {
    return this.prisma.pricingHourRule.create({
      data: { companyId, ...data },
    });
  }

  async updateHourRule(id: string, data: any) {
    return this.prisma.pricingHourRule.update({ where: { id }, data });
  }

  async deleteHourRule(id: string) {
    return this.prisma.pricingHourRule.delete({ where: { id } });
  }

  async calculate(companyId: string, input: any) {
    const config = await this.prisma.pricingConfig.findUnique({
      where: { companyId },
    });

    if (!config) {
      throw new BadRequestException('Configure os custos de precificação antes de calcular.');
    }

    const hourRule = await this.findMatchingHourRule(companyId, input);

    const employeeCost = config.salaryAverage * (1 + config.chargesPercent / 100);
    const costPerHour = employeeCost / config.hoursPerMonth;

    const markupFC = 1 - (config.taxesPercent + config.backOfficePercent + config.adminPercent + config.marginFC) / 100;
    const markupDP = 1 - (config.taxesPercent + config.backOfficePercent + config.adminPercent + config.marginDP) / 100;

    let totalHoursFiscal = hourRule?.hoursFiscal || 0;
    let totalHoursAccounting = hourRule?.hoursAccounting || 0;

    if (input.hasErp) {
      totalHoursFiscal += 1;
      totalHoursAccounting += 1;
    }

    const totalHours = totalHoursFiscal + totalHoursAccounting;

    const costFC = totalHours * costPerHour;
    const priceFC = markupFC > 0 ? costFC / markupFC : costFC;

    let priceDP = 0;
    if (input.employeeCount > 0) {
      if (input.dpMethod === 'MARGIN') {
        const costDP = input.employeeCount * (config.salaryAverage / config.livesPerEmployee);
        priceDP = markupDP > 0 ? costDP / markupDP : costDP;
      } else {
        priceDP = input.employeeCount * input.dpValue;
      }
    }

    const basePrice = priceFC + priceDP;

    const plans = await this.prisma.commercialPlan.findMany({
      where: { companyId },
      orderBy: { multiplier: 'asc' },
    });

    const planPrices = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      multiplier: plan.multiplier,
      finalPrice: Math.round(basePrice * plan.multiplier * 100) / 100,
      badge: plan.badge,
    }));

    const middlePlan = planPrices[Math.floor(planPrices.length / 2)] || planPrices[0];
    const dreProjection = this.calculateDRE(
      middlePlan?.finalPrice || basePrice,
      priceFC,
      priceDP,
      config
    );

    let leavingOnTable = 0;
    if (input.currentCharge && input.currentCharge > 0) {
      leavingOnTable = basePrice - input.currentCharge;
    }

    return {
      success: true,
      data: {
        input,
        hourRule: hourRule || null,
        costPerHour: Math.round(costPerHour * 100) / 100,
        employeeCost: Math.round(employeeCost * 100) / 100,
        totalHours,
        totalHoursFiscal,
        totalHoursAccounting,
        priceFC: Math.round(priceFC * 100) / 100,
        priceDP: Math.round(priceDP * 100) / 100,
        basePrice: Math.round(basePrice * 100) / 100,
        planPrices,
        dreProjection,
        leavingOnTable: Math.round(leavingOnTable * 100) / 100,
      },
    };
  }

  private async findMatchingHourRule(companyId: string, input: any) {
    const rules = await this.prisma.pricingHourRule.findMany({
      where: { companyId },
      orderBy: [{ revenueMin: 'desc' }],
    });

    for (const rule of rules) {
      const regimeMatch = rule.regime === input.taxRegime || rule.regime === 'Qualquer';
      const activityMatch = rule.activity === input.activity || rule.activity === 'Qualquer';
      const annexMatch = !rule.annex || rule.annex === input.annex;
      const revenueMatch =
        input.monthlyRevenue >= rule.revenueMin &&
        (rule.revenueMax === 0 || input.monthlyRevenue <= rule.revenueMax);

      if (regimeMatch && activityMatch && annexMatch && revenueMatch) {
        return rule;
      }
    }

    return null;
  }

  private calculateDRE(finalPrice: number, priceFC: number, priceDP: number, config: any) {
    const costFC = priceFC * (config.taxesPercent + config.backOfficePercent + config.adminPercent) / 100;
    const costDP = priceDP * (config.taxesPercent + config.backOfficePercent + config.adminPercent) / 100;
    
    const marginFC = priceFC - costFC;
    const marginDP = priceDP - costDP;
    const totalProfit = marginFC + marginDP;

    return {
      marginFC: Math.round(marginFC * 100) / 100,
      marginFCPercent: priceFC > 0 ? Math.round((marginFC / priceFC) * 10000) / 100 : 0,
      marginDP: Math.round(marginDP * 100) / 100,
      marginDPPercent: priceDP > 0 ? Math.round((marginDP / priceDP) * 10000) / 100 : 0,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalProfitPercent: finalPrice > 0 ? Math.round((totalProfit / finalPrice) * 10000) / 100 : 0,
    };
  }

  async saveCalculation(companyId: string, userId: string, data: any) {
    const { success, ...calcData } = data;
    return this.prisma.pricingCalculation.create({
      data: {
        companyId,
        userId,
        ...calcData,
        planPrices: JSON.stringify(calcData.planPrices || []),
      },
    });
  }

  async getCalculations(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;
    return this.prisma.pricingCalculation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }
}