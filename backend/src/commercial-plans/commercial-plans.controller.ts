import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommercialPlansService } from './commercial-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('commercial-plans')
@UseGuards(JwtAuthGuard)
export class CommercialPlansController {
  constructor(private readonly service: CommercialPlansService) {}

  // =================================================================
  // 🏢 PLANOS COMERCIAIS
  // =================================================================
  @Get('plans')
  async getPlans(@Request() req) {
    return { success: true, data: await this.service.getPlans(req.user.companyId) };
  }

  @Post('plans')
  async createPlan(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createPlan(req.user.companyId, body) };
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updatePlan(id, body) };
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    await this.service.deletePlan(id);
    return { success: true };
  }

  // =================================================================
  // 📁 CATEGORIAS
  // =================================================================
  @Get('categories')
  async getCategories(@Request() req) {
    return { success: true, data: await this.service.getCategories(req.user.companyId) };
  }

  @Post('categories')
  async createCategory(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createCategory(req.user.companyId, body) };
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateCategory(id, body) };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.service.deleteCategory(id);
    return { success: true };
  }

  // =================================================================
  //  ITENS DE SERVIÇO
  // =================================================================
  @Post('items')
  async createServiceItem(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createServiceItem(req.user.companyId, body) };
  }

  @Delete('items/:id')
  async deleteServiceItem(@Param('id') id: string) {
    await this.service.deleteServiceItem(id);
    return { success: true };
  }

  // =================================================================
  //  SALVAR CONFIGURAÇÃO COMPLETA (Planos + Itens)
  // =================================================================
  @Post('save-configuration')
  async saveConfiguration(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.savePlansConfiguration(req.user.companyId, body.plans) };
  }
}