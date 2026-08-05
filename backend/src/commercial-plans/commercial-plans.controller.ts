import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommercialPlansService } from './commercial-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommercialPlanDto } from './dto/create-commercial-plan.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { CreateServiceItemDto } from './dto/create-service-item.dto';

interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('commercial-plans')
@UseGuards(JwtAuthGuard)
export class CommercialPlansController {
  constructor(private readonly service: CommercialPlansService) {}

  // =================================================================
  // 🏢 PLANOS COMERCIAIS
  // =================================================================
  @Get('plans')
  async getPlans(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getPlans(user.companyId) };
  }

  @Get('plans/:id')
  async getPlanById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getPlanById(id, user.companyId) };
  }

  @Post('plans')
  async createPlan(@CurrentUser() user: UserPayload, @Body() dto: CreateCommercialPlanDto) {
    const plan = await this.service.createPlan(user.companyId, dto);
    return { success: true, message: 'Plano criado!', data: plan };
  }

  @Put('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateCommercialPlanDto
  ) {
    const plan = await this.service.updatePlan(id, user.companyId, dto);
    return { success: true, message: 'Plano atualizado!', data: plan };
  }

  @Delete('plans/:id')
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

  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getCategoryById(id, user.companyId) };
  }

  @Post('categories')
  async createCategory(@CurrentUser() user: UserPayload, @Body() dto: CreateServiceCategoryDto) {
    const category = await this.service.createCategory(user.companyId, dto);
    return { success: true, message: 'Categoria criada!', data: category };
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateServiceCategoryDto
  ) {
    const category = await this.service.updateCategory(id, user.companyId, dto);
    return { success: true, message: 'Categoria atualizada!', data: category };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.deleteCategory(id, user.companyId);
    return { success: true, message: 'Categoria removida!' };
  }

  // =================================================================
  // 📦 ITENS DE SERVIÇO
  // =================================================================
  @Get('items')
  async getServiceItems(
    @CurrentUser() user: UserPayload,
    @Query('categoryId') categoryId?: string
  ) {
    return { success: true, data: await this.service.getServiceItems(user.companyId, categoryId) };
  }

  @Get('items/:id')
  async getServiceItemById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.getServiceItemById(id, user.companyId) };
  }

  @Post('items')
  async createServiceItem(@CurrentUser() user: UserPayload, @Body() dto: CreateServiceItemDto) {
    const item = await this.service.createServiceItem(user.companyId, dto);
    return { success: true, message: 'Item criado!', data: item };
  }

  @Put('items/:id')
  async updateServiceItem(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateServiceItemDto
  ) {
    const item = await this.service.updateServiceItem(id, user.companyId, dto);
    return { success: true, message: 'Item atualizado!', data: item };
  }

  @Delete('items/:id')
  async deleteServiceItem(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.deleteServiceItem(id, user.companyId);
    return { success: true, message: 'Item removido!' };
  }

  // =================================================================
  // 💾 SALVAR CONFIGURAÇÃO COMPLETA (Legacy)
  // =================================================================
  @Post('save-configuration')
  async saveConfiguration(@CurrentUser() user: UserPayload, @Body() body: any) {
    return {
      success: true,
      data: await this.service.savePlansConfiguration(user.companyId, body.plans),
    };
  }
}