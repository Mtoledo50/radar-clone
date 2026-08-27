import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// DTOs de Entrada
import { CreateCommercialPlanDto } from './dto/create-commercial-plan.dto';
import { UpdateCommercialPlanDto } from './dto/update-commercial-plan.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';

// Domínio Puro (Sprint A1 - Lógica de Negócio isolada)
import { resolvePlanInheritance, PlanInput } from './domain/plan-inheritance';
import {
  planPriceFromReference,
  relativePercentVsBase,
  calcMoneyOnTable,
} from './domain/pricing-insights';

// DTOs de Saída (Sprint A2)
import { ResolvedPlanDto, ResolvedServiceItemDto } from './dto/resolved-plan.dto';
import { CalculatePricingInsightsDto, PlanWithInsightsDto } from './dto/pricing-insights.dto';

/**
 * =================================================================
 * 🏢 CommercialPlansService — Gestão do Catálogo Enterprise
 * =================================================================
 * Responsabilidade: Gerenciar Planos, Categorias e Itens de Serviço.
 * 
 * 🛡️ Regras de Negócio (ADRs):
 * - ADR-004: Multi-tenant rigoroso (todas as queries filtradas por companyId).
 * - ADR-020: Herança de planos derivada em memória (banco guarda apenas itens próprios).
 * - Soft Delete: Exclusões definem `deletedAt` para preservar histórico de propostas/contratos.
 * - Integridade: Impede exclusão de planos/categorias/itens que possuem vínculos ativos.
 * =================================================================
 */
