import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly service: ProposalsService) {}

  // =================================================================
  // 📊 DASHBOARDS E MÉTRICAS
  // =================================================================
  
  @Get('dashboard')
  async getDashboardStats(
    @CurrentUser() user: UserPayload, 
    @Query('period') period: string
  ) {
    return { success: true, data: await this.service.getDashboardStats(user.companyId, period) };
  }

  @Get('trend')
  async getTrendData(
    @CurrentUser() user: UserPayload, 
    @Query('period') period: string
  ) {
    return { success: true, data: await this.service.getTrendData(user.companyId, period) };
  }

  @Get('loss-reasons')
  async getLossReasonsData(
    @CurrentUser() user: UserPayload, 
    @Query('period') period: string
  ) {
    return { success: true, data: await this.service.getLossReasonsData(user.companyId, period) };
  }

  @Get('conversion-trend')
  async getConversionTrend(
    @CurrentUser() user: UserPayload, 
    @Query('period') period: string
  ) {
    return { success: true, data: await this.service.getConversionTrend(user.companyId, period) };
  }

  // =================================================================
  // 📋 CRUD
  // =================================================================
  
  @Get()
  async findAll(
    @CurrentUser() user: UserPayload, 
    @Query('status') status?: string
  ) {
    const data = await this.service.findAll(user.companyId, status);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.findOne(id, user.companyId) };
  }

  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.service.create(user.companyId, user.id, body);
    return { success: true, message: 'Proposta criada!', data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string, 
    @CurrentUser() user: UserPayload, 
    @Body() body: any
  ) {
    return { success: true, data: await this.service.update(id, user.companyId, body) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.remove(id, user.companyId);
    return { success: true, message: 'Proposta removida!' };
  }

  // =================================================================
  // 🔄 MUDANÇAS DE STATUS
  // =================================================================
  
  @Post(':id/close')
  async closeProposal(
    @Param('id') id: string, 
    @CurrentUser() user: UserPayload, 
    @Body() body: { planId: string; price: number }
  ) {
    return { success: true, data: await this.service.closeProposal(id, user.companyId, body) };
  }

  @Post(':id/lose')
  async markAsLost(
    @Param('id') id: string, 
    @CurrentUser() user: UserPayload, 
    @Body() body: { reason: string }
  ) {
    return { success: true, data: await this.service.markAsLost(id, user.companyId, body.reason) };
  }

  @Post(':id/send')
  async markAsSent(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return { success: true, data: await this.service.markAsSent(id, user.companyId) };
  }
}