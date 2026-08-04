import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly service: ProposalsService) {}

  // =================================================================
  //  ROTAS ESPECÍFICAS (DEVEM VIR PRIMEIRO)
  // =================================================================
  @Get('dashboard/stats')
  async getDashboardStats(@Request() req, @Query('period') period?: string) {
    return { success: true, data: await this.service.getDashboardStats(req.user.companyId, period) };
  }

  @Get('trend-data')
  async getTrendData(@Request() req, @Query('period') period?: string) {
    return { success: true, data: await this.service.getTrendData(req.user.companyId, period) };
  }

  @Get('loss-reasons')
  async getLossReasons(@Request() req, @Query('period') period?: string) {
    return { success: true, data: await this.service.getLossReasonsData(req.user.companyId, period) };
  }

  @Get('conversion-trend')
  async getConversionTrend(@Request() req, @Query('period') period?: string) {
    return { success: true, data: await this.service.getConversionTrend(req.user.companyId, period) };
  }

  // =================================================================
  //  CRUD BÁSICO
  // =================================================================
  @Get()
  async findAll(@Request() req, @Query('status') status?: string) {
    return { success: true, data: await this.service.findAll(req.user.companyId, status) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { success: true, data: await this.service.findOne(id) };
  }

  @Post()
  async create(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.create(req.user.companyId, req.user.id, body) };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.update(id, body) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/close')
  async closeProposal(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.closeProposal(id, body) };
  }

  @Post(':id/lost')
  async markAsLost(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.markAsLost(id, body) };
  }
}