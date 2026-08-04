import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;

    return this.prisma.proposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposta não encontrada');
    return proposal;
  }

  async findBySlug(slug: string) {
    const proposal = await this.prisma.proposal.findUnique({ where: { slug } });
    if (!proposal) throw new NotFoundException('Proposta não encontrada');

    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { views: { increment: 1 } },
    });
    return proposal;
  }

  async create(companyId: string, userId: string, data: any) {
    const year = new Date().getFullYear();
    const count = await this.prisma.proposal.count({
      where: { companyId, createdAt: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } },
    });

    const proposalNumber = `${String(count + 1).padStart(4, '0')}/${year}`;
    let slug = `${data.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    
    // Garante que o slug é único
    let counter = 1;
    while (await this.prisma.proposal.findUnique({ where: { slug } })) {
      slug = `${slug}-${counter}`;
      counter++;
    }

    return this.prisma.proposal.create({
      data: {
        companyId,
        userId,
        proposalNumber,
        slug,
        clientName: data.clientName,
        clientCnpj: data.clientCnpj,
        taxRegime: data.taxRegime,
        activity: data.activity,
        monthlyRevenue: data.monthlyRevenue,
        employeeCount: data.employeeCount,
        basePrice: data.basePrice,
        includedPlans: JSON.stringify(data.includedPlans || []),
        aboutOffice: data.aboutOffice,
        differentials: data.differentials,
        onboarding: data.onboarding,
        commercialTerms: data.commercialTerms,
        specificNote: data.specificNote,
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.proposal.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.proposal.delete({ where: { id } });
  }

  async closeProposal(id: string, data: any) {
    return this.prisma.proposal.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedPlanId: data.planId, closedPrice: data.price },
    });
  }

  async markAsLost(id: string, data: any) {
    return this.prisma.proposal.update({
      where: { id },
      data: { status: 'LOST', lossReason: data.reason },
    });
  }

  async trackWhatsAppClick(slug: string) {
    await this.prisma.proposal.update({ where: { slug }, data: { whatsappClicks: { increment: 1 } } });
  }

  // =================================================================
  // 📊 MÉTODOS DE DASHBOARD E GRÁFICOS
  // =================================================================
  async getDashboardStats(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);

    const [total, sent, closed, lost] = await Promise.all([
      this.prisma.proposal.count({ where: { companyId, ...dateFilter } }),
      this.prisma.proposal.count({ where: { companyId, status: 'SENT', ...dateFilter } }),
      this.prisma.proposal.count({ where: { companyId, status: 'CLOSED', ...dateFilter } }),
      this.prisma.proposal.count({ where: { companyId, status: 'LOST', ...dateFilter } }),
    ]);

    const closedProposals = await this.prisma.proposal.findMany({
      where: { companyId, status: 'CLOSED', ...dateFilter },
      select: { closedPrice: true },
    });

    const totalGain = closedProposals.reduce((sum, p) => sum + (p.closedPrice || 0), 0);
    const conversion = total > 0 ? (closed / total) * 100 : 0;

    return { totalProposals: total, sent, closed, lost, conversion: Number(conversion.toFixed(1)), totalGain };
  }

  async getTrendData(companyId: string, period?: string) {
    const months = this.getMonths(period);
    const data = [];

    for (const month of months) {
      const [sent, closed, lost] = await Promise.all([
        this.prisma.proposal.count({ where: { companyId, status: 'SENT', createdAt: { gte: month.start, lte: month.end } } }),
        this.prisma.proposal.count({ where: { companyId, status: 'CLOSED', createdAt: { gte: month.start, lte: month.end } } }),
        this.prisma.proposal.count({ where: { companyId, status: 'LOST', createdAt: { gte: month.start, lte: month.end } } }),
      ]);

      data.push({ month: month.label, sent, closed, lost });
    }
    return data;
  }

  async getLossReasonsData(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);
    const proposals = await this.prisma.proposal.findMany({
      where: { companyId, status: 'LOST', ...dateFilter },
      select: { lossReason: true },
    });

    const reasons: Record<string, number> = {};
    proposals.forEach((p) => {
      const reason = p.lossReason || 'Não informado';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return Object.entries(reasons).map(([name, value]) => ({ name, value }));
  }

  async getConversionTrend(companyId: string, period?: string) {
    const months = this.getMonths(period);
    const data = [];

    for (const month of months) {
      const total = await this.prisma.proposal.count({
        where: { companyId, createdAt: { gte: month.start, lte: month.end } },
      });
      const closed = await this.prisma.proposal.count({
        where: { companyId, status: 'CLOSED', createdAt: { gte: month.start, lte: month.end } },
      });
      
      const revenue = await this.prisma.proposal.findMany({
        where: { companyId, status: 'CLOSED', createdAt: { gte: month.start, lte: month.end } },
        select: { closedPrice: true },
      });
      const totalRevenue = revenue.reduce((sum, p) => sum + (p.closedPrice || 0), 0);
      const conversionRate = total > 0 ? (closed / total) * 100 : 0;

      data.push({ month: month.label, total, closed, revenue: totalRevenue, conversionRate });
    }
    return data;
  }

  // =================================================================
  // 🔧 UTILITÁRIOS DE DATA
  // =================================================================
  private getDateFilter(period?: string) {
    if (!period || period === 'all') return {};
    const months = parseInt(period);
    const now = new Date();
    return { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - months, 1) } };
  }

  private getMonths(period?: string) {
    const count = period === 'all' ? 12 : parseInt(period) || 6;
    const now = new Date();
    const months = [];

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleDateString('pt-BR', { month: 'short' }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
      });
    }
    return months;
  }
}