@Injectable()
export class CommercialPlansService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 🏢 1. PLANOS COMERCIAIS
  // =================================================================

  /**
   * Lista todos os planos da empresa, ordenados pelo multiplicador (do menor para o maior).
   * Inclui a contagem de itens e os detalhes de cada item vinculado.
   */
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

    // Formata a resposta para o frontend, achatando a estrutura de relação N:N
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

  /**
   * Busca um plano específico pelo ID, garantindo que pertence à empresa (companyId).
   */
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

    if (!plan) {
      throw new NotFoundException('Plano não encontrado ou não pertence a esta empresa.');
    }
    return plan;
  }

  /**
   * Cria um novo plano comercial e vincula os itens de serviço selecionados.
   * Usa transação atômica para garantir que, se falhar ao vincular itens, o plano não seja criado.
   */
  async createPlan(companyId: string, dto: CreateCommercialPlanDto) {
    const { itemIds, ...planData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o plano já com os relacionamentos
      const plan = await tx.commercialPlan.create({
        data: { companyId, ...planData },
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

      // 2. Vincula os itens (se houver)
      if (itemIds && itemIds.length > 0) {
        await tx.planServiceItem.createMany({
          data: itemIds.map((serviceItemId) => ({
            planId: plan.id,
            serviceItemId,
          })),
        });
      }

      // 3. Busca o plano atualizado DENTRO da transação (usando tx)
      const finalPlan = await tx.commercialPlan.findUnique({
        where: { id: plan.id },
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

      // 4. Formata a resposta para o frontend (mesmo formato do getPlans)
      return {
        ...finalPlan,
        itemCount: finalPlan!.planItems.length,
        items: finalPlan!.planItems.map((pi) => ({
          id: pi.serviceItem.id,
          name: pi.serviceItem.name,
          categoryId: pi.serviceItem.categoryId,
          categoryName: pi.serviceItem.category.name,
        })),
      };
    });
  }

  /**
   * Atualiza um plano comercial (suporta atualização parcial).
   * Se `itemIds` for enviado, substitui TODOS os itens anteriores pelos novos (sincronização total).
   */
  async updatePlan(id: string, companyId: string, dto: UpdateCommercialPlanDto) {
    // Valida existência e tenant ANTES da transação
    const existingPlan = await this.prisma.commercialPlan.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existingPlan) {
      throw new NotFoundException('Plano não encontrado ou não pertence a esta empresa.');
    }

    const { itemIds, ...planData } = dto;
    const cleanData = Object.fromEntries(
      Object.entries(planData).filter(([_, value]) => value !== undefined),
    );

    return this.prisma.$transaction(async (tx) => {
      let updatedPlan = existingPlan;
      
      // 1. Atualiza dados do plano (se houver alterações)
      if (Object.keys(cleanData).length > 0) {
        updatedPlan = await tx.commercialPlan.update({
          where: { id },
          data: cleanData,
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
      }

      // 2. Sincroniza itens (Delete all + Create new)
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

      // 3. Busca o plano final DENTRO da transação
      const finalPlan = await tx.commercialPlan.findUnique({
        where: { id },
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

      return {
        ...finalPlan,
        itemCount: finalPlan!.planItems.length,
        items: finalPlan!.planItems.map((pi) => ({
          id: pi.serviceItem.id,
          name: pi.serviceItem.name,
          categoryId: pi.serviceItem.categoryId,
          categoryName: pi.serviceItem.category.name,
        })),
      };
    });
  }
  /**
   * Soft delete de um plano.
   * Bloqueia a exclusão se houver contratos de clientes ativos vinculados a este plano.
   */
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
  // 📁 2. CATEGORIAS DE SERVIÇO
  // =================================================================

  /**
   * Lista categorias da empresa, incluindo a contagem de itens ativos em cada uma.
   */
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

  async updateCategory(id: string, companyId: string, dto: CreateServiceCategoryDto) {
    await this.getCategoryById(id, companyId);
    return this.prisma.serviceCategory.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Soft delete de categoria. Bloqueia se houver itens de serviço ativos vinculados.
   */
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
  // 📦 3. ITENS DE SERVIÇO
  // =================================================================

  /**
   * Lista itens de serviço, opcionalmente filtrados por categoria.
   * ✅ Tipagem estrita com Prisma.ServiceItemWhereInput.
   */
  async getServiceItems(companyId: string, categoryId?: string) {
    const where: Prisma.ServiceItemWhereInput = { companyId, deletedAt: null };
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

  /**
   * Cria um novo item de serviço com valores padrão seguros (null ou 0) para campos opcionais.
   * ✅ Removido 'as any', todos os campos estão estritamente tipados.
   */
  async createServiceItem(companyId: string, dto: CreateServiceItemDto) {
    await this.getCategoryById(dto.categoryId, companyId);

    return this.prisma.serviceItem.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        scope: dto.scope ?? null,
        outOfScope: dto.outOfScope ?? null,
        requiredDocs: dto.requiredDocs ?? null,
        basePrice: dto.basePrice ?? 0,
        estimatedHours: dto.estimatedHours ?? 1,
        slaDays: dto.slaDays ?? 0,
        recurrence: dto.recurrence ?? 'MENSAL',
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });
  }

  /**
   * Atualiza um item de serviço.
   * ✅ CORREÇÃO CRÍTICA: Usa nested connect para a relação de categoria, 
   * evitando o erro TS2551 do Prisma (que esconde o campo escalar no UpdateInput).
   */
  async updateServiceItem(
    id: string,
    companyId: string,
    dto: CreateServiceItemDto,
  ) {
    await this.getServiceItemById(id, companyId);

    if (dto.categoryId) {
      await this.getCategoryById(dto.categoryId, companyId);
    }

    const updateData: Prisma.ServiceItemUpdateInput = {};
    
    // Mapeamento explícito para evitar envio de campos undefined ao Prisma
    if (dto.categoryId !== undefined) {
      updateData.category = { connect: { id: dto.categoryId } };
    }
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

  /**
   * Soft delete de item de serviço. Bloqueia se houver contratos ativos vinculados.
   */
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
  // 💾 4. OPERAÇÕES EM LOTE (Bulk Update)
  // =================================================================

  /**
   * Salva a configuração completa de múltiplos planos de uma vez.
   * Usado pelo frontend na ação "Salvar Alterações" da tela de Meus Planos.
   * Garante consistência via transação atômica.
   */
  async savePlansConfiguration(companyId: string, plansData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const plan of plansData) {
        let savedPlan;
        
             // 1. Upsert do Plano (Update se existir no banco, Create se for novo)
      // ✅ CORREÇÃO: o frontend gera UUIDs temporários para planos NOVOS,
      // então o tamanho do ID não basta — precisamos confirmar no banco
      // que o registro realmente existe antes de tentar atualizar.
      const planExists =
        plan.id && plan.id.length > 20
          ? await tx.commercialPlan.findUnique({ where: { id: plan.id } })
          : null;
      if (planExists) {
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

        // 2. Limpa vínculos antigos de itens
        await tx.planServiceItem.deleteMany({
          where: { planId: savedPlan.id },
        });

        // 3. Cria novos vínculos (suporta 'items' ou 'explicitItems' vindo do frontend)
        const sourceItems = plan.items || plan.explicitItems || [];
        const itemIds = sourceItems
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

        // 4. Busca o plano atualizado com relações para retornar ao frontend
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
  // 🧠 5. SPRINT A2: LÓGICA DE DOMÍNIO (Herança + Insights)
  // =================================================================

  /**
   * Busca os planos, aplica o motor de herança (domínio A1) e devolve
   * a estrutura enriquecida para o Frontend.
   * 
   * 🧠 DECISÃO TÉCNICA (Performance - ADR-020):
   * Usamos um Map (itemMap) para cachear os itens em memória O(1).
   * Isso evita N queries adicionais ou loops aninhados complexos (O(n²)).
   */
  async getResolvedPlans(companyId: string): Promise<ResolvedPlanDto[]> {
    // 1. Buscar dados brutos do banco (mesma query otimizada do getPlans)
    const dbPlans = await this.prisma.commercialPlan.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ order: 'asc' }, { multiplier: 'asc' }], // ✅ ADR-025: ordem primeiro, depois multiplicador
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

    // 2. Mapear para a interface do Domínio Puro (PlanInput)
    const domainPlans: PlanInput[] = dbPlans.map((p) => ({
      id: p.id,
      name: p.name,
      multiplier: p.multiplier,
      independent: p.isIndependent, // 🔄 DB usa isIndependent, Domínio usa independent
      ownItemIds: p.planItems.map((pi) => pi.serviceItemId),
    }));

    // 3. Aplicar o Motor de Herança (Sprint A1 - Lógica pura, sem banco)
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
      // Helper para buscar item no Map e marcar se é herdado
      const resolveItem = (id: string, isInherited: boolean): ResolvedServiceItemDto | null => {
        const item = itemMap.get(id);
        if (!item) return null; // Segurança: item pode ter sido deletado do banco
        return { ...item, isInherited };
      };

      // ✅ Busca tipada sem usar 'as any'
      const dbPlan = dbPlans.find((p) => p.id === r.id);

      return {
        id: r.id,
        name: r.name,
        multiplier: r.multiplier,
        isIndependent: r.independent,
        order: dbPlan?.order ?? 0,          // ✅ Corrigido: pegar do dbPlan
        badge: dbPlan?.badge ?? null,        // ✅ Corrigido: pegar do dbPlan
        color: dbPlan?.color ?? null,        // ✅ Corrigido: pegar do dbPlan
        description: dbPlan?.description ?? null, // ✅ Corrigido: pegar do dbPlan
        
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

  /**
   * Pega os planos já resolvidos (com herança) e aplica a matemática de preço.
   * Este é o endpoint que alimenta o "Dinheiro na Mesa" na UI.
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
    // 1. Reutilizamos o motor de herança já validado e testado
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