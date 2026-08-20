// =================================================================
// INÍCIO: backend/src/proposals/proposals.service.ts
// =================================================================
/**
 * =================================================================
 * ProposalsService — Sprints A1..A7 (ciclo comercial completo)
 * =================================================================
 * Responsabilidades:
 * - CRUD de propostas com itens relacionais (ProposalItem).
 * - Página pública (findBySlug + tracking de views/WhatsApp).
 * - Funil de status (SENT / VIEWED / CLOSED_WON / CLOSED_LOST).
 * - Métricas e dashboards (conversão, tendências, motivos de perda).
 * - Sprint A3: versões de proposta (cadeia por originalProposalId).
 * - Sprint A4: fechamento com ganho (domínio puro closing-gain).
 * - Sprint A5: findBySlug devolve `branding` white-label (ADR-043).
 * - Sprint A7: 🆕 getPerformance (funil + ganho acumulado + top fechamentos).
 *
 * 🧠 ADRs: ADR-013 (propostas relacionais) • ADR-020 (round2 no
 *    domínio) • ADR-043 (fallback de cores no branding).
 * =================================================================
 */
import { PrismaService } from '../prisma/prisma.service';
import { ProposalStatus } from '@prisma/client';
import { calcClosingGain } from '../commercial-plans/domain/closing-gain';
import { CloseProposalDto } from './dto/close-proposal.dto';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 📋 CRUD DE PROPOSTAS (com ProposalItem relacional)
  // =================================================================

  /** Lista propostas do tenant, opcionalmente filtradas por status. */
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

  /** Busca 1 proposta do tenant (404 se não existir / não pertencer). */
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
   * Cria proposta com proposalNumber único (PROP-YYYYMM-NNNN,
   * contador mensal do tenant) e slug não-sequencial (segurança).
   */
  async create(companyId: string, userId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Gera proposalNumber único: PROP-YYYYMM-NNNN
      const now = new Date();
      const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const prefix = `PROP-${ym}-`;

      const lastProposal = await tx.proposal.findFirst({
        where: {
          companyId,
          proposalNumber: { startsWith: prefix },
        },
        orderBy: { proposalNumber: 'desc' },
        select: { proposalNumber: true },
      });

      const lastSeq = lastProposal
        ? parseInt(lastProposal.proposalNumber.split('-')[2] || '0', 10)
        : 0;
      const proposalNumber = `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;

      // 2) Slug único: nome normalizado + timestamp (não expõe ID)
      const baseSlug =
        (data.clientName || 'proposta')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60) || 'proposta';
      const slug = `${baseSlug}-${Date.now()}`;

      // 3) Cria a proposta (nasce DRAFT)
      const proposal = await tx.proposal.create({
        data: {
          companyId,
          userId,
          proposalNumber,
          slug,
          clientName: data.clientName || 'Sem nome',
          clientCnpj: data.clientCnpj || null,
          taxRegime: data.taxRegime || 'SIMPLES',
          activity: data.activity || '',
          monthlyRevenue: data.monthlyRevenue || 0,
          employeeCount: data.employeeCount || 0,
          basePrice: data.basePrice || 0,
          aboutOffice: data.aboutOffice || null,
          differentials: data.differentials || null,
          onboarding: data.onboarding || null,
          commercialTerms: data.commercialTerms || null,
          specificNote: data.specificNote || null,
          status: 'DRAFT',
        },
      });

      return proposal;
    });
  }

  /** Atualiza dados da proposta (textos, valores, prospect). */
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

  /** Exclui proposta (valida posse do tenant antes). */
  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.delete({ where: { id } });
  }

  // =================================================================
  // 🌐 MÉTODOS PÚBLICOS (Página Pública da Proposta)
  // =================================================================

  /**
   * 🆕 SPRINT A5 — Busca proposta pública pelo slug e devolve o
   * objeto `branding` derivado (cores/logo/rodapé) COM FALLBACK
   * Conta Certa (ADR-043). O frontend público só consome `branding`.
   */
  async findBySlug(slug: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            commercialPlan: true,
            serviceItem: { include: { category: true } },
          },
        },
        company: {
          select: {
            name: true,
            logoUrl: true,
            email: true,
            phone: true,
            // 🆕 Sprint A5 — colunas white-label
            primaryColor: true,
            secondaryColor: true,
            proposalFooterText: true,
          },
        },
      },
    });

    if (!proposal) throw new NotFoundException('Proposta não encontrada.');

    // 🎨 Branding derivado: null vira fallback Conta Certa (ADR-043)
    const branding = {
      companyName: proposal.company?.name ?? '',
      logoUrl: proposal.company?.logoUrl ?? null,
      primaryColor: proposal.company?.primaryColor || '#0d9488',
      secondaryColor: proposal.company?.secondaryColor || '#f97316',
      proposalFooterText: proposal.company?.proposalFooterText ?? null,
    };

    return { ...proposal, branding };
  }

  /** Incrementa contador de views (página pública). */
  async trackView(slug: string) {
    return this.prisma.proposal.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });
  }

  /** Incrementa contador de cliques no WhatsApp (engajamento). */
  async trackWhatsAppClick(slug: string) {
    return this.prisma.proposal.update({
      where: { slug },
      data: { whatsappClicks: { increment: 1 } },
    });
  }

  // =================================================================
  // 📊 STATUS DA PROPOSTA (funil)
  // =================================================================

  /** Marca como ENVIADA (registra sentAt). */
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

  /** Marca como VIEWED (cliente abriu o link). */
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

  /** LEGADO: fechamento simples (body {planId, price}). */
  async closeProposal(
    id: string,
    companyId: string,
    body: { planId?: string; price?: number },
  ) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.CLOSED_WON,
        closedAt: new Date(),
        closedPrice: body.price ?? null,
        closedPlanId: body.planId ?? null,
      },
    });
  }

  /** Marca como PERDIDA com motivo (alimenta BI de vendas). */
  async markAsLost(id: string, companyId: string, reason: string) {
    await this.findOne(id, companyId);
    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: ProposalStatus.CLOSED_LOST,
        closedAt: new Date(),
        lossReason: reason,
      },
    });
  }

  // =================================================================
  // 📊 MÉTRICAS E DASHBOARDS
  // =================================================================

  /** Filtro de período compartilhado pelos relatórios. */
  private getDateFilter(period?: string): { createdAt?: any } {
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

  /** KPIs do dashboard comercial (funil + conversão + receita). */
  async getDashboardStats(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);
    const [totalProposals, wonProposals, lostProposals, sentProposals] =
      await Promise.all([
        this.prisma.proposal.count({ where: { companyId, ...dateFilter } }),
        this.prisma.proposal.count({
          where: { companyId, status: ProposalStatus.CLOSED_WON, ...dateFilter },
        }),
        this.prisma.proposal.count({
          where: { companyId, status: ProposalStatus.CLOSED_LOST, ...dateFilter },
        }),
        this.prisma.proposal.count({
          where: { companyId, status: ProposalStatus.SENT, ...dateFilter },
        }),
      ]);

    const conversionRate =
      totalProposals > 0 ? (wonProposals / totalProposals) * 100 : 0;

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

  /** Série temporal diária (criadas/ganhas/perdidas/receita). */
  async getTrendData(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);
    const proposals = await this.prisma.proposal.findMany({
      where: { companyId, ...dateFilter },
      select: { createdAt: true, status: true, closedPrice: true },
      orderBy: { createdAt: 'asc' },
    });

    const groupedByDay: Record<
      string,
      { created: number; won: number; lost: number; revenue: number }
    > = {};

    proposals.forEach((p) => {
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

  /** Agregado de motivos de perda (BI comercial). */
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
    lostProposals.forEach((p) => {
      const reason = p.lossReason || 'Não informado';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return Object.entries(reasons).map(([reason, count]) => ({
      reason,
      count,
    }));
  }

  /** Conversão mensal dos últimos 6 meses. */
  async getConversionTrend(companyId: string, period?: string) {
    const now = new Date();
    const months: { month: string; total: number; won: number; rate: number }[] =
      [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

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
        month: start.toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        total,
        won,
        rate: total > 0 ? Number(((won / total) * 100).toFixed(2)) : 0,
      });
    }

    return months;
  }

  /** Fechamento mensal (criadas/ganhas/perdidas) p/ gráfico anual. */
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
            where: {
              companyId,
              status: ProposalStatus.CLOSED_WON,
              closedAt: { gte: start, lte: end },
            },
          }),
          this.prisma.proposal.count({
            where: {
              companyId,
              status: ProposalStatus.CLOSED_LOST,
              closedAt: { gte: start, lte: end },
            },
          }),
        ]);
        return { month, created, won, lost };
      }),
    );
  }

  // =================================================================
  // 🆕 SPRINT A7: DASHBOARD DE DESEMPENHO
  // =================================================================

  /**
   * 🎯 getPerformance — métricas completas de desempenho comercial.
   *
   * Consome `closingDetails` (A4) para calcular:
   * - Funil de conversão (total → sent → viewed → won/lost)
   * - Taxa de conversão (won ÷ total)
   * - Tempo médio de fechamento (sentAt → closedAt em dias)
   * - Desconto médio praticado (do closingDetails)
   * - Ganho acumulado (monthly/yearly do closingDetails)
   * - Concessão acumulada (quanto abriu mão)
   * - Top 5 fechamentos por ganho mensal
   * - Motivos de perda (reaproveita getLossReasonsData)
   *
   * @param companyId - tenant logado
   * @param period - período (7d, 30d, 90d, 12m, ytd)
   * @returns objeto completo de desempenho
   */
  async getPerformance(companyId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);

    // 1) Funil de conversão
    const [total, sent, viewed, won, lost] = await Promise.all([
      this.prisma.proposal.count({ where: { companyId, ...dateFilter } }),
      this.prisma.proposal.count({
        where: { companyId, status: ProposalStatus.SENT, ...dateFilter },
      }),
      this.prisma.proposal.count({
        where: { companyId, status: ProposalStatus.VIEWED, ...dateFilter },
      }),
      this.prisma.proposal.count({
        where: { companyId, status: ProposalStatus.CLOSED_WON, ...dateFilter },
      }),
      this.prisma.proposal.count({
        where: { companyId, status: ProposalStatus.CLOSED_LOST, ...dateFilter },
      }),
    ]);

    const conversionRate = total > 0 ? (won / total) * 100 : 0;

    // 2) Tempo médio de fechamento (sentAt → closedAt)
    const closedProposals = await this.prisma.proposal.findMany({
      where: {
        companyId,
        status: ProposalStatus.CLOSED_WON,
        sentAt: { not: null },
        closedAt: { not: null },
        ...dateFilter,
      },
      select: { sentAt: true, closedAt: true },
    });

    const avgDaysToClose =
      closedProposals.length > 0
        ? closedProposals.reduce((sum, p) => {
            const days = Math.ceil(
              ((p.closedAt as Date).getTime() - (p.sentAt as Date).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / closedProposals.length
        : 0;

    // 3) Desconto médio praticado (do closingDetails)
    const proposalsWithDetails = await this.prisma.proposal.findMany({
      where: {
        companyId,
        status: ProposalStatus.CLOSED_WON,
        closingDetails: { not: null },
        ...dateFilter,
      },
      select: { closingDetails: true },
    });

    const discounts = proposalsWithDetails
      .map((p) => (p.closingDetails as any)?.discountPercent)
      .filter((d) => d !== undefined && d !== null);

    const avgDiscountPercent =
      discounts.length > 0
        ? discounts.reduce((sum, d) => sum + d, 0) / discounts.length
        : 0;

    // 4) Ganho acumulado (monthly/yearly) + concessão
    const gains = proposalsWithDetails.map((p) => {
      const details = p.closingDetails as any;
      return {
        gainMonthly: details?.gainMonthly ?? 0,
        gainYearly: details?.gainYearly ?? 0,
        concessionMonthly: details?.concessionMonthly ?? 0,
        concessionYearly: details?.concessionYearly ?? 0,
      };
    });

    const totalGainMonthly = gains.reduce((sum, g) => sum + g.gainMonthly, 0);
    const totalGainYearly = gains.reduce((sum, g) => sum + g.gainYearly, 0);
    const totalConcessionMonthly = gains.reduce(
      (sum, g) => sum + g.concessionMonthly,
      0,
    );
    const totalConcessionYearly = gains.reduce(
      (sum, g) => sum + g.concessionYearly,
      0,
    );

    // 5) Top 5 fechamentos por ganho mensal
    const topGains = await this.prisma.proposal.findMany({
      where: {
        companyId,
        status: ProposalStatus.CLOSED_WON,
        closingDetails: { not: null },
        ...dateFilter,
      },
      select: {
        clientName: true,
        closedAt: true,
        closedPrice: true,
        closingDetails: true,
      },
      orderBy: { closedAt: 'desc' },
      take: 50, // busca mais para ordenar em memória pelo ganho
    });

    const topGainsSorted = topGains
      .map((p) => {
        const details = p.closingDetails as any;
        return {
          clientName: p.clientName,
          closedAt: p.closedAt,
          closedPrice: p.closedPrice,
          discountPercent: details?.discountPercent ?? 0,
          gainMonthly: details?.gainMonthly ?? 0,
        };
      })
      .sort((a, b) => b.gainMonthly - a.gainMonthly)
      .slice(0, 5);

    // 6) Motivos de perda (reaproveita método existente)
    const lossReasons = await this.getLossReasonsData(companyId, period);

    return {
      funnel: { total, sent, viewed, won, lost },
      conversionRate: Number(conversionRate.toFixed(2)),
      avgDaysToClose: Number(avgDaysToClose.toFixed(1)),
      avgDiscountPercent: Number(avgDiscountPercent.toFixed(1)),
      gain: {
        monthly: totalGainMonthly,
        yearly: totalGainYearly,
        concessionMonthly: totalConcessionMonthly,
        concessionYearly: totalConcessionYearly,
      },
      topGains: topGainsSorted,
      lossReasons,
    };
  }

  // =================================================================
  // 🆕 SPRINT A3: Versões de Proposta
  // =================================================================

  /** Agrupa propostas em cadeias de versão (por originalProposalId). */
  async getProposalsByClient(companyId: string, clientName: string) {
    const proposals = await this.prisma.proposal.findMany({
      where: {
        companyId,
        clientName: { contains: clientName, mode: 'insensitive' },
      },
      orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
      include: {
        items: {
          include: { commercialPlan: true, serviceItem: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Agrupamento em memória O(N) por cadeia de versões
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
   * Cria nova versão da proposta (duplica itens, incrementa version,
   * marca a anterior como isCurrent=false — transação atômica).
   */
  async createNewVersion(
    proposalId: string,
    companyId: string,
    userId: string,
  ) {
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

    return this.prisma.$transaction(async (tx) => {
      // Desativa a versão anterior
      await tx.proposal.update({
        where: { id: proposalId },
        data: { isCurrent: false },
      });

      // Cria a nova versão (nasce DRAFT + isCurrent)
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
          status: 'DRAFT',
          version: newVersion,
          isCurrent: true,
          originalProposalId: original.originalProposalId || original.id,
        },
      });

      // Duplica os itens da proposta original
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

  // =================================================================
  // 💰 SPRINT A4: Fechamento com Ganho
  // =================================================================

  /**
   * Fecha a proposta com desconto + memória de cálculo (ADR-020/038).
   * Trava: proposta já fechada não pode ser re-fechada.
   */
  async closeWithGain(
    companyId: string,
    proposalId: string,
    dto: CloseProposalDto,
  ) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: proposalId, companyId },
    });

    if (!proposal) throw new NotFoundException('Proposta não encontrada');

    if (
      proposal.status === 'CLOSED_WON' ||
      proposal.status === 'CLOSED_LOST'
    ) {
      throw new BadRequestException(
        'Proposta já fechada — não pode ser re-fechada',
      );
    }

    // 🧮 Domínio puro (ADR-020): cálculo determinístico, round2
    const gain = calcClosingGain({
      idealPrice: proposal.basePrice,
      currentCharge: dto.currentMonthly ?? null,
      discountPercent: dto.discountPercent,
    });

    // 💾 Grava status + preço + memória completa do fechamento
    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'CLOSED_WON',
        closedAt: new Date(),
        closedPrice: gain.finalPrice,
        closedPlanId: dto.closedPlanId ?? null,
        closingDetails: {
          discountPercent: dto.discountPercent,
          currentMonthly: dto.currentMonthly ?? null,
          idealPrice: proposal.basePrice,
          finalPrice: gain.finalPrice,
          concessionMonthly: gain.concessionMonthly,
          concessionYearly: gain.concessionYearly,
          gainMonthly: gain.gainMonthly,
          gainYearly: gain.gainYearly,
          belowCurrent: gain.belowCurrent,
          steps: gain.steps,
          notes: dto.notes ?? null,
        },
      },
    });

    return { proposal: updated, gain };
  }
}
// =================================================================
// FIM: backend/src/proposals/proposals.service.ts
// =================================================================