import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommercialPlanDto } from './dto/create-commercial-plan.dto';
import { UpdateCommercialPlanDto } from './dto/update-commercial-plan.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { resolvePlanInheritance, PlanInput } from './domain/plan-inheritance';
import { ResolvedPlanDto, ResolvedServiceItemDto } from './dto/resolved-plan.dto';
import {
  planPriceFromReference,
  relativePercentVsBase,
  calcMoneyOnTable,
} from './domain/pricing-insights';
import { CalculatePricingInsightsDto, PlanWithInsightsDto } from './dto/pricing-insights.dto';
/**
 * =================================================================
 * 🏢 CommercialPlansService — Gestão do Catálogo Enterprise
 * =================================================================
 * 🛡️ Proteção Multi-Tenant | 🔒 Soft Delete | ✅ Validação de Integridade
 * =================================================================
 */
@Injectable()
export class CommercialPlansService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 🏢 PLANOS COMERCIAIS
  // =================================================================

  async getPlans(companyId: string) {
    const plans = await this.prisma.commercialPlan.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { multiplier: 'asc' },
      include: {
        planItems: {
          include: {
            serviceItem: {
              include: { category: true },
            },
          },
        },
      },
    });

    return plans.map((plan) => ({
      ...plan,
      itemCount: plan.planItems.length,
      items: plan.planItems.map((pi) => ({
        id: pi.serviceItem.id,
        name: pi.serviceItem.name,
        categoryId: pi.serviceItem.categoryId,
        categoryName: pi.serviceItem.category.name,
      })),
    }));
  }

  async getPlanById(id: string, companyId: string) {
    const plan = await this.prisma.commercialPlan.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        planItems: {
          include: {
            serviceItem: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('Plano não encontrado.');
    return plan;
  }

  async createPlan(companyId: string, dto: CreateCommercialPlanDto) {
    const { itemIds, ...planData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.commercialPlan.create({
        data: { companyId, ...planData },
      });

      if (itemIds && itemIds.length > 0) {
        await tx.planServiceItem.createMany({
          data: itemIds.map((serviceItemId) => ({
            planId: plan.id,
            serviceItemId,
          })),
        });
      }

      return this.getPlanById(plan.id, companyId);
    });
  }

  /**
   * Atualização parcial (aceita só itemIds, só name, etc.)
   */
  async updatePlan(
    id: string,
    companyId: string,
    dto: UpdateCommercialPlanDto,
  ) {
    await this.getPlanById(id, companyId);

    const { itemIds, ...planData } = dto;

    // Remove campos undefined para não enviar lixo ao Prisma
    const cleanData = Object.fromEntries(
      Object.entries(planData).filter(([_, value]) => value !== undefined),
    );

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(cleanData).length > 0) {
        await tx.commercialPlan.update({
          where: { id },
          data: cleanData,
        });
      }

      if (itemIds !== undefined) {
        await tx.planServiceItem.deleteMany({ where: { planId: id } });

        if (itemIds.length > 0) {
          await tx.planServiceItem.createMany({
            data: itemIds.map((serviceItemId) => ({
              planId: id,
              serviceItemId,
            })),
          });
        }
      }

      return this.getPlanById(id, companyId);
    });
  }

  async deletePlan(id: string, companyId: string) {
    await this.getPlanById(id, companyId);

    const activeContracts = await this.prisma.clientContract.count({
      where: { commercialPlanId: id, status: 'ATIVO' },
    });

    if (activeContracts > 0) {
      throw new BadRequestException(
        `Não é possível excluir o plano. Existem ${activeContracts} contrato(s) ativo(s) vinculados.`,
      );
    }

    return this.prisma.commercialPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =================================================================
  // 📁 CATEGORIAS DE SERVIÇO
  // =================================================================

  async getCategories(companyId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { items: true } },
        items: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getCategoryById(id: string, companyId: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return category;
  }

  async createCategory(companyId: string, dto: CreateServiceCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: { companyId, ...dto },
    });
  }

  async updateCategory(
    id: string,
    companyId: string,
    dto: CreateServiceCategoryDto,
  ) {
    await this.getCategoryById(id, companyId);

    return this.prisma.serviceCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string, companyId: string) {
    await this.getCategoryById(id, companyId);

    const activeItems = await this.prisma.serviceItem.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (activeItems > 0) {
      throw new BadRequestException(
        `Não é possível excluir a categoria. Existem ${activeItems} item(ns) ativo(s) vinculados.`,
      );
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =================================================================
  // 📦 ITENS DE SERVIÇO
  // =================================================================

  async getServiceItems(companyId: string, categoryId?: string) {
    const where: any = { companyId, deletedAt: null };
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.serviceItem.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });
  }

  async getServiceItemById(id: string, companyId: string) {
    const item = await this.prisma.serviceItem.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true },
    });

    if (!item) throw new NotFoundException('Item de serviço não encontrado.');
    return item;
  }

  async createServiceItem(companyId: string, dto: CreateServiceItemDto) {
    await this.getCategoryById(dto.categoryId, companyId);

    return this.prisma.serviceItem.create({
      data: {
        company: { connect: { id: companyId } },
        category: { connect: { id: dto.categoryId } },
        name: dto.name,
        description: dto.description,
        scope: dto.scope,
        outOfScope: dto.outOfScope,
        requiredDocs: dto.requiredDocs,
        basePrice: dto.basePrice,
        estimatedHours: dto.estimatedHours ?? 1,
        slaDays: dto.slaDays,
        recurrence: dto.recurrence,
        order: dto.order,
        isActive: dto.isActive ?? true,
      } as any,
      include: { category: true },
    });
  }

  async updateServiceItem(
    id: string,
    companyId: string,
    dto: CreateServiceItemDto,
  ) {
    await this.getServiceItemById(id, companyId);

    if (dto.categoryId) {
      await this.getCategoryById(dto.categoryId, companyId);
    }

    const updateData: any = {};
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.scope !== undefined) updateData.scope = dto.scope;
    if (dto.outOfScope !== undefined) updateData.outOfScope = dto.outOfScope;
    if (dto.requiredDocs !== undefined) updateData.requiredDocs = dto.requiredDocs;
    if (dto.basePrice !== undefined) updateData.basePrice = dto.basePrice;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;
    if (dto.slaDays !== undefined) updateData.slaDays = dto.slaDays;
    if (dto.recurrence !== undefined) updateData.recurrence = dto.recurrence;
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.serviceItem.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async deleteServiceItem(id: string, companyId: string) {
    await this.getServiceItemById(id, companyId);

    const activeContracts = await this.prisma.clientService.count({
      where: { serviceItemId: id, status: 'ATIVO' },
    });

    if (activeContracts > 0) {
      throw new BadRequestException(
        `Não é possível excluir o item. Existem ${activeContracts} contrato(s) ativo(s) vinculados.`,
      );
    }

    return this.prisma.serviceItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =================================================================
  // 💾 SALVAR CONFIGURAÇÃO COMPLETA (Legacy)
  // =================================================================

  async savePlansConfiguration(companyId: string, plansData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const plan of plansData) {
        let savedPlan;
        if (plan.id) {
          savedPlan = await tx.commercialPlan.update({
            where: { id: plan.id },
            data: {
              name: plan.name,
              multiplier: plan.multiplier,
              order: plan.order,
              isIndependent: plan.isIndependent,
              badge: plan.badge,
              color: plan.color,
              description: plan.description,
            },
          });
        } else {
          savedPlan = await tx.commercialPlan.create({
            data: {
              companyId,
              name: plan.name,
              multiplier: plan.multiplier,
              order: plan.order,
              isIndependent: plan.isIndependent,
              badge: plan.badge,
              color: plan.color,
              description: plan.description,
            },
          });
        }

        await tx.planServiceItem.deleteMany({
          where: { planId: savedPlan.id },
        });

        const itemIds = (plan.items || [])
          .map((item: any) => item.id)
          .filter(Boolean);
        if (itemIds.length > 0) {
          await tx.planServiceItem.createMany({
            data: itemIds.map((serviceItemId: string) => ({
              planId: savedPlan.id,
              serviceItemId,
            })),
          });
        }

        const updatedPlan = await tx.commercialPlan.findUnique({
          where: { id: savedPlan.id },
          include: {
            planItems: {
              include: {
                serviceItem: {
                  include: { category: true },
                },
              },
            },
          },
        });

        results.push({
          ...updatedPlan,
          itemCount: updatedPlan!.planItems.length,
          items: updatedPlan!.planItems.map((pi: any) => ({
            id: pi.serviceItem.id,
            name: pi.serviceItem.name,
            categoryId: pi.serviceItem.categoryId,
            categoryName: pi.serviceItem.category.name,
          })),
        });
      }

      return results;
    });
  }

  // =================================================================
  //  SPRINT A2: Planos Resolvidos (Herança + Dinheiro na Mesa)
  // =================================================================
  /**
   * Busca os planos, aplica o motor de herança (domínio A1) e devolve
   * a estrutura enriquecida para o Frontend.
   * 
   * 🧠 DECISÃO TÉCNICA (Performance):
   * Usamos um Map (itemMap) para cachear os itens em memória O(1).
   * Isso evita que tenhamos que fazer N queries adicionais ou loops
   * aninhados complexos para resolver os IDs retornados pelo domínio.
   */
  async getResolvedPlans(companyId: string): Promise<ResolvedPlanDto[]> {
    // 1. Buscar dados brutos do banco (mesma query do getPlans)
    const dbPlans = await this.prisma.commercialPlan.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { multiplier: 'asc' },
      include: {
        planItems: {
          include: {
            serviceItem: {
              include: { category: true },
            },
          },
        },
      },
    });

    // 2. Mapear para a interface do Domínio (PlanInput)
    const domainPlans: PlanInput[] = dbPlans.map((p) => ({
      id: p.id,
      name: p.name,
      multiplier: p.multiplier,
      independent: p.isIndependent, // 🔄 DB usa isIndependent, Domínio usa independent
      ownItemIds: p.planItems.map((pi) => pi.serviceItemId),
    }));

    // 3.  Aplicar o Motor de Herança (Sprint A1)
    const resolvedDomainPlans = resolvePlanInheritance(domainPlans);

    // 4. Criar um "Dicionário" (Map) de itens para lookup rápido O(1)
    const itemMap = new Map<string, ResolvedServiceItemDto>();
    dbPlans.forEach((p) => {
      p.planItems.forEach((pi) => {
        itemMap.set(pi.serviceItemId, {
          id: pi.serviceItem.id,
          name: pi.serviceItem.name,
          categoryId: pi.serviceItem.categoryId,
          categoryName: pi.serviceItem.category.name,
          isInherited: false, // Default, será sobrescrito no passo 5
        });
      });
    });

    // 5. Montar o DTO final enriquecido
    return resolvedDomainPlans.map((r) => {
      // Helper para buscar item e marcar se é herdado
      const resolveItem = (id: string, isInherited: boolean): ResolvedServiceItemDto | null => {
        const item = itemMap.get(id);
        if (!item) return null; // Segurança: item pode ter sido deletado
        return { ...item, isInherited };
      };

      return {
        id: r.id,
        name: r.name,
        multiplier: r.multiplier,
        isIndependent: r.independent,
        order: r.order,
        badge: (dbPlans.find((p) => p.id === r.id) as any)?.badge,
        color: (dbPlans.find((p) => p.id === r.id) as any)?.color,
        description: (dbPlans.find((p) => p.id === r.id) as any)?.description,
        
        ownItems: r.ownItemIds
          .map((id) => resolveItem(id, false))
          .filter((item): item is ResolvedServiceItemDto => item !== null),
          
        inheritedItems: r.inheritedItemIds
          .map((id) => resolveItem(id, true))
          .filter((item): item is ResolvedServiceItemDto => item !== null),
          
        allItems: r.allItemIds
          .map((id) => resolveItem(id, r.inheritedItemIds.includes(id)))
          .filter((item): item is ResolvedServiceItemDto => item !== null),
      };
    });
  }

    // =================================================================
  // 💰 SPRINT A2: Planos com Insights de Preço (Dinheiro na Mesa)
  // =================================================================
  /**
   * Pega os planos já resolvidos (com herança) e aplica a matemática de preço.
   * 
   * @param companyId - ID da empresa (multi-tenant)
   * @param baseValue - Valor de referência para calcular os preços dos planos
   * @param currentMonthly - (Opcional) Valor que o cliente paga hoje, para calcular a perda
   */
  async getPlansWithInsights(
    companyId: string,
    baseValue: number,
    currentMonthly?: number,
  ): Promise<PlanWithInsightsDto[]> {
    // 1. Reutilizamos o motor de herança já validado na Parte 1
    const resolvedPlans = await this.getResolvedPlans(companyId);

    // 2. Enriquecemos cada plano com a matemática do domínio puro
    return resolvedPlans.map((plan) => {
      const calculatedPrice = planPriceFromReference(baseValue, plan.multiplier);
      const percentVsBase = relativePercentVsBase(plan.multiplier);

      let moneyOnTable = undefined;
      // Se o usuário passou quanto o cliente paga hoje, calculamos a diferença
      if (currentMonthly !== undefined) {
        moneyOnTable = calcMoneyOnTable(currentMonthly, calculatedPrice);
      }

      return {
        ...plan,
        calculatedPrice,
        percentVsBase,
        moneyOnTable,
      };
    });
  }
}