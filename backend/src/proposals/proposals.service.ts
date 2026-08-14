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

  // =================================================================
  // 🌐 MÉTODOS PÚBLICOS (Página Pública da Proposta)
  // =================================================================

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
            serviceItem: {
              include: { category: true },
            },
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

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada.');
    }

    return proposal;
  }

  /**
   * 👁️ TRACK DE VISUALIZAÇÃO (Métrica de engajamento)
   * Incrementa o contador de views da proposta
   */
  async trackView(slug: string) {
    return this.prisma.proposal.update({
      where: { slug },
      data: {
        views: { increment: 1 },
      },
    });
  }

  /**
   * 💬 TRACK DE CLIQUE NO WHATSAPP (Métrica de conversão)
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
  // 📊 MÉTRICAS E DASHBOARDS
  // =================================================================
  
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { createdAt: { gte: startDate, lte: now } };
  }

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

  async getConversionTrend(companyId: string, period?: string) {
    const now = new Date();
    const months: { month: string; total: number; won: number; rate: number }[] = [];

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
    // =================================================================
  // 🆕 SPRINT A3: Versões de Proposta
  // =================================================================

  /**
   * Lista todas as versões de proposta para um cliente específico.
   * Agrupa por originalProposalId (ou pelo próprio ID se for a primeira).
   *
   * 🧠 DECISÃO TÉCNICA:
   * Agrupamento em memória (Map) é O(N) e simples. Para centenas de propostas
   * por cliente é mais que suficiente. Se um dia tivermos milhares,
   * mover para GROUP BY no SQL.
   */
  async getProposalsByClient(companyId: string, clientName: string) {
    // Busca propostas cujo clientName contenha o termo (case-insensitive)
    const proposals = await this.prisma.proposal.findMany({
      where: {
        companyId,
        clientName: { contains: clientName, mode: 'insensitive' },
      },
      orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
      include: {
        items: {
          include: {
            commercialPlan: true,
            serviceItem: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Agrupa por cadeia de versão (originalProposalId ou próprio ID)
    const grouped = new Map<string, any[]>();
    proposals.forEach((p) => {
      const key = p.originalProposalId || p.id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });

    return Array.from(grouped.entries()).map(([groupId, versions]) => {
      const sorted = versions.sort((a, b) => b.version - a.version);
      return {
        groupId,
        clientName: versions[0].clientName,
        clientCnpj: versions[0].clientCnpj,
        totalVersions: versions.length,
        currentVersion: sorted.find((v) => v.isCurrent) || sorted[0],
        allVersions: sorted,
      };
    });
  }

  /**
   * Cria uma nova versão de uma proposta existente.
   *
   * Regras:
   * 1. Busca a proposta original (com itens).
   * 2. Marca a anterior como isCurrent = false.
   * 3. Cria a nova cópia com version = anterior + 1 e isCurrent = true.
   * 4. Duplica todos os ProposalItems.
   * 5. Tudo em transação atômica (se algo falhar, nada é gravado).
   */
  async createNewVersion(proposalId: string, companyId: string, userId: string) {
    // 1. Buscar original com itens
    const original = await this.prisma.proposal.findFirst({
      where: { id: proposalId, companyId },
      include: { items: true },
    });

    if (!original) {
      throw new Error('Proposta original não encontrada.');
    }

    const newVersion = original.version + 1;
    const newProposalNumber = `${original.proposalNumber}-v${newVersion}`;
    const newSlug = `${original.slug}-v${newVersion}`;

    // 2. Transação atômica
    return this.prisma.$transaction(async (tx) => {
      // 2.1. Desmarcar a versão anterior como atual
      await tx.proposal.update({
        where: { id: proposalId },
        data: { isCurrent: false },
      });

      // 2.2. Criar a nova proposta (cópia da original)
      const newProposal = await tx.proposal.create({
        data: {
          companyId,
          userId,
          proposalNumber: newProposalNumber,
          slug: newSlug,
          clientName: original.clientName,
          clientCnpj: original.clientCnpj,
          taxRegime: original.taxRegime,
          activity: original.activity,
          monthlyRevenue: original.monthlyRevenue,
          employeeCount: original.employeeCount,
          basePrice: original.basePrice,
          aboutOffice: original.aboutOffice,
          differentials: original.differentials,
          onboarding: original.onboarding,
          commercialTerms: original.commercialTerms,
          specificNote: original.specificNote,
          status: 'DRAFT', // Nova versão sempre começa como rascunho
          version: newVersion,
          isCurrent: true,
          originalProposalId: original.originalProposalId || original.id,
        },
      });

      // 2.3. Duplicar os itens
      if (original.items.length > 0) {
        await tx.proposalItem.createMany({
          data: original.items.map((item) => ({
            proposalId: newProposal.id,
            commercialPlanId: item.commercialPlanId,
            serviceItemId: item.serviceItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      // 2.4. Retornar a nova proposta enriquecida
      return tx.proposal.findUnique({
        where: { id: newProposal.id },
        include: {
          items: {
            include: { commercialPlan: true, serviceItem: true },
          },
        },
      });
    });
  }
}