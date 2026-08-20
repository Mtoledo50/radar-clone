// =================================================================
// INÍCIO: turnover.service.ts
// =================================================================
/**
 * TurnoverService
 * Gerencia o módulo de Turnover: dados mensais, setores, cargos,
 * motivos de desligamento, rescisões e distribuição por setor.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurnoverService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // INÍCIO: getDashboard
  // =================================================================
  /**
   * Retorna o dashboard de turnover:
   * - Dados mensais do ano (TurnoverMonthly)
   * - KPIs calculados (total admissões, demissões, turnover acumulado)
   */
  async getDashboard(companyId: string, year: number) {
    const monthlyData = await this.prisma.turnoverMonthly.findMany({
      where: { companyId, year },
      orderBy: { month: 'asc' },
    });

    // Calcular KPIs agregados
    const totalAdmissions = monthlyData.reduce(
      (sum, m) => sum + m.cltAdmissions + m.internAdmissions + m.thirdAdmissions + m.partnerAdmissions,
      0
    );
    const totalDismissals = monthlyData.reduce(
      (sum, m) => sum + m.cltDismissals + m.internDismissals + m.thirdDismissals + m.partnerDismissals,
      0
    );

    const lastMonth = monthlyData[monthlyData.length - 1];
    const currentHeadcount = lastMonth
      ? lastMonth.cltInitial + lastMonth.cltAdmissions - lastMonth.cltDismissals +
        lastMonth.internInitial + lastMonth.internAdmissions - lastMonth.internDismissals +
        lastMonth.thirdInitial + lastMonth.thirdAdmissions - lastMonth.thirdDismissals +
        lastMonth.partnerInitial + lastMonth.partnerAdmissions - lastMonth.partnerDismissals
      : 0;

    return {
      year,
      monthlyData,
      kpis: {
        totalAdmissions,
        totalDismissals,
        currentHeadcount,
      },
    };
  }
  // =================================================================
  // FIM: getDashboard
  // =================================================================

  // =================================================================
  // INÍCIO: saveMonthlyData
  // =================================================================
  /**
   * Salva ou atualiza os dados mensais de turnover (upsert).
   */
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
        companyId,
        userId,
        year,
        month,
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
  // FIM: saveMonthlyData
  // =================================================================

  // =================================================================
  // INÍCIO: Setores (CRUD)
  // =================================================================
  async getSectors(companyId: string) {
    return this.prisma.sector.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { resignations: true } } },
    });
  }

  async createSector(companyId: string, userId: string, name: string, mandatory: boolean = false) {
    const maxOrder = await this.prisma.sector.findFirst({
      where: { companyId },
      orderBy: { order: 'desc' },
    });
    return this.prisma.sector.create({
      data: {
        companyId,
        userId,
        name,
        mandatory,
        order: (maxOrder?.order || 0) + 1,
      },
    });
  }

  async deleteSector(id: string) {
    const sector = await this.prisma.sector.findUnique({ where: { id } });
    if (!sector) throw new NotFoundException('Setor não encontrado.');
    if (sector.mandatory) throw new NotFoundException('Setor obrigatório não pode ser removido.');
    return this.prisma.sector.delete({ where: { id } });
  }
  // =================================================================
  // FIM: Setores (CRUD)
  // =================================================================

  // =================================================================
  // INÍCIO: Distribuição por Setor
  // =================================================================
  async getSectorDistribution(companyId: string, year: number, month: number) {
    const sectors = await this.prisma.sector.findMany({ where: { companyId } });
    const distributions = await this.prisma.turnoverSectorDistribution.findMany({
      where: { companyId, year, month },
      include: { sector: true },
    });

    // Retorna todos os setores, mesmo os sem distribuição
    return sectors.map((sector) => {
      const dist = distributions.find((d) => d.sectorId === sector.id);
      return dist || {
        id: null,
        companyId,
        userId: distributions[0]?.userId || null,
        year,
        month,
        sectorId: sector.id,
        initial: 0,
        admissions: 0,
        dismissals: 0,
        sector,
      };
    });
  }

  async saveSectorDistribution(companyId: string, userId: string, year: number, month: number, distributions: any[]) {
    // Deleta distribuições existentes do mês
    await this.prisma.turnoverSectorDistribution.deleteMany({
      where: { companyId, year, month },
    });

    // Cria as novas distribuições
    const created = await Promise.all(
      distributions
        .filter((d) => d.initial !== undefined || d.admissions !== undefined || d.dismissals !== undefined)
        .map((d) =>
          this.prisma.turnoverSectorDistribution.create({
            data: {
              companyId,
              userId,
              year,
              month,
              sectorId: d.sectorId,
              initial: Number(d.initial) || 0,
              admissions: Number(d.admissions) || 0,
              dismissals: Number(d.dismissals) || 0,
            },
          })
        )
    );

    return created;
  }
  // =================================================================
  // FIM: Distribuição por Setor
  // =================================================================

  // =================================================================
  // INÍCIO: Motivos de Desligamento (CRUD)
  // =================================================================
  async getDismissalReasons(companyId: string) {
    return this.prisma.dismissalReason.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createDismissalReason(companyId: string, userId: string, name: string) {
    return this.prisma.dismissalReason.create({
      data: { companyId, userId, name },
    });
  }

  async deleteDismissalReason(id: string) {
    return this.prisma.dismissalReason.delete({ where: { id } });
  }
  // =================================================================
  // FIM: Motivos de Desligamento (CRUD)
  // =================================================================

  // =================================================================
  // INÍCIO: Cargos (CRUD)
  // =================================================================
  async getPositions(companyId: string) {
    return this.prisma.position.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createPosition(companyId: string, userId: string, name: string, description?: string) {
    return this.prisma.position.create({
      data: { companyId, userId, name, description },
    });
  }

  async updatePosition(id: string, name: string, description?: string) {
    return this.prisma.position.update({
      where: { id },
      data: { name, description },
    });
  }

  async deletePosition(id: string) {
    return this.prisma.position.delete({ where: { id } });
  }
  // =================================================================
  // FIM: Cargos (CRUD)
  // =================================================================

  // =================================================================
  // INÍCIO: Rescisões (CRUD) — 🆕 Sprint B3
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
      include: {
        sector: true,
        position: true,
        dismissalReason: true,
      },
    });
  }

  /**
   * 🆕 Sprint B3 (ADR-049): aceita `isCritical` (cópia histórica).
   * Se o usuário marcar "era crítico" no modal de rescisão, o flag é
   * gravado no Resignation — independente do Employee.isCritical atual
   * (o colaborador pode ter deixado de ser crítico antes de sair).
   */
  async createResignation(companyId: string, userId: string, data: any) {
    return this.prisma.resignation.create({
      data: {
        companyId,
        userId,
        employeeName: data.employeeName,
        admissionDate: new Date(data.admissionDate),
        dismissalDate: new Date(data.dismissalDate),
        sectorId: data.sectorId || null,
        cellId: data.cellId || null,
        contractType: data.contractType || 'CLT',
        positionId: data.positionId || null,
        dismissalReasonId: data.dismissalReasonId || null,
        isCritical: Boolean(data.isCritical), // 🆕 Sprint B3 (ADR-049)
        observations: data.observations || null,
      },
      include: {
        sector: true,
        position: true,
        dismissalReason: true,
      },
    });
  }

  async deleteResignation(id: string) {
    return this.prisma.resignation.delete({ where: { id } });
  }
  // =================================================================
  // FIM: Rescisões (CRUD)
  // =================================================================

  // =================================================================
  // 🆕 SPRINT B3: Dashboard de Rescisões (alimento dos KPIs do Turnover)
  // =================================================================

  /**
   * 🎯 getResignationsDashboard — alimenta os 4 KPIs da aba
   * "Rescisões → Dashboard" no Turnover:
   *   1. Total de Desligamentos (no ano)
   *   2. Turnover de Novatos (desligados com tenure < 12 meses)
   *   3. Motivo Mais Frequente (top 1)
   *   4. Setor Crítico (setor com mais desligamentos)
   *
   * Também consome o endpoint do EmployeeService (turnover-kpis)
   * para trazer `criticalDismissals` — aqui só agregamos motivos/setores.
   */
  async getResignationsDashboard(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const resignations = await this.prisma.resignation.findMany({
      where: {
        companyId,
        dismissalDate: { gte: start, lte: end },
      },
      include: {
        sector: { select: { name: true } },
        dismissalReason: { select: { name: true } },
      },
    });

    const totalDismissals = resignations.length;

    // Turnover de novatos: tenure < 12 meses na data do desligamento
    const newbieDismissals = resignations.filter((r) => {
      const tenureMs = r.dismissalDate.getTime() - r.admissionDate.getTime();
      const tenureMonths = tenureMs / (1000 * 60 * 60 * 24 * 30.44);
      return tenureMonths < 12;
    }).length;
    const newbieTurnoverRate =
      totalDismissals > 0 ? (newbieDismissals / totalDismissals) * 100 : 0;

    // Motivo mais frequente
    const reasonCounts: Record<string, number> = {};
    resignations.forEach((r) => {
      const name = r.dismissalReason?.name || 'Não informado';
      reasonCounts[name] = (reasonCounts[name] || 0) + 1;
    });
    const topReason =
      Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0] || null;

    // Setor crítico (mais desligamentos)
    const sectorCounts: Record<string, number> = {};
    resignations.forEach((r) => {
      const name = r.sector?.name || 'Sem setor';
      sectorCounts[name] = (sectorCounts[name] || 0) + 1;
    });
    const topSector =
      Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0] || null;

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
  // FIM: Rescisões (CRUD)
  // =================================================================
}
// =================================================================
// FIM: turnover.service.ts
// =================================================================