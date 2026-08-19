import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommercialPlansService } from './commercial-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommercialPlanDto } from './dto/create-commercial-plan.dto';
import { UpdateCommercialPlanDto } from './dto/update-commercial-plan.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';
import { ResolvedPlanDto } from './dto/resolved-plan.dto';
import { CalculatePricingInsightsDto, PlanWithInsightsDto } from './dto/pricing-insights.dto';

interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('commercial-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommercialPlansController {
  constructor(private readonly service: CommercialPlansService) {}

  // =================================================================
  // 🏢 PLANOS COMERCIAIS
  // =================================================================

  @Get('plans') // ✅ Rota explícita para bater com o frontend
  async getPlans(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getPlans(user.companyId) };
  }

  @Get('resolved')
  async getResolvedPlans(@CurrentUser() user: UserPayload): Promise<{ success: boolean; data: ResolvedPlanDto[] }> {
    return { success: true, data: await this.service.getResolvedPlans(user.companyId) };
  }

  @Post('bulk-update') // ✅ Endpoint que o frontend chama no handleSaveAll
  @Roles('ADMIN', 'MANAGER')
  async bulkUpdatePlans(
    @CurrentUser() user: UserPayload,
    @Body() body: { valorReferencia?: number; plans: any[] },
  ) {
    // Opcional: Salvar o valorReferencia na tabela PricingConfig da empresa
    // await this.prisma.pricingConfig.upsert({ ... })
    
    return {
      success: true,
      message: 'Configuração de planos salva com sucesso!',
      data: await this.service.savePlansConfiguration(user.companyId, body.plans),
    };
  }
  
  @Get('plans/:id')
  async getPlanById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getPlanById(id, user.companyId) };
  }

  @Post('plans')
  @Roles('ADMIN')
  async createPlan(@CurrentUser() user: UserPayload, @Body() dto: CreateCommercialPlanDto) {
    return { success: true, message: 'Plano criado!', data: await this.service.createPlan(user.companyId, dto) };
  }

  @Put('plans/:id')
  @Roles('ADMIN')
  async updatePlan(@Param('id') id: string, @CurrentUser() user: UserPayload, @Body() dto: UpdateCommercialPlanDto) {
    return { success: true, message: 'Plano atualizado!', data: await this.service.updatePlan(id, user.companyId, dto) };
  }

  @Delete('plans/:id')
  @Roles('ADMIN')
  async deletePlan(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.deletePlan(id, user.companyId);
    return { success: true, message: 'Plano removido!' };
  }

  // =================================================================
  // 📁 CATEGORIAS
  // =================================================================

  @Get('categories')
  async getCategories(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getCategories(user.companyId) };
  }

  @Post('categories')
  @Roles('ADMIN')
  async createCategory(@CurrentUser() user: UserPayload, @Body() dto: CreateServiceCategoryDto) {
    return { success: true, message: 'Categoria criada!', data: await this.service.createCategory(user.companyId, dto) };
  }

  @Delete('categories/:id')
  @Roles('ADMIN')
  async deleteCategory(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.deleteCategory(id, user.companyId);
    return { success: true, message: 'Categoria removida!' };
  }

  // =================================================================
  // 📦 ITENS DE SERVIÇO
  // =================================================================

  @Get('items')
  async getServiceItems(@CurrentUser() user: UserPayload, @Query('categoryId') categoryId?: string) {
    return { success: true, data: await this.service.getServiceItems(user.companyId, categoryId) };
  }

  @Post('items')
  @Roles('ADMIN')
  async createServiceItem(@CurrentUser() user: UserPayload, @Body() dto: CreateServiceItemDto) {
    return { success: true, message: 'Serviço criado!', data: await this.service.createServiceItem(user.companyId, dto) };
  }

  @Delete('items/:id')
  @Roles('ADMIN')
  async deleteServiceItem(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.deleteServiceItem(id, user.companyId);
    return { success: true, message: 'Serviço removido!' };
  }
}