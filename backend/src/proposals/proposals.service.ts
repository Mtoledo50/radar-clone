import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProposalStatus } from '@prisma/client';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 CRUD DE PROPOSTAS (Com ProposalItem relacional)
  // =================================================================
  
  async findAll(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status && status !== 'all') {
      where.status = status;
    }

    return this.prisma.proposal.findMany({
      where,
      include: {
        items: {
          include: {
            commercialPlan: true,
            serviceItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, companyId },
      include: {
        items: {
          include: {
            commercialPlan: true,
            serviceItem: true,
          },
        },
      },
    });
    if (!proposal) throw new NotFoundException('Proposta não encontrada.');
    return proposal;
  }

  /**
   * 🌐 BUSCA PÚBLICA POR SLUG (Para visualização do cliente)
   * Não exige companyId (acesso público via link compartilhado)
   */
  async findBySlug(slug: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            commercialPlan: true,
            serviceItem: true,
          },
        },
        company: {
          select: {
            name: true,
            logoUrl: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    if (!proposal) throw new NotFoundException('Proposta não encontrada.');
    return proposal;
  }

  /**
   * 📊 TRACK DE CLIQUE NO WHATSAPP (Métrica de engajamento)
   */
  async trackWhatsAppClick(slug: string) {
    return this.prisma.proposal.update({
      where: { slug },
      data: {
        whatsappClicks: { increment: 1 },
      },
    });
  }

  /**
   * 🚀 CRIAÇÃO ENTERPRISE: Proposal + ProposalItems (Transacional)
   */
  async create(companyId: string, userId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          companyId,
          userId,
          proposalNumber: data.proposalNumber,
          slug: data.slug,
          clientName: data.clientName,
          clientCnpj: data.clientCnpj,
          taxRegime: data.taxRegime,
          activity: data.activity,
          monthlyRevenue: data.monthlyRevenue,
          employeeCount: data.employeeCount,
          basePrice: data.basePrice,
          aboutOffice: data.aboutOffice,
          differentials: data.differentials,
          onboarding: data.onboarding,
          commercialTerms: data.commercialTerms,
          specificNote: data.specificNote,
          status: ProposalStatus.DRAFT,
        },
      });

      if (data.items && data.items.length > 0) {
        await tx.proposalItem.createMany({
          data: data.items.map((item: any) => ({
            proposalId: proposal.id,
            commercialPlanId: item.commercialPlanId || null,
            serviceItemId: item.serviceItemId || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      return this.findOne(proposal.id, companyId);
    });
  }

  async update(id: string, companyId: string, data: any) {
    await this.findOne(id, companyId);
    
    return this.prisma.proposal.update({
      where: { id },
      data: {
        clientName: data.clientName,
        clientCnpj: data.clientCnpj,
        taxRegime: data.taxRegime,
        activity: data.activity,
        monthlyRevenue: data.monthlyRevenue,
        employeeCount: data.employeeCount,
        basePrice: data.basePrice,
        aboutOffice: data.aboutOffice,
        differentials: data.differentials,
        onboarding: data.onboarding,
        commercialTerms: data.commercialTerms,
        specificNote: data.specificNote,
      },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.delete({ where: { id } });
  }

  // =================================================================
  // 📊 STATUS DA PROPOSTA
  // =================================================================
  
  async markAsSent(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.update({
      where: { id },
      data: { 
        status: ProposalStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  async markAsViewed(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.update({
      where: { id },
      data: { 
        status: ProposalStatus.VIEWED,
        views: { increment: 1 },
      },
    });
  }

  async closeProposal(id: string, companyId: string, data: { planId: string; price: number }) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.update({
      where: { id },
      data: { 
        status: ProposalStatus.CLOSED_WON,
        closedAt: new Date(), 
        closedPlanId: data.planId, 
        closedPrice: data.price,
      },
    });
  }

  /**
   * 📉 MARCAR COMO PERDIDA (Compatibilidade com controller antigo)
   */
  async markAsLost(id: string, companyId: string, reason: string) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.update({
      where: { id },
      data: { 
        status: ProposalStatus.CLOSED_LOST,
        lossReason: reason,
      },
    });
  }

  async loseProposal(id: string, companyId: string, reason: string) {
    return this.markAsLost(id, companyId, reason);
  }

  // =================================================================
  // 📊 MÉTRICAS E DASHBOARDS (Compatibilidade total com controller)
  // =================================================================
  
  /**
   * Helper: Calcula filtro de datas baseado no período
   */
  private getDateFilter(period?: string): { createdAt?: any; closedAt?: any } {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30d
    }

    return { createdAt: { gte: startDate, lte: now } };
  }

  /**
   * 📊 DASHBOARD PRINCIPAL (Stats gerais)
   */
  async getDashboardStats(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);

    const [totalProposals, wonProposals, lostProposals, sentProposals] = await Promise.all([
      this.prisma.proposal.count({ where: { companyId, ...dateFilter } }),
      this.prisma.proposal.count({ 
        where: { companyId, status: ProposalStatus.CLOSED_WON, ...dateFilter }
      }),
      this.prisma.proposal.count({ 
        where: { companyId, status: ProposalStatus.CLOSED_LOST, ...dateFilter }
      }),
      this.prisma.proposal.count({ 
        where: { companyId, status: ProposalStatus.SENT, ...dateFilter }
      }),
    ]);

    const conversionRate = totalProposals > 0 
      ? (wonProposals / totalProposals) * 100 
      : 0;

    const wonRevenue = await this.prisma.proposal.aggregate({
      where: { companyId, status: ProposalStatus.CLOSED_WON, ...dateFilter },
      _sum: { closedPrice: true },
    });

    return {
      totalProposals,
      wonProposals,
      lostProposals,
      sentProposals,
      conversionRate: Number(conversionRate.toFixed(2)),
      wonRevenue: wonRevenue._sum.closedPrice || 0,
    };
  }

  /**
   * 📈 TENDÊNCIA DE PROPOSTAS (Dados para gráfico de linha)
   */
  async getTrendData(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);
    
    const proposals = await this.prisma.proposal.findMany({
      where: { companyId, ...dateFilter },
      select: {
        createdAt: true,
        status: true,
        closedPrice: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupa por dia
    const groupedByDay: Record<string, { created: number; won: number; lost: number; revenue: number }> = {};
    
    proposals.forEach(p => {
      const day = p.createdAt.toISOString().split('T')[0];
      if (!groupedByDay[day]) {
        groupedByDay[day] = { created: 0, won: 0, lost: 0, revenue: 0 };
      }
      groupedByDay[day].created++;
      if (p.status === ProposalStatus.CLOSED_WON) {
        groupedByDay[day].won++;
        groupedByDay[day].revenue += p.closedPrice || 0;
      }
      if (p.status === ProposalStatus.CLOSED_LOST) {
        groupedByDay[day].lost++;
      }
    });

    return Object.entries(groupedByDay).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  /**
   * 📉 MOTIVOS DE PERDA (Dados para gráfico de pizza)
   */
  async getLossReasonsData(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);
    
    const lostProposals = await this.prisma.proposal.findMany({
      where: { 
        companyId, 
        status: ProposalStatus.CLOSED_LOST,
        ...dateFilter,
      },
      select: { lossReason: true },
    });

    const reasons: Record<string, number> = {};
    lostProposals.forEach(p => {
      const reason = p.lossReason || 'Não informado';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return Object.entries(reasons).map(([reason, count]) => ({
      reason,
      count,
    }));
  }

  /**
   * 📊 TAXA DE CONVERSÃO POR PERÍODO (Mensal)
   */
  async getConversionTrend(companyId: string, period?: string) {
    const now = new Date();
    const months: { month: string; total: number; won: number; rate: number }[] = [];

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const [total, won] = await Promise.all([
        this.prisma.proposal.count({
          where: { companyId, createdAt: { gte: start, lte: end } },
        }),
        this.prisma.proposal.count({
          where: { 
            companyId, 
            status: ProposalStatus.CLOSED_WON,
            closedAt: { gte: start, lte: end },
          },
        }),
      ]);

      months.push({
        month: start.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        total,
        won,
        rate: total > 0 ? Number(((won / total) * 100).toFixed(2)) : 0,
      });
    }

    return months;
  }

  /**
   * 📅 DADOS MENSAIS (Legado - mantido para compatibilidade)
   */
  async getMonthlyData(companyId: string, year: number) {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month,
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0, 23, 59, 59),
      };
    });

    return Promise.all(
      months.map(async ({ month, start, end }) => {
        const [created, won, lost] = await Promise.all([
          this.prisma.proposal.count({
            where: { companyId, createdAt: { gte: start, lte: end } },
          }),
          this.prisma.proposal.count({
            where: { companyId, status: ProposalStatus.CLOSED_WON, closedAt: { gte: start, lte: end } },
          }),
          this.prisma.proposal.count({
            where: { companyId, status: ProposalStatus.CLOSED_LOST, closedAt: { gte: start, lte: end } },
          }),
        ]);

        return { month, created, won, lost };
      })
    );
  }
}