// =================================================================
// INÍCIO: backend/src/turnover/turnover.service.ts
// =================================================================
/**
 * =================================================================
 * TurnoverService — Módulo de Rotatividade (Sprints B1→B4)
 * =================================================================
 * Gerencia: dados mensais, setores, cargos, motivos, rescisões,
 * distribuição por setor, dashboard de rescisões (B3) e
 * 🆕 entrevista de desligamento + análise (B4, ADR-050).
 * =================================================================
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { analyzeExitInterview } from './exit-interview-engine';

@Injectable()
export class TurnoverService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📊 DASHBOARD (dados mensais)
  // =================================================================
  async getDashboard(companyId: string, year: number) {
    const monthlyData = await this.prisma.turnoverMonthly.findMany({
      where: { companyId, year },
      orderBy: { month: 'asc' },
    });

    const totalAdmissions = monthlyData.reduce(
      (sum, m) => sum + m.cltAdmissions + m.internAdmissions + m.thirdAdmissions + m.partnerAdmissions,
      0,
    );
    const totalDismissals = monthlyData.reduce(
      (sum, m) => sum + m.cltDismissals + m.internDismissals + m.thirdDismissals + m.partnerDismissals,
      0,
    );

    const lastMonth = monthlyData[monthlyData.length - 1];
    const currentHeadcount = lastMonth
      ? lastMonth.cltInitial + lastMonth.cltAdmissions - lastMonth.cltDismissals +
        lastMonth.internInitial + lastMonth.internAdmissions - lastMonth.internDismissals +
        lastMonth.thirdInitial + lastMonth.thirdAdmissions - lastMonth.thirdDismissals +
        lastMonth.partnerInitial + lastMonth.partnerAdmissions - lastMonth.partnerDismissals
      : 0;

    return { year, monthlyData, kpis: { totalAdmissions, totalDismissals, currentHeadcount } };
  }

  // =================================================================
  // 📅 DADOS MENSAIS
  // =================================================================
  async saveMonthlyData(companyId: string, userId: string, year: number, month: number, data: any) {
    return this.prisma.turnoverMonthly.upsert({
      where: { companyId_year_month: { companyId, year, month } },
      update: {
        cltInitial: Number(data.cltInitial) || 0,
        cltAdmissions: Number(data.cltAdmissions) || 0,
        cltDismissals: Number(data.cltDismissals) || 0,
        internInitial: Number(data.internInitial) || 0,
        internAdmissions: Number(data.internAdmissions) || 0,
        internDismissals: Number(data.internDismissals) || 0,
        thirdInitial: Number(data.thirdInitial) || 0,
        thirdAdmissions: Number(data.thirdAdmissions) || 0,
        thirdDismissals: Number(data.thirdDismissals) || 0,
        partnerInitial: Number(data.partnerInitial) || 0,
        partnerAdmissions: Number(data.partnerAdmissions) || 0,
        partnerDismissals: Number(data.partnerDismissals) || 0,
      },
      create: {
        companyId, userId, year, month,
        cltInitial: Number(data.cltInitial) || 0,
        cltAdmissions: Number(data.cltAdmissions) || 0,
        cltDismissals: Number(data.cltDismissals) || 0,
        internInitial: Number(data.internInitial) || 0,
        internAdmissions: Number(data.internAdmissions) || 0,
        internDismissals: Number(data.internDismissals) || 0,
        thirdInitial: Number(data.thirdInitial) || 0,
        thirdAdmissions: Number(data.thirdAdmissions) || 0,
        thirdDismissals: Number(data.thirdDismissals) || 0,
        partnerInitial: Number(data.partnerInitial) || 0,
        partnerAdmissions: Number(data.partnerAdmissions) || 0,
        partnerDismissals: Number(data.partnerDismissals) || 0,
      },
    });
  }

  // =================================================================
  // 🏢 SETORES
  // =================================================================
  async getSectors(companyId: string) {
    return this.prisma.sector.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { resignations: true } } },
    });
  }

  async createSector(companyId: string, userId: string, name: string, mandatory = false) {
    const maxOrder = await this.prisma.sector.findFirst({
      where: { companyId },
      orderBy: { order: 'desc' },
    });
    return this.prisma.sector.create({
      data: { companyId, userId, name, mandatory, order: (maxOrder?.order || 0) + 1 },
    });
  }

  async deleteSector(id: string) {
    const sector = await this.prisma.sector.findUnique({ where: { id } });
    if (!sector) throw new NotFoundException('Setor não encontrado.');
    if (sector.mandatory) throw new NotFoundException('Setor obrigatório não pode ser removido.');
    return this.prisma.sector.delete({ where: { id } });
  }

  // =================================================================
  // 📋 DISTRIBUIÇÃO POR SETOR (histórica)
  // =================================================================
  async getSectorDistribution(companyId: string, year: number, month: number) {
    const sectors = await this.prisma.sector.findMany({ where: { companyId } });
    const distributions = await this.prisma.turnoverSectorDistribution.findMany({
      where: { companyId, year, month },
      include: { sector: true },
    });
    return sectors.map((sector) => {
      const dist = distributions.find((d) => d.sectorId === sector.id);
      return dist || {
        id: null, companyId, userId: distributions[0]?.userId || null,
        year, month, sectorId: sector.id,
        initial: 0, admissions: 0, dismissals: 0, sector,
      };
    });
  }

  async saveSectorDistribution(companyId: string, userId: string, year: number, month: number, distributions: any[]) {
    await this.prisma.turnoverSectorDistribution.deleteMany({ where: { companyId, year, month } });
    return Promise.all(
      distributions
        .filter((d) => d.initial !== undefined || d.admissions !== undefined || d.dismissals !== undefined)
        .map((d) =>
          this.prisma.turnoverSectorDistribution.create({
            data: {
              companyId, userId, year, month, sectorId: d.sectorId,
              initial: Number(d.initial) || 0,
              admissions: Number(d.admissions) || 0,
              dismissals: Number(d.dismissals) || 0,
            },
          }),
        ),
    );
  }

  // =================================================================
  // 📝 MOTIVOS DE DESLIGAMENTO
  // =================================================================
  async getDismissalReasons(companyId: string) {
    return this.prisma.dismissalReason.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }
  async createDismissalReason(companyId: string, userId: string, name: string) {
    return this.prisma.dismissalReason.create({ data: { companyId, userId, name } });
  }
  async deleteDismissalReason(id: string) {
    return this.prisma.dismissalReason.delete({ where: { id } });
  }

  // =================================================================
  // 💼 CARGOS
  // =================================================================
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

  // =================================================================
  // 📤 RESCISÕES (CRUD)
  // =================================================================
  async getResignations(companyId: string, filters?: any) {
    const where: any = { companyId };
    if (filters?.year) {
      const year = parseInt(filters.year);
      where.dismissalDate = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
    }
    if (filters?.sectorId) where.sectorId = filters.sectorId;
    if (filters?.contractType) where.contractType = filters.contractType;

    return this.prisma.resignation.findMany({
      where,
      orderBy: { dismissalDate: 'desc' },
      include: { sector: true, position: true, dismissalReason: true },
    });
  }

  async createResignation(companyId: string, userId: string, data: any) {
    return this.prisma.resignation.create({
      data: {
        companyId, userId,
        employeeName: data.employeeName,
        admissionDate: new Date(data.admissionDate),
        dismissalDate: new Date(data.dismissalDate),
        sectorId: data.sectorId || null,
        cellId: data.cellId || null,
        contractType: data.contractType || 'CLT',
        positionId: data.positionId || null,
        dismissalReasonId: data.dismissalReasonId || null,
        isCritical: Boolean(data.isCritical), // B3 (ADR-049)
        observations: data.observations || null,
      },
      include: { sector: true, position: true, dismissalReason: true },
    });
  }

  async deleteResignation(id: string) {
    return this.prisma.resignation.delete({ where: { id } });
  }

  // =================================================================
  // 🆕 SPRINT B3: DASHBOARD DE RESCISÕES
  // =================================================================
  async getResignationsDashboard(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const resignations = await this.prisma.resignation.findMany({
      where: { companyId, dismissalDate: { gte: start, lte: end } },
      include: {
        sector: { select: { name: true } },
        dismissalReason: { select: { name: true } },
      },
    });

    const totalDismissals = resignations.length;
    const newbieDismissals = resignations.filter((r) => {
      const months = (r.dismissalDate.getTime() - r.admissionDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      return months < 12;
    }).length;
    const newbieTurnoverRate = totalDismissals > 0 ? (newbieDismissals / totalDismissals) * 100 : 0;

    const reasonCounts: Record<string, number> = {};
    resignations.forEach((r) => {
      const name = r.dismissalReason?.name || 'Não informado';
      reasonCounts[name] = (reasonCounts[name] || 0) + 1;
    });
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0] || null;

    const sectorCounts: Record<string, number> = {};
    resignations.forEach((r) => {
      const name = r.sector?.name || 'Sem setor';
      sectorCounts[name] = (sectorCounts[name] || 0) + 1;
    });
    const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0] || null;

    return {
      year,
      totalDismissals,
      newbieDismissals,
      newbieTurnoverRate: Number(newbieTurnoverRate.toFixed(1)),
      topReason: topReason ? { name: topReason[0], count: topReason[1] } : null,
      topSector: topSector ? { name: topSector[0], count: topSector[1] } : null,
    };
  }

  // =================================================================
  // 🆕 SPRINT B4: ENTREVISTA DE DESLIGAMENTO + ANÁLISE (ADR-050)
  // =================================================================

  /** Valida que a rescisão pertence ao tenant (segurança ADR-004). */
  private async assertResignation(companyId: string, id: string) {
    const r = await this.prisma.resignation.findFirst({ where: { id, companyId } });
    if (!r) throw new NotFoundException('Rescisão não encontrada.');
    return r;
  }

  /**
   * 📝 Salva as 5 respostas da entrevista (sobrescreve se já existir).
   */
  async saveExitInterview(companyId: string, resignationId: string, answers: string[]) {
    await this.assertResignation(companyId, resignationId);
    return this.prisma.resignation.update({
      where: { id: resignationId },
      data: {
        exitInterview: {
          answers,
          conductedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * 🤖 Roda o motor de análise (ADR-050) sobre a entrevista salva
   * e persiste o resultado em `exitAnalysis`.
   */
  async analyzeResignation(companyId: string, resignationId: string) {
    const r = await this.assertResignation(companyId, resignationId);
    const interview = r.exitInterview as any;
    if (!interview?.answers?.length) {
      throw new NotFoundException('Entrevista ainda não preenchida para esta rescisão.');
    }

    const analysis = analyzeExitInterview(interview.answers);

    const updated = await this.prisma.resignation.update({
      where: { id: resignationId },
      data: { exitAnalysis: analysis as any },
      include: { sector: true, position: true, dismissalReason: true },
    });
    return updated;
  }

  /**
   * 📊 Agrega as análises do ano p/ sub-aba "Análises":
   * contagem por causa-raiz + planos de ação da causa primária.
   */
  async getExitAnalyses(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const analyzed = await this.prisma.resignation.findMany({
      where: {
        companyId,
        dismissalDate: { gte: start, lte: end },
        exitAnalysis: { not: null },
      },
      select: { employeeName: true, exitAnalysis: true },
    });

    const causeCounts: Record<string, { label: string; count: number }> = {};
    const actionPlans: Record<string, string[]> = {};

    analyzed.forEach((r) => {
      const a = r.exitAnalysis as any;
      if (a?.primaryCause) {
        if (!causeCounts[a.primaryCause]) {
          causeCounts[a.primaryCause] = { label: a.primaryLabel || a.primaryCause, count: 0 };
        }
        causeCounts[a.primaryCause].count++;
        actionPlans[a.primaryCause] = a.actionPlan || [];
      }
    });

    const topCauses = Object.entries(causeCounts)
      .map(([id, v]) => ({ category: id, label: v.label, count: v.count, actionPlan: actionPlans[id] || [] }))
      .sort((a, b) => b.count - a.count);

    return {
      year,
      analyzedCount: analyzed.length,
      topCauses,
    };
  }
}
// =================================================================
// FIM: backend/src/turnover/turnover.service.ts
// =================================================================