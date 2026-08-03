/**
 * ProposalsService
 * Gerencia a criação, visualização e fechamento de propostas comerciais.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gera um slug amigável a partir do nome do cliente.
   * Ex: "QUERENCIA AMADA LTDA" → "querencia-amada-ltda"
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Gera o número da proposta no formato 0001/2026
   */
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

  /**
   * Cria uma nova proposta comercial.
   */
  async create(companyId: string, userId: string, data: any) {
    const slug = this.generateSlug(data.clientName);
    
    // Garante slug único
    let finalSlug = slug;
    let counter = 1;
    while (await this.prisma.proposal.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const proposalNumber = await this.generateProposalNumber(companyId);

    return this.prisma.proposal.create({
      data: {
        companyId,
        userId,
        proposalNumber,
        slug: finalSlug,
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

  /**
   * Busca proposta pública pelo slug (sem autenticação).
   * Incrementa contador de visualizações.
   */
  async getPublicBySlug(slug: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { slug },
      include: {
        company: {
          select: {
            name: true,
            cnpj: true,
            state: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada.');
    }

    // Incrementa visualizações
    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: { views: { increment: 1 } },
    });

    return {
      ...proposal,
      includedPlans: JSON.parse(proposal.includedPlans as any),
    };
  }

  /**
   * Lista propostas da empresa (autenticado).
   */
  async list(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;

    const proposals = await this.prisma.proposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    return proposals.map((p) => ({
      ...p,
      includedPlans: JSON.parse(p.includedPlans as any),
    }));
  }

  /**
   * Busca uma proposta específica pelo ID.
   */
  async getById(companyId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, companyId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada.');
    }

    return {
      ...proposal,
      includedPlans: JSON.parse(proposal.includedPlans as any),
    };
  }

  /**
   * Atualiza o conteúdo de uma proposta.
   */
  async updateContent(id: string, companyId: string, data: any) {
    await this.getById(companyId, id);

    return this.prisma.proposal.update({
      where: { id },
      data: {
        aboutOffice: data.aboutOffice,
        differentials: data.differentials,
        onboarding: data.onboarding,
        commercialTerms: data.commercialTerms,
        specificNote: data.specificNote,
      },
    });
  }

  /**
   * Registra o fechamento de uma proposta.
   */
  async close(id: string, companyId: string, data: {
    planId: string;
    planName: string;
    price: number;
    discount?: number;
  }) {
    const proposal = await this.getById(companyId, id);

    const finalPrice = data.price - (data.discount || 0);

    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedPlanId: data.planId,
        closedPrice: finalPrice,
      },
    });
  }

  /**
   * Marca proposta como perdida.
   */
  async markAsLost(id: string, companyId: string, reason: string) {
    await this.getById(companyId, id);

    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: 'LOST',
        lossReason: reason,
      },
    });
  }

  /**
   * Registra clique no WhatsApp.
   */
  async trackWhatsappClick(id: string) {
    await this.prisma.proposal.update({
      where: { id },
      data: { whatsappClicks: { increment: 1 } },
    });
  }

  /**
   * Dashboard de desempenho comercial.
   */
  async getDashboard(companyId: string) {
    const proposals = await this.prisma.proposal.findMany({
      where: { companyId },
    });

    const sent = proposals.filter((p) => p.status === 'SENT').length;
    const closed = proposals.filter((p) => p.status === 'CLOSED').length;
    const lost = proposals.filter((p) => p.status === 'LOST').length;
    const conversion = sent > 0 ? (closed / sent) * 100 : 0;

    const totalGain = proposals
      .filter((p) => p.status === 'CLOSED' && p.closedPrice)
      .reduce((sum, p) => sum + (p.closedPrice || 0), 0);

    return {
      sent,
      closed,
      lost,
      conversion: Math.round(conversion * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      totalProposals: proposals.length,
    };
  }
}