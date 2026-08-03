// =================================================================
// INÍCIO: proposals.controller.ts
// =================================================================
/**
 * ProposalsController
 * Endpoints para gestão de propostas comerciais.
 */
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly service: ProposalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.create(req.user.companyId, req.user.id, body) };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req, @Query('status') status?: string) {
    return { success: true, data: await this.service.list(req.user.companyId, status) };
  }

  // Rotas específicas DEVEM vir antes das rotas com parâmetro (:id)
  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  async getDashboard(@Request() req) {
    return { success: true, data: await this.service.getDashboard(req.user.companyId) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('trend-data')
  async getTrendData(@Request() req, @Query('period') period: string = '6') {
    const data = await this.service.getTrendData(req.user.companyId, period);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('loss-reasons')
  async getLossReasons(@Request() req, @Query('period') period: string = '6') {
    const data = await this.service.getLossReasonsData(req.user.companyId, period);
    return { success: true, data };
  }
  //  NOVO: Endpoint para Taxa de Conversão
  @UseGuards(JwtAuthGuard)
  @Get('conversion-trend')
  async getConversionTrend(@Request() req, @Query('period') period: string = '6') {
    const data = await this.service.getConversionTrendData(req.user.companyId, period);
    return { success: true, data };
  }
  // Rotas com parâmetro :id (DEVEM vir por último)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Request() req, @Param('id') id: string) {
    return { success: true, data: await this.service.getById(req.user.companyId, id) };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/content')
  async updateContent(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateContent(id, req.user.companyId, body) };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  async close(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.close(id, req.user.companyId, body) };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/lost')
  async markAsLost(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.markAsLost(id, req.user.companyId, body.reason) };
  }

  // Endpoints PÚBLICOS
  @Get('public/:slug')
  async getPublic(@Param('slug') slug: string) {
    const proposal = await this.service.getPublicBySlug(slug);
    return { success: true, data: proposal };
  }

  @Post('public/:id/whatsapp-click')
  async trackWhatsapp(@Param('id') id: string) {
    await this.service.trackWhatsappClick(id);
    return { success: true };
  }
}
// =================================================================
// FIM: proposals.controller.ts
// =================================================================