/**
 * CommercialPlansService
 * Camada de negócio para gestão de planos comerciais.
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommercialPlansService {
  constructor(private prisma: PrismaService) {}

  async getPlans(companyId: string) {
    const plans = await this.prisma.commercialPlan.findMany({
      where: { companyId },
      orderBy: { multiplier: 'asc' },
      include: {
        planItems: {
          include: { serviceItem: { include: { category: true } } },
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
    if (data.multiplier <= 0) throw new BadRequestException('O multiplicador deve ser maior que zero.');
    
    const { itemCount, items, planItems, ...validData } = data;
    return this.prisma.commercialPlan.create({ 
      data: { companyId, ...validData } 
    });
  }

  async updatePlan(id: string, data: any) {
    const { itemCount, items, planItems, ...validData } = data;
    return this.prisma.commercialPlan.update({ 
      where: { id }, 
      data: validData 
    });
  }

  async deletePlan(id: string) {
    await this.prisma.planServiceItem.deleteMany({ where: { planId: id } });
    return this.prisma.commercialPlan.delete({ where: { id } });
  }

  async getCategories(companyId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: { 
        _count: { select: { items: true } }, 
        items: { orderBy: { order: 'asc' } } 
      },
    });
  }

  async createCategory(companyId: string, data: any) {
    return this.prisma.serviceCategory.create({ data: { companyId, ...data } });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.serviceCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    await this.prisma.serviceItem.deleteMany({ where: { categoryId: id } });
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  async createServiceItem(companyId: string, data: any) {
    return this.prisma.serviceItem.create({ data: { companyId, ...data } });
  }

  async deleteServiceItem(id: string) {
    await this.prisma.planServiceItem.deleteMany({ where: { serviceItemId: id } });
    return this.prisma.serviceItem.delete({ where: { id } });
  }

  // 🔥 MÉTODO CORRIGIDO: Filtra campos e usa apenas IDs para a relação
  async savePlansConfiguration(companyId: string, plansData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const planData of plansData) {
        // 1. Extrair apenas os IDs dos itens marcados no frontend
        const itemIds = (planData.items || []).map((item: any) => item.id);
        
        // 2. Definir APENAS os campos escalares válidos para o model CommercialPlan
        const validPlanData = {
          name: planData.name,
          multiplier: planData.multiplier,
          order: planData.order,
          isIndependent: planData.isIndependent,
          color: planData.color,
          badge: planData.badge,
          description: planData.description,
        };
        
        let plan;
        if (planData.id && planData.id !== '') {
          // Atualiza plano existente
          plan = await tx.commercialPlan.update({ 
            where: { id: planData.id }, 
            data: validPlanData 
          });
        } else {
          // Cria novo plano
          plan = await tx.commercialPlan.create({ 
            data: { companyId, ...validPlanData } 
          });
        }

        // 3. Remove associações antigas e cria as novas com os IDs extraídos
        await tx.planServiceItem.deleteMany({ where: { planId: plan.id } });
        
        if (itemIds.length > 0) {
          await tx.planServiceItem.createMany({
            data: itemIds.map((serviceItemId: string) => ({ 
              planId: plan.id, 
              serviceItemId 
            })),
          });
        }
        
        // 4. Recarregar com itens para retornar ao frontend atualizado
        const updatedPlan = await tx.commercialPlan.findUnique({ 
          where: { id: plan.id },
          include: { planItems: { include: { serviceItem: { include: { category: true } } } } }
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