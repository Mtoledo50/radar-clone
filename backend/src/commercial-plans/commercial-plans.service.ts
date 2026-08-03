/**
 * CommercialPlansService
 * Camada de negócio para gestão de planos comerciais.
 * Garante que todas as operações sejam filtradas pelo companyId do usuário logado.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    
    const { itemCount, items, ...validData } = data; // Remove campos inexistentes no banco
    
    return this.prisma.commercialPlan.create({ 
      data: { companyId, ...validData } 
    });
  }

  async updatePlan(id: string, data: any) {
    await this.findPlanOrThrow(id);
    
    const { itemCount, items, ...validData } = data; // Remove campos inexistentes no banco
    
    return this.prisma.commercialPlan.update({ 
      where: { id }, 
      data: validData 
    });
  }

  async deletePlan(id: string) {
    await this.findPlanOrThrow(id);
    await this.prisma.planServiceItem.deleteMany({ where: { planId: id } });
    return this.prisma.commercialPlan.delete({ where: { id } });
  }

  // =================================================================
  // 📁 CATEGORIAS DE SERVIÇO
  // =================================================================
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
    await this.findCategoryOrThrow(id);
    return this.prisma.serviceCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    await this.findCategoryOrThrow(id);
    await this.prisma.serviceItem.deleteMany({ where: { categoryId: id } });
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  // =================================================================
  // 📦 ITENS DE SERVIÇO
  // =================================================================
  async createServiceItem(companyId: string, data: any) {
    await this.findCategoryOrThrow(data.categoryId);
    return this.prisma.serviceItem.create({ data: { companyId, ...data } });
  }

  async deleteServiceItem(id: string) {
    await this.findServiceItemOrThrow(id);
    await this.prisma.planServiceItem.deleteMany({ where: { serviceItemId: id } });
    return this.prisma.serviceItem.delete({ where: { id } });
  }

  // =================================================================
  // 🔗 ASSOCIAÇÃO E SALVAMENTO EM LOTE
  // =================================================================
  async savePlansConfiguration(companyId: string, plansData: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const planData of plansData) {
        // 🔥 FILTRAR APENAS OS CAMPOS VÁLIDOS DO MODEL CommercialPlan
        const { itemCount, items, serviceItemIds, ...validPlanData } = planData;
        
        let plan;
        if (planData.id && planData.id !== '') {
          // Atualiza plano existente
          plan = await tx.commercialPlan.update({ 
            where: { id: planData.id }, 
            data: validPlanData 
          });
        } else {
          // Cria novo plano (o Prisma gera o ID automaticamente)
          plan = await tx.commercialPlan.create({ 
            data: { companyId, ...validPlanData } 
          });
        }

        // Remove associações antigas e cria as novas
        await tx.planServiceItem.deleteMany({ where: { planId: plan.id } });
        
        if (serviceItemIds && serviceItemIds.length > 0) {
          await tx.planServiceItem.createMany({
            data: serviceItemIds.map((serviceItemId: string) => ({ 
              planId: plan.id, 
              serviceItemId 
            })),
          });
        }
        
        // Recarregar com itens para retornar ao frontend atualizado
        const updatedPlan = await tx.commercialPlan.findUnique({ 
          where: { id: plan.id },
          include: { planItems: { include: { serviceItem: { include: { category: true } } } } }
        });
        
        // Formatar para o frontend (mesma lógica do getPlans)
        results.push({
          ...updatedPlan,
          itemCount: updatedPlan.planItems.length,
          items: updatedPlan.planItems.map((pi) => ({
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
  // 🧮 MOTOR DE CÁLCULO DE PRECIFICAÇÃO
  // =================================================================
  async calculatePrice(companyId: string, data: any) {
    // 1. Buscar planos da empresa para aplicar multiplicadores
    const plans = await this.getPlans(companyId);

    // 2. Configurações de Custo (Podem vir do frontend ou de um settings futuro)
    // Usando os valores padrão do vídeo como base
    const salary = data.salary || 4000;
    const chargesPercent = data.chargesPercent || 69;
    const hoursPerMonth = data.hoursPerMonth || 160;
    
    const taxesPercent = data.taxesPercent || 10;
    const backOfficePercent = data.backOfficePercent || 4;
    const adminPercent = data.adminPercent || 5;
    const marginFCPercent = data.marginFCPercent || 15;
    const marginDPPercent = data.marginDPPercent || 15;

    // 3. Cálculos Contábeis
    const costPerEmployee = salary * (1 + (chargesPercent / 100));
    const costPerHour = costPerEmployee / hoursPerMonth;
    
    // Fator de Markup: 1 - (soma das porcentagens de dedução e margem)
    // Ex: 1 - (0.10 + 0.04 + 0.05 + 0.15) = 0.66
    const markupFactorFC = 1 - ((taxesPercent + backOfficePercent + adminPercent + marginFCPercent) / 100);
    const markupFactorDP = 1 - ((taxesPercent + backOfficePercent + adminPercent + marginDPPercent) / 100);

    // Horas estimadas (Por enquanto manuais, futuramente virão da "Regras de Horas")
    const fiscalHours = data.fiscalHours || 0;
    const contabilHours = data.contabilHours || 0;
    const totalHoursFC = fiscalHours + contabilHours;

    // Custo Base
    const baseCostFC = totalHoursFC * costPerHour;
    
    // Custo DP: Pode ser por valor fixo por funcionário ou margem. Usando valor fixo conforme vídeo.
    const dpValuePerEmployee = data.dpType === 'margin' 
      ? (baseCostFC * (data.dpMarginPercent || 0) / 100) / (data.employees || 1) 
      : (data.dpValuePerEmployee || 60);
    
    const baseCostDP = (data.employees || 0) * dpValuePerEmployee;

    // Preço Base Ideal (Custo / Fator de Markup)
    const suggestedPriceFC = baseCostFC / markupFactorFC;
    const suggestedPriceDP = baseCostDP / markupFactorDP;
    const totalSuggestedPrice = suggestedPriceFC + suggestedPriceDP;

    // 4. Montar o resultado com a projeção de DRE para cada plano
    const planCalculations = plans.map(plan => {
      const planPrice = totalSuggestedPrice * plan.multiplier;
      
      // Projeção de DRE simplificada para este plano
      const revenue = planPrice;
      const directCosts = baseCostFC + baseCostDP;
      const taxesAmount = revenue * (taxesPercent / 100);
      const backOfficeAmount = revenue * (backOfficePercent / 100);
      const adminAmount = revenue * (adminPercent / 100);
      const profit = revenue - directCosts - taxesAmount - backOfficeAmount - adminAmount;
      
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        planId: plan.id,
        planName: plan.name,
        multiplier: plan.multiplier,
        badge: plan.badge,
        price: Number(planPrice.toFixed(2)),
        dre: {
          revenue: Number(revenue.toFixed(2)),
          directCosts: Number(directCosts.toFixed(2)),
          taxes: Number(taxesAmount.toFixed(2)),
          backOffice: Number(backOfficeAmount.toFixed(2)),
          admin: Number(adminAmount.toFixed(2)),
          profit: Number(profit.toFixed(2)),
          profitMargin: Number(profitMargin.toFixed(2)),
        }
      };
    });

    return {
      costPerHour: Number(costPerHour.toFixed(2)),
      markupFactorFC: Number(markupFactorFC.toFixed(4)),
      markupFactorDP: Number(markupFactorDP.toFixed(4)),
      baseCostFC: Number(baseCostFC.toFixed(2)),
      baseCostDP: Number(baseCostDP.toFixed(2)),
      totalSuggestedPrice: Number(totalSuggestedPrice.toFixed(2)),
      plans: planCalculations,
    };
  }
  // =================================================================
  // 🔍 HELPERS
  // =================================================================
  private async findPlanOrThrow(id: string) {
    const plan = await this.prisma.commercialPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
    return plan;
  }
  
  private async findCategoryOrThrow(id: string) {
    const cat = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoria não encontrada.');
    return cat;
  }
  
  private async findServiceItemOrThrow(id: string) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item não encontrado.');
    return item;
  }
}