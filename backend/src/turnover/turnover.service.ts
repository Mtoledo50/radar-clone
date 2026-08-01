import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurnoverService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(companyId: string, year: number) {
    const monthlyData = await this.prisma.turnoverMonthly.findMany({
      where: { companyId, year },
      orderBy: { month: 'asc' },
    });

    const sectors = await this.prisma.sector.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: { cells: true },
    });

    const reasons = await this.prisma.dismissalReason.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    const positions = await this.prisma.position.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    let totalInitial = 0, totalAdmissions = 0, totalDismissals = 0, totalFinal = 0;

    monthlyData.forEach((m) => {
      const initial = m.cltInitial + m.internInitial + m.thirdInitial + m.partnerInitial;
      const admissions = m.cltAdmissions + m.internAdmissions + m.thirdAdmissions + m.partnerAdmissions;
      const dismissals = m.cltDismissals + m.internDismissals + m.thirdDismissals + m.partnerDismissals;
      const final = initial + admissions - dismissals;

      totalInitial += initial;
      totalAdmissions += admissions;
      totalDismissals += dismissals;
      totalFinal += final;
    });

    const headcountMedio = (totalInitial + totalFinal) / 2;
    const turnoverAcumulado = headcountMedio > 0 ? (totalDismissals / headcountMedio) * 100 : 0;

    return {
      totalTeam: totalFinal,
      turnoverAcumulado: Number(turnoverAcumulado.toFixed(2)),
      monthlyData: monthlyData.map((m) => ({
        month: m.month,
        initial: m.cltInitial + m.internInitial + m.thirdInitial + m.partnerInitial,
        admissions: m.cltAdmissions + m.internAdmissions + m.thirdAdmissions + m.partnerAdmissions,
        dismissals: m.cltDismissals + m.internDismissals + m.thirdDismissals + m.partnerDismissals,
        final: (m.cltInitial + m.internInitial + m.thirdInitial + m.partnerInitial) + 
               (m.cltAdmissions + m.internAdmissions + m.thirdAdmissions + m.partnerAdmissions) - 
               (m.cltDismissals + m.internDismissals + m.thirdDismissals + m.partnerDismissals),
      })),
      sectors,
      reasons,
      positions,
    };
  }

  async saveMonthlyData(companyId: string, userId: string, year: number, month: number, data: any) {
    const payload = {
      companyId, userId, year, month,
      cltInitial: Number(data.cltInitial) || 0, cltAdmissions: Number(data.cltAdmissions) || 0, cltDismissals: Number(data.cltDismissals) || 0,
      internInitial: Number(data.internInitial) || 0, internAdmissions: Number(data.internAdmissions) || 0, internDismissals: Number(data.internDismissals) || 0,
      thirdInitial: Number(data.thirdInitial) || 0, thirdAdmissions: Number(data.thirdAdmissions) || 0, thirdDismissals: Number(data.thirdDismissals) || 0,
      partnerInitial: Number(data.partnerInitial) || 0, partnerAdmissions: Number(data.partnerAdmissions) || 0, partnerDismissals: Number(data.partnerDismissals) || 0,
    };

    const existing = await this.prisma.turnoverMonthly.findUnique({
      where: { companyId_year_month: { companyId, year, month } },
    });

    return existing 
      ? this.prisma.turnoverMonthly.update({ where: { id: existing.id }, data: payload })
      : this.prisma.turnoverMonthly.create({ data: payload });
  }

  async getSectors(companyId: string) {
    return this.prisma.sector.findMany({ where: { companyId }, orderBy: { order: 'asc' }, include: { cells: true } });
  }

  async createSector(companyId: string, userId: string, name: string) {
    const count = await this.prisma.sector.count({ where: { companyId } });
    return this.prisma.sector.create({ data: { companyId, userId, name, order: count } });
  }

  async updateSector(id: string, name: string) {
    return this.prisma.sector.update({ where: { id }, data: { name } });
  }

  async deleteSector(id: string) {
    return this.prisma.sector.delete({ where: { id } });
  }

  async getSectorDistribution(companyId: string, year: number, month: number) {
    return this.prisma.turnoverSectorDistribution.findMany({
      where: { companyId, year, month },
      include: { sector: true },
      orderBy: { sector: { order: 'asc' } },
    });
  }

  async saveSectorDistribution(companyId: string, userId: string, year: number, month: number, distributions: any[]) {
    const results = [];
    for (const dist of distributions) {
      const payload = {
        companyId, userId, year, month, sectorId: dist.sectorId,
        initial: Number(dist.initial) || 0, admissions: Number(dist.admissions) || 0, dismissals: Number(dist.dismissals) || 0,
      };

      const existing = await this.prisma.turnoverSectorDistribution.findUnique({
        where: { companyId_year_month_sectorId: { companyId, year, month, sectorId: dist.sectorId } },
      });

      results.push(
        existing
          ? await this.prisma.turnoverSectorDistribution.update({ where: { id: existing.id }, data: payload, include: { sector: true } })
          : await this.prisma.turnoverSectorDistribution.create({ data: payload, include: { sector: true } })
      );
    }
    return results;
  }

  async getDismissalReasons(companyId: string) {
    return this.prisma.dismissalReason.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async createDismissalReason(companyId: string, userId: string, name: string, description?: string) {
    return this.prisma.dismissalReason.create({ data: { companyId, userId, name, description } });
  }

  async updateDismissalReason(id: string, name: string, description?: string) {
    return this.prisma.dismissalReason.update({ where: { id }, data: { name, description } });
  }

  async deleteDismissalReason(id: string) {
    return this.prisma.dismissalReason.delete({ where: { id } });
  }

  async getPositions(companyId: string) {
    return this.prisma.position.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async createPosition(companyId: string, userId: string, name: string, description?: string) {
    return this.prisma.position.create({ data: { companyId, userId, name, description } });
  }

  async updatePosition(id: string, name: string, description?: string) {
    return this.prisma.position.update({ where: { id }, data: { name, description } });
  }

  async deletePosition(id: string) {
    return this.prisma.position.delete({ where: { id } });
  }

  async getResignations(companyId: string, filters?: any) {
    const where: any = { companyId };
    if (filters?.year) {
      const year = parseInt(filters.year);
      where.dismissalDate = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
    }
    if (filters?.sectorId) where.sectorId = filters.sectorId;
    if (filters?.contractType) where.contractType = filters.contractType;
    
    return this.prisma.resignation.findMany({
      where, orderBy: { dismissalDate: 'desc' },
      include: { sector: true, position: true, dismissalReason: true },
    });
  }

  async createResignation(companyId: string, userId: string, data: any) {
    return this.prisma.resignation.create({
      data: {
        companyId, userId, employeeName: data.employeeName,
        admissionDate: new Date(data.admissionDate), dismissalDate: new Date(data.dismissalDate),
        sectorId: data.sectorId || null, cellId: data.cellId || null, positionId: data.positionId || null,
        contractType: data.contractType, dismissalReasonId: data.dismissalReasonId || null, observations: data.observations || null,
      },
      include: { sector: true, position: true, dismissalReason: true },
    });
  }

  async updateResignation(id: string, data: any) {
    return this.prisma.resignation.update({
      where: { id },
      data: {
        employeeName: data.employeeName,
        admissionDate: new Date(data.admissionDate), dismissalDate: new Date(data.dismissalDate),
        sectorId: data.sectorId || null, cellId: data.cellId || null, positionId: data.positionId || null,
        contractType: data.contractType, dismissalReasonId: data.dismissalReasonId || null, observations: data.observations || null,
      },
      include: { sector: true, position: true, dismissalReason: true },
    });
  }

  async deleteResignation(id: string) {
    return this.prisma.resignation.delete({ where: { id } });
  }
}