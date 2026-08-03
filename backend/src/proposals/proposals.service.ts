// =================================================================
// INÍCIO: proposals.service.ts
// =================================================================
/**
 * ProposalsService
 * Gerencia a criação, visualização e fechamento de propostas comerciais.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  private async generateProposalNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const lastProposal = await this.prisma.proposal.findFirst({
      where: { companyId, proposalNumber: { contains: `/${year}` } },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastProposal) {
      const lastNum = parseInt(lastProposal.proposalNumber.split('/')[0]);
      nextNumber = lastNum + 1;
    }
    return `${String(nextNumber).padStart(4, '0')}/${year}`;
  }

  async create(companyId: string, userId: string, data: any) {
    const slug = this.generateSlug(data.clientName);
    let finalSlug = slug;
    let counter = 1;
    while (await this.prisma.proposal.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const proposalNumber = await this.generateProposalNumber(companyId);
    return this.prisma.proposal.create({
      data: {
        companyId, userId, proposalNumber, slug: finalSlug,
        clientName: data.clientName, clientCnpj: data.clientCnpj,
        taxRegime: data.taxRegime, activity: data.activity,
        monthlyRevenue: data.monthlyRevenue, employeeCount: data.employeeCount,
        basePrice: data.basePrice,
        includedPlans: JSON.stringify(data.includedPlans || []),
        aboutOffice: data.aboutOffice, differentials: data.differentials,
        onboarding: data.onboarding, commercialTerms: data.commercialTerms,
        specificNote: data.specificNote, status: 'SENT', sentAt: new Date(),
      },
    });
  }

  async getPublicBySlug(slug: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { slug },
      include: {
        company: { select: { name: true, cnpj: true, state: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!proposal) throw new NotFoundException('Proposta não encontrada.');

    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { views: { increment: 1 } },
    });

    return { ...proposal, includedPlans: JSON.parse(proposal.includedPlans as any) };
  }

  async list(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;

    const proposals = await this.prisma.proposal.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return proposals.map((p) => ({ ...p, includedPlans: JSON.parse(p.includedPlans as any) }));
  }

  async getById(companyId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, companyId },
      include: { user: { select: { name: true } } },
    });
    if (!proposal) throw new NotFoundException('Proposta não encontrada.');
    return { ...proposal, includedPlans: JSON.parse(proposal.includedPlans as any) };
  }

  async updateContent(id: string, companyId: string, data: any) {
    await this.getById(companyId, id);
    return this.prisma.proposal.update({
      where: { id },
      data: {
        aboutOffice: data.aboutOffice, differentials: data.differentials,
        onboarding: data.onboarding, commercialTerms: data.commercialTerms,
        specificNote: data.specificNote,
      },
    });
  }

  async close(id: string, companyId: string, data: { planId: string; planName: string; price: number; discount?: number }) {
    await this.getById(companyId, id);
    const finalPrice = data.price - (data.discount || 0);
    return this.prisma.proposal.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedPlanId: data.planId, closedPrice: finalPrice },
    });
  }

  async markAsLost(id: string, companyId: string, reason: string) {
    await this.getById(companyId, id);
    return this.prisma.proposal.update({
      where: { id },
      data: { status: 'LOST', lossReason: reason },
    });
  }

  async trackWhatsappClick(id: string) {
    await this.prisma.proposal.update({
      where: { id },
      data: { whatsappClicks: { increment: 1 } },
    });
  }

  async getDashboard(companyId: string) {
    const proposals = await this.prisma.proposal.findMany({ where: { companyId } });
    const sent = proposals.filter((p) => p.status === 'SENT').length;
    const closed = proposals.filter((p) => p.status === 'CLOSED').length;
    const lost = proposals.filter((p) => p.status === 'LOST').length;
    const conversion = sent > 0 ? (closed / sent) * 100 : 0;
    const totalGain = proposals
      .filter((p) => p.status === 'CLOSED' && p.closedPrice)
      .reduce((sum, p) => sum + (p.closedPrice || 0), 0);

    return {
      sent, closed, lost,
      conversion: Math.round(conversion * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      totalProposals: proposals.length,
    };
  }

  // =================================================================
  // INÍCIO: getTrendData (Com Filtro de Período)
  // =================================================================
  async getTrendData(companyId: string, period: string = '6') {
    const now = new Date();
    let monthsToLookBack = 6;
    if (period === '3') monthsToLookBack = 3;
    else if (period === '12') monthsToLookBack = 12;
    else if (period === 'all') monthsToLookBack = 60; // 5 anos para "Todo o período"

    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToLookBack + 1, 1);

    const proposals = await this.prisma.proposal.findMany({
      where: {
        companyId,
        createdAt: period === 'all' ? undefined : { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyData: any = {};
    for (let i = monthsToLookBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = {
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        sent: 0, closed: 0, lost: 0, revenue: 0,
      };
    }

    proposals.forEach((prop) => {
      const date = new Date(prop.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        if (prop.status === 'SENT' || prop.status === 'CLOSED' || prop.status === 'LOST') {
          monthlyData[key].sent++;
        }
        if (prop.status === 'CLOSED') {
          monthlyData[key].closed++;
          monthlyData[key].revenue += prop.closedPrice || 0;
        }
        if (prop.status === 'LOST') {
          monthlyData[key].lost++;
        }
      }
    });

    return Object.values(monthlyData).map((data: any) => ({
      ...data,
      revenue: Math.round(data.revenue * 100) / 100,
    }));
  }
  // =================================================================
  // FIM: getTrendData
  // =================================================================

  // =================================================================
  // INÍCIO: getLossReasonsData (Com Filtro de Período)
  // =================================================================
  async getLossReasonsData(companyId: string, period: string = '6') {
    const now = new Date();
    let monthsToLookBack = 6;
    if (period === '3') monthsToLookBack = 3;
    else if (period === '12') monthsToLookBack = 12;
    else if (period === 'all') monthsToLookBack = 60;

    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsToLookBack + 1, 1);

    const lostProposals = await this.prisma.proposal.findMany({
      where: {
        companyId,
        status: 'LOST',
        createdAt: period === 'all' ? undefined : { gte: startDate },
      },
      select: { lossReason: true },
    });

    const reasonsCount: Record<string, number> = {};
    lostProposals.forEach((prop) => {
      const reason = prop.lossReason || 'Não informado';
      reasonsCount[reason] = (reasonsCount[reason] || 0) + 1;
    });

    return Object.entries(reasonsCount).map(([name, value]) => ({ name, value }));
  }
  // =================================================================
  // FIM: getLossReasonsData
  // =================================================================
}
// =================================================================
// FIM: proposals.service.ts
// =================================================================