// =================================================================
// INÍCIO: backend/src/turnover/turnover.controller.ts
// =================================================================
/**
 * =================================================================
 * 📊 TurnoverController — Rotatividade (Sprints B1→B4)
 * =================================================================
 * Rotas: dashboard, dados mensais, setores, distribuição por setor,
 * motivos, cargos e rescisões (CRUD + entrevista + análises — B4).
 *
 * 🛠️ FIX B4.1: adicionado `GET /turnover/resignations` (listagem).
 * O método existia no service (`getResignations`) mas a rota NÃO
 * estava registrada aqui → 404 no frontend → Promise.all falhava →
 * todas as abas do módulo ficavam vazias.
 *
 * 🛡️ Segurança: todas as rotas com JwtAuthGuard + companyId do
 * tenant (ADR-004).
 * =================================================================
 */
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { TurnoverService } from './turnover.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload { id: string; companyId: string; email: string; role: string; }

@Controller('turnover')
@UseGuards(JwtAuthGuard)
export class TurnoverController {
  constructor(private readonly turnoverService: TurnoverService) {}

  // =================================================================
  // 📊 DASHBOARD (dados mensais agregados do ano)
  // =================================================================
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: UserPayload, @Query('year') year: string) {
    const data = await this.turnoverService.getDashboard(
      user.companyId,
      parseInt(year) || new Date().getFullYear(),
    );
    return { success: true, data };
  }

  // =================================================================
  // 📅 DADOS MENSAIS (upsert de TurnoverMonthly)
  // =================================================================
  @Post('monthly')
  async saveMonthlyData(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.turnoverService.saveMonthlyData(
      user.companyId, user.id, body.year, body.month, body.data,
    );
    return { success: true, data };
  }

  // =================================================================
  // 🏢 SETORES (CRUD)
  // =================================================================
  @Get('sectors')
  async getSectors(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.turnoverService.getSectors(user.companyId) };
  }

  @Post('sectors')
  async createSector(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string; mandatory?: boolean },
  ) {
    return {
      success: true,
      data: await this.turnoverService.createSector(user.companyId, user.id, body.name, body.mandatory),
    };
  }

  @Delete('sectors/:id')
  async deleteSector(@Param('id') id: string) {
    await this.turnoverService.deleteSector(id);
    return { success: true };
  }

  // =================================================================
  // 📋 DISTRIBUIÇÃO POR SETOR (histórica — preenchimento manual)
  // =================================================================
  @Get('sector-distribution')
  async getSectorDistribution(
    @CurrentUser() user: UserPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return {
      success: true,
      data: await this.turnoverService.getSectorDistribution(user.companyId, parseInt(year), parseInt(month)),
    };
  }

  @Post('sector-distribution')
  async saveSectorDistribution(@CurrentUser() user: UserPayload, @Body() body: any) {
    return {
      success: true,
      data: await this.turnoverService.saveSectorDistribution(
        user.companyId, user.id, body.year, body.month, body.distributions,
      ),
    };
  }

  // =================================================================
  // 📝 MOTIVOS DE DESLIGAMENTO (CRUD)
  // =================================================================
  @Get('reasons')
  async getReasons(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.turnoverService.getDismissalReasons(user.companyId) };
  }

  @Post('reasons')
  async createReason(@CurrentUser() user: UserPayload, @Body() body: { name: string }) {
    return {
      success: true,
      data: await this.turnoverService.createDismissalReason(user.companyId, user.id, body.name),
    };
  }

  @Delete('reasons/:id')
  async deleteReason(@Param('id') id: string) {
    await this.turnoverService.deleteDismissalReason(id);
    return { success: true };
  }

  // =================================================================
  // 💼 CARGOS (CRUD)
  // =================================================================
  @Get('positions')
  async getPositions(@CurrentUser() user: UserPayload) {
    return { success: true, data: await this.turnoverService.getPositions(user.companyId) };
  }

  @Post('positions')
  async createPosition(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string; description?: string },
  ) {
    return {
      success: true,
      data: await this.turnoverService.createPosition(user.companyId, user.id, body.name, body.description),
    };
  }

  @Put('positions/:id')
  async updatePosition(
    @Param('id') id: string,
    @Body() body: { name: string; description?: string },
  ) {
    return { success: true, data: await this.turnoverService.updatePosition(id, body.name, body.description) };
  }

  @Delete('positions/:id')
  async deletePosition(@Param('id') id: string) {
    await this.turnoverService.deletePosition(id);
    return { success: true };
  }

  // =================================================================
  // 📤 RESCISÕES
  // =================================================================

  /**
   * 🛠️ FIX B4.1 — GET /turnover/resignations?year=&sectorId=&contractType=
   * Lista rescisões do tenant com filtros. SEM esta rota o frontend
   * recebia 404 e o Promise.all derrubava todas as abas.
   */
  @Get('resignations')
  async getResignations(@CurrentUser() user: UserPayload, @Query() query: any) {
    return {
      success: true,
      data: await this.turnoverService.getResignations(user.companyId, query),
    };
  }

  /** 🆕 B4: salva as 5 respostas da entrevista de desligamento. */
  @Post('resignations/:id/interview')
  async saveExitInterview(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { answers: string[] },
  ) {
    return {
      success: true,
      data: await this.turnoverService.saveExitInterview(user.companyId, id, body.answers || []),
    };
  }

  /** 🆕 B4: roda o motor de análise (ADR-050) sobre a entrevista. */
  @Post('resignations/:id/analyze')
  async analyzeResignation(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return { success: true, data: await this.turnoverService.analyzeResignation(user.companyId, id) };
  }

  /** 🆕 B4: agregado de análises p/ sub-aba "Análises IA". */
  @Get('exit-analyses')
  async getExitAnalyses(@CurrentUser() user: UserPayload, @Query('year') year?: string) {
    const parsed = year ? parseInt(year, 10) : new Date().getFullYear();
    const safe = isNaN(parsed) ? new Date().getFullYear() : parsed;
    return { success: true, data: await this.turnoverService.getExitAnalyses(user.companyId, safe) };
  }

  /** B3: dashboard de rescisões (novatos, motivo/setor críticos). */
  @Get('resignations-dashboard')
  async getResignationsDashboard(@CurrentUser() user: UserPayload, @Query('year') year?: string) {
    const parsed = year ? parseInt(year, 10) : new Date().getFullYear();
    const safe = isNaN(parsed) ? new Date().getFullYear() : parsed;
    return {
      success: true,
      data: await this.turnoverService.getResignationsDashboard(user.companyId, safe),
    };
  }

  /** Cria registro de rescisão (aceita isCritical — ADR-049). */
  @Post('resignations')
  async createResignation(@CurrentUser() user: UserPayload, @Body() body: any) {
    return {
      success: true,
      data: await this.turnoverService.createResignation(user.companyId, user.id, body),
    };
  }

  @Delete('resignations/:id')
  async deleteResignation(@Param('id') id: string) {
    await this.turnoverService.deleteResignation(id);
    return { success: true };
  }
}
// =================================================================
// FIM: backend/src/turnover/turnover.controller.ts
// =================================================================