import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommercialPlanDto } from './dto/create-commercial-plan.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';

@Injectable()
export class CommercialPlansService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 🏢 PLANOS COMERCIAIS
  // =================================================================

  /**
   * Lista todos os planos ativos de uma empresa
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
   * Busca um plano específico por ID (com validação de tenant)
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

    if (!plan) throw new NotFoundException('Plano não encontrado.');
    return plan;
  }

  /**
   * Cria novo plano comercial
   */
  async createPlan(companyId: string, dto: CreateCommercialPlanDto) {
    const { itemIds, ...planData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o plano
      const plan = await tx.commercialPlan.create({
        data: { companyId, ...planData },
      });

      // 2. Vincula itens se fornecidos
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
   * Atualiza plano comercial (com proteção de tenant)
   */
  async updatePlan(id: string, companyId: string, dto: CreateCommercialPlanDto) {
    // Valida posse do plano
    await this.getPlanById(id, companyId);

    const { itemIds, ...planData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza o plano
      const plan = await tx.commercialPlan.update({
        where: { id },
        data: planData,
      });

      // 2. Se itemIds foi fornecido, substitui vinculações
      if (itemIds !== undefined) {
        // Remove vínculos antigos
        await tx.planServiceItem.deleteMany({ where: { planId: id } });

        // Cria novos vínculos
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

  /**
   * Soft delete de plano (marca como inativo)
   */
  async deletePlan(id: string, companyId: string) {
    // Valida posse
    await this.getPlanById(id, companyId);

    // Verifica se há contratos ativos usando este plano
    const activeContracts = await this.prisma.clientContract.count({
      where: { commercialPlanId: id, status: 'ATIVO' },
    });

    if (activeContracts > 0) {
      throw new BadRequestException(
        `Não é possível excluir o plano. Existem ${activeContracts} contrato(s) ativo(s) vinculados.`
      );
    }

    // Soft delete
    return this.prisma.commercialPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =================================================================
  // 📁 CATEGORIAS DE SERVIÇO
  // =================================================================

  /**
   * Lista todas as categorias ativas de uma empresa
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

  /**
   * Busca categoria específica (com validação de tenant)
   */
  async getCategoryById(id: string, companyId: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return category;
  }

  /**
   * Cria nova categoria de serviço
   */
  async createCategory(companyId: string, dto: CreateServiceCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: { companyId, ...dto },
    });
  }

  /**
   * Atualiza categoria (com proteção de tenant)
   */
  async updateCategory(id: string, companyId: string, dto: CreateServiceCategoryDto) {
    await this.getCategoryById(id, companyId);

    return this.prisma.serviceCategory.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Soft delete de categoria (impede se houver itens vinculados)
   */
  async deleteCategory(id: string, companyId: string) {
    await this.getCategoryById(id, companyId);

    // Verifica se há itens ativos na categoria
    const activeItems = await this.prisma.serviceItem.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (activeItems > 0) {
      throw new BadRequestException(
        `Não é possível excluir a categoria. Existem ${activeItems} item(ns) ativo(s) vinculados.`
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

  /**
   * Lista todos os itens de serviço ativos de uma empresa
   */
  async getServiceItems(companyId: string, categoryId?: string) {
    const where: any = { companyId, deletedAt: null };
    if (categoryId) where.categoryId = categoryId;

    return this.prisma.serviceItem.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });
  }

  /**
   * Busca item específico (com validação de tenant)
   */
  async getServiceItemById(id: string, companyId: string) {
    const item = await this.prisma.serviceItem.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true },
    });

    if (!item) throw new NotFoundException('Item de serviço não encontrado.');
    return item;
  }

    /**
   * Cria novo item de serviço
   * Construção explícita dos campos para evitar conflito de tipos no Prisma
   */
  async createServiceItem(companyId: string, dto: CreateServiceItemDto) {
    // Valida se a categoria existe e pertence à empresa
    await this.getCategoryById(dto.categoryId, companyId);

    return this.prisma.serviceItem.create({
      data: {
        companyId: companyId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        scope: dto.scope,
        outOfScope: dto.outOfScope,
        requiredDocs: dto.requiredDocs,
        basePrice: dto.basePrice,
        estimatedHours: dto.estimatedHours,
        slaDays: dto.slaDays,
        recurrence: dto.recurrence,
        order: dto.order,
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });
  }

    /**
   * Atualiza item de serviço (com proteção de tenant)
   * Construção explícita dos campos para evitar conflito de tipos no Prisma
   */
  async updateServiceItem(id: string, companyId: string, dto: CreateServiceItemDto) {
    await this.getServiceItemById(id, companyId);

    // Se mudou de categoria, valida a nova
    if (dto.categoryId) {
      await this.getCategoryById(dto.categoryId, companyId);
    }

    // Constrói objeto de update apenas com campos presentes
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

  /**
   * Soft delete de item (impede se houver contratos ativos)
   */
  async deleteServiceItem(id: string, companyId: string) {
    await this.getServiceItemById(id, companyId);

    // Verifica se há contratos usando este item
    const activeContracts = await this.prisma.clientService.count({
      where: { serviceItemId: id, status: 'ATIVO' },
    });

    if (activeContracts > 0) {
      throw new BadRequestException(
        `Não é possível excluir o item. Existem ${activeContracts} contrato(s) ativo(s) vinculados.`
      );
    }

    return this.prisma.serviceItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =================================================================
  // 💾 SALVAR CONFIGURAÇÃO COMPLETA (Legacy - mantido para compatibilidade)
  // =================================================================
  async savePlansConfiguration(companyId: string, plansData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const plan of plansData) {
        // 1. Criar ou atualizar o plano
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

        // 2. Limpar itens antigos do plano
        await tx.planServiceItem.deleteMany({
          where: { planId: savedPlan.id },
        });

        // 3. Adicionar novos itens
        const itemIds = (plan.items || []).map((item: any) => item.id).filter(Boolean);
        if (itemIds.length > 0) {
          await tx.planServiceItem.createMany({
            data: itemIds.map((serviceItemId: string) => ({
              planId: savedPlan.id,
              serviceItemId,
            })),
          });
        }

        // 4. Recarregar plano com itens
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
}