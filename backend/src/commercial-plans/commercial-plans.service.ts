import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommercialPlansService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 🏢 PLANOS COMERCIAIS
  // =================================================================
  async getPlans(companyId: string) {
    const plans = await this.prisma.commercialPlan.findMany({
      where: { companyId },
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

  async createPlan(companyId: string, data: any) {
    if (data.multiplier <= 0) {
      throw new BadRequestException('O multiplicador deve ser maior que zero.');
    }
    const { itemCount, items, planItems, ...validData } = data;
    return this.prisma.commercialPlan.create({
      data: { companyId, ...validData },
    });
  }

  async updatePlan(id: string, data: any) {
    const { itemCount, items, planItems, ...validData } = data;
    return this.prisma.commercialPlan.update({
      where: { id },
      data: validData,
    });
  }

  async deletePlan(id: string) {
    await this.prisma.planServiceItem.deleteMany({ where: { planId: id } });
    return this.prisma.commercialPlan.delete({ where: { id } });
  }

  // =================================================================
  // 📁 CATEGORIAS
  // =================================================================
  async getCategories(companyId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { items: true } },
        items: { orderBy: { order: 'asc' } },
      },
    });
  }

  async createCategory(companyId: string, data: any) {
    return this.prisma.serviceCategory.create({
      data: { companyId, ...data },
    });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    await this.prisma.serviceItem.deleteMany({ where: { categoryId: id } });
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  // =================================================================
  // 📦 ITENS DE SERVIÇO
  // =================================================================
  async createServiceItem(companyId: string, data: any) {
    return this.prisma.serviceItem.create({
      data: { companyId, ...data },
    });
  }

  async deleteServiceItem(id: string) {
    await this.prisma.planServiceItem.deleteMany({ where: { serviceItemId: id } });
    return this.prisma.serviceItem.delete({ where: { id } });
  }

  // =================================================================
  // 💾 SALVAR CONFIGURAÇÃO COMPLETA (Transação)
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

        // 4. Recarregar plano com itens para retornar ao frontend
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
          itemCount: updatedPlan.planItems.length,
          items: updatedPlan.planItems.map((pi: any) => ({
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