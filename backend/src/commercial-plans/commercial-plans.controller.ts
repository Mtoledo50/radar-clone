/**
 * CommercialPlansController
 * Endpoints REST para gestão de planos comerciais.
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommercialPlansService } from './commercial-plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('commercial-plans')
@UseGuards(JwtAuthGuard)
export class CommercialPlansController {
  constructor(private readonly service: CommercialPlansService) {}

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

  @Post('items')
  async createServiceItem(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createServiceItem(req.user.companyId, body) };
  }

  @Delete('items/:id')
  async deleteServiceItem(@Param('id') id: string) {
    await this.service.deleteServiceItem(id);
    return { success: true };
  }

  @Post('save-configuration')
  async saveConfiguration(@Request() req, @Body() body: { plans: any[] }) {
    return { success: true, data: await this.service.savePlansConfiguration(req.user.companyId, body.plans) };
  }
  
  @Post('calculate')
  async calculatePrice(@Request() req, @Body() body: any) {
    const result = await this.service.calculatePrice(req.user.companyId, body);
    return { success: true, data: result };
  }
}