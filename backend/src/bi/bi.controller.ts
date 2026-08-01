import { Controller, Get, Post, Query, UseGuards, Request, Body } from '@nestjs/common';
import { BiService } from './bi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard, RequireModule } from '../auth/guards/plan.guard'; // 🔥 NOVO IMPORT

@Controller('bi')
@UseGuards(JwtAuthGuard, PlanGuard) // 🔥 ADICIONADO PlanGuard aqui
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('dre')
  @RequireModule('bi') // 🔥 BLOQUEIA se 'bi' não estiver no allowedModules
  async getDre(@Request() req, @Query('months') months: string = '6', @Query('clientId') clientId?: string) {
    const { companyId } = req.user;
    const monthsNum = parseInt(months, 10) || 6;
    const data = await this.biService.getDre(companyId, monthsNum, clientId);
    return { success: true, data };
  }

  @Get('clients')
  @RequireModule('bi')
  async getClients(@Request() req) {
    const { companyId } = req.user;
    const clients = await this.biService.getClients(companyId);
    return { success: true, data: clients };
  }

  @Get('outliers')
  @RequireModule('bi')
  async getOutliers(@Request() req) {
    const { companyId } = req.user;
    const data = await this.biService.getOutliers(companyId);
    return { success: true, data };
  }

  @Get('indicators')
  @RequireModule('indicadores') // 🔥 BLOQUEIA se 'indicadores' não estiver no allowedModules
  async getIndicators(@Request() req) {
    const { companyId } = req.user;
    const data = await this.biService.getIndicators(companyId);
    return { success: true, data };
  }

  @Post('simulate-tax')
  @RequireModule('planejamento-tributario')
  async simulateTax(@Request() req, @Body() body: any) {
    const { companyId } = req.user;
    const data = await this.biService.simulateTaxRegimes(companyId, body);
    return { success: true, data };
  }

  @Post('simulate-reform')
  @RequireModule('reforma-tributaria')
  async simulateReform(@Request() req, @Body() body: any) {
    const { companyId } = req.user;
    const data = await this.biService.simulateTaxReform(companyId, body);
    return { success: true, data };
  }
}