import { Controller, Get, Post, Query, UseGuards, Request, Body } from '@nestjs/common';
import { BiService } from './bi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 📊 BI CONTROLLER - Rotas do Business Intelligence
 * =================================================================
 * 
 * ROTAS DISPONÍVEIS:
 * - GET  /bi/dre              → DRE Gerencial (Receitas vs Despesas)
 * - GET  /bi/clients          → Lista de clientes (para filtro)
 * - GET  /bi/outliers         → Ponto Fora da Curva (anomalias)
 * - GET  /bi/indicators       → Indicadores de Eficiência (KPIs)
 * - POST /bi/simulate-tax     → Simulador de Regimes Tributários
 * - POST /bi/simulate-reform  → Simulador de Reforma Tributária
 * 
 * SEGURANÇA:
 * Todas as rotas exigem JWT válido (JwtAuthGuard).
 */
@Controller('bi')
@UseGuards(JwtAuthGuard)
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('dre')
  async getDre(
    @Request() req, 
    @Query('months') months: string = '6', 
    @Query('clientId') clientId?: string
  ) {
    const { companyId } = req.user;
    const monthsNum = parseInt(months, 10) || 6;
    const data = await this.biService.getDre(companyId, monthsNum, clientId);
    return { success: true, data };
  }

  @Get('clients')
  async getClients(@Request() req) {
    const { companyId } = req.user;
    const clients = await this.biService.getClients(companyId);
    return { success: true, data: clients };
  }

  @Get('outliers')
  async getOutliers(@Request() req) {
    const { companyId } = req.user;
    const data = await this.biService.getOutliers(companyId);
    return { success: true, data };
  }

  @Get('indicators')
  async getIndicators(@Request() req) {
    const { companyId } = req.user;
    const data = await this.biService.getIndicators(companyId);
    return { success: true, data };
  }

  @Post('simulate-tax')
  async simulateTax(@Request() req, @Body() body: any) {
    const { companyId } = req.user;
    const data = await this.biService.simulateTaxRegimes(companyId, body);
    return { success: true, data };
  }

  @Post('simulate-reform')
  async simulateReform(@Request() req, @Body() body: any) {
    const { companyId } = req.user;
    const data = await this.biService.simulateTaxReform(companyId, body);
    return { success: true, data };
  }
}