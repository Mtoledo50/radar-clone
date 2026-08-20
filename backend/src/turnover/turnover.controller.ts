// =================================================================
// INÍCIO: backend/src/turnover/turnover.controller.ts
// =================================================================
/**
 * =================================================================
 * 📊 TurnoverController — Gestão de Rotatividade (Sprints B1+B2+B3)
 * =================================================================
 * Endpoints REST para o módulo de Turnover:
 * - Dashboard mensal (TurnoverMonthly)
 * - Dados mensais (CRUD)
 * - Setores (CRUD)
 * - Distribuição por setor (histórica — preenchimento manual)
 * - Motivos de desligamento (CRUD)
 * - Cargos (CRUD)
 * - Rescisões (CRUD + dashboard 🆕 B3)
 *
 * 🛡️ Segurança:
 * - Todas as rotas exigem JWT (JwtAuthGuard)
 * - Queries filtradas por companyId (multi-tenant ADR-004)
 * - Uso uniforme de `@CurrentUser()` (ADR-034)
 *
 * 🆕 Sprint B3: endpoint `GET /turnover/resignations-dashboard`
 * alimenta os 4 KPIs da aba Rescisões → Dashboard com dados reais
 * (antes eram placeholders hardcoded "0" / "N/A").
 * =================================================================
 */
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
import { TurnoverService } from './turnover.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 🆕 Sprint B3: tipagem do payload do JWT (espelho do JwtStrategy).
 * Antes usávamos `@Request() req` + `req.user.xxx` (menos tipado).
 * Agora: `@CurrentUser() user: UserPayload` (mais limpo e tipado).
 */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('turnover')
@UseGuards(JwtAuthGuard)
export class TurnoverController {
  constructor(private readonly turnoverService: TurnoverService) {}

  // =================================================================
  // 📊 DASHBOARD (dados mensais agregados do ano)
  // =================================================================

  /**
   * GET /turnover/dashboard?year=2026
   * Retorna os 12 meses de TurnoverMonthly do ano + KPIs agregados
   * (total admissões/demissões/headcount atual).
   */
  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: UserPayload,
    @Query('year') year: string,
  ) {
    const data = await this.turnoverService.getDashboard(
      user.companyId,
      parseInt(year) || new Date().getFullYear(),
    );
    return { success: true, data };
  }

  // =================================================================
  // 📅 DADOS MENSAIS (CRUD de TurnoverMonthly)
  // =================================================================

  /**
   * POST /turnover/monthly
   * Upsert dos dados mensais (clt/intern/third/partner × initial/admissions/dismissals).
   * Body: { year, month, data: { cltInitial, cltAdmissions, ... } }
   */
  @Post('monthly')
  async saveMonthlyData(
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    const data = await this.turnoverService.saveMonthlyData(
      user.companyId,
      user.id,
      body.year,
      body.month,
      body.data,
    );
    return { success: true, data };
  }

  // =================================================================
  // 🏢 SETORES (CRUD)
  // =================================================================

  /** GET /turnover/sectors — lista todos os setores do tenant. */
  @Get('sectors')
  async getSectors(@CurrentUser() user: UserPayload) {
    const data = await this.turnoverService.getSectors(user.companyId);
    return { success: true, data };
  }

  /** POST /turnover/sectors — cria setor (body: { name, mandatory? }). */
  @Post('sectors')
  async createSector(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string; mandatory?: boolean },
  ) {
    const data = await this.turnoverService.createSector(
      user.companyId,
      user.id,
      body.name,
      body.mandatory,
    );
    return { success: true, data };
  }

  /** DELETE /turnover/sectors/:id — remove setor (não-mandatórios apenas). */
  @Delete('sectors/:id')
  async deleteSector(@Param('id') id: string) {
    await this.turnoverService.deleteSector(id);
    return { success: true };
  }

  // =================================================================
  // 📋 DISTRIBUIÇÃO POR SETOR (histórica — preenchimento manual)
  // =================================================================
  // ⚠️ NOTA: isto é a distribuição MANUAL (TurnoverSectorDistribution).
  // A distribuição AO VIVO (derivada dos Employee ATIVOS) está em
  // `GET /employees/sector-distribution` (EmployeeController — B2).
  // =================================================================

  /**
   * GET /turnover/sector-distribution?year=2026&month=8
   * Retorna a distribuição manual preenchida pelo usuário p/ o mês.
   */
  @Get('sector-distribution')
  async getSectorDistribution(
    @CurrentUser() user: UserPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const data = await this.turnoverService.getSectorDistribution(
      user.companyId,
      parseInt(year),
      parseInt(month),
    );
    return { success: true, data };
  }

  /**
   * POST /turnover/sector-distribution
   * Salva/substitui a distribuição manual do mês.
   * Body: { year, month, distributions: [{ sectorId, initial, admissions, dismissals }] }
   */
  @Post('sector-distribution')
  async saveSectorDistribution(
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    const data = await this.turnoverService.saveSectorDistribution(
      user.companyId,
      user.id,
      body.year,
      body.month,
      body.distributions,
    );
    return { success: true, data };
  }

  // =================================================================
  // 📝 MOTIVOS DE DESLIGAMENTO (CRUD)
  // =================================================================

  /** GET /turnover/reasons — lista todos os motivos do tenant. */
  @Get('reasons')
  async getReasons(@CurrentUser() user: UserPayload) {
    const data = await this.turnoverService.getDismissalReasons(user.companyId);
    return { success: true, data };
  }

  /** POST /turnover/reasons — cria motivo (body: { name }). */
  @Post('reasons')
  async createReason(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string },
  ) {
    const data = await this.turnoverService.createDismissalReason(
      user.companyId,
      user.id,
      body.name,
    );
    return { success: true, data };
  }

  /** DELETE /turnover/reasons/:id — remove motivo. */
  @Delete('reasons/:id')
  async deleteReason(@Param('id') id: string) {
    await this.turnoverService.deleteDismissalReason(id);
    return { success: true };
  }

  // =================================================================
  // 💼 CARGOS (CRUD)
  // =================================================================

  /** GET /turnover/positions — lista todos os cargos do tenant. */
  @Get('positions')
  async getPositions(@CurrentUser() user: UserPayload) {
    const data = await this.turnoverService.getPositions(user.companyId);
    return { success: true, data };
  }

  /** POST /turnover/positions — cria cargo (body: { name, description? }). */
  @Post('positions')
  async createPosition(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string; description?: string },
  ) {
    const data = await this.turnoverService.createPosition(
      user.companyId,
      user.id,
      body.name,
      body.description,
    );
    return { success: true, data };
  }

  /** PUT /turnover/positions/:id — atualiza cargo. */
  @Put('positions/:id')
  async updatePosition(
    @Param('id') id: string,
    @Body() body: { name: string; description?: string },
  ) {
    const data = await this.turnoverService.updatePosition(
      id,
      body.name,
      body.description,
    );
    return { success: true, data };
  }

  /** DELETE /turnover/positions/:id — remove cargo. */
  @Delete('positions/:id')
  async deletePosition(@Param('id') id: string) {
    await this.turnoverService.deletePosition(id);
    return { success: true };
  }

  // =================================================================
  // 🆕 SPRINT B3: RESCISÕES (CRUD + DASHBOARD)
  // =================================================================

  /**
   * 🆕 Sprint B3: GET /turnover/resignations-dashboard?year=2026
   *
   * Alimenta os 4 KPIs da aba Rescisões → Dashboard com dados REAIS:
   * - totalDismissals (desligamentos no ano)
   * - newbieDismissals + newbieTurnoverRate (tenure < 12m)
   * - topReason (motivo mais frequente)
   * - topSector (setor com mais desligamentos)
   *
   * Antes os KPIs eram hardcoded ("0" / "N/A"). Agora vêm do banco.
   *
   * ⚠️ ORDEM DAS ROTAS (NestJS): rota LITERAL deve vir ANTES de
   *    qualquer rota parametrizada (ex: @Get('resignations/:id')).
   *    Por isso esta rota está posicionada antes do POST/DELETE abaixo.
   */
  @Get('resignations-dashboard')
  async getResignationsDashboard(
    @CurrentUser() user: UserPayload,
    @Query('year') year?: string,
  ) {
    const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const safeYear = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
    const data = await this.turnoverService.getResignationsDashboard(
      user.companyId,
      safeYear,
    );
    return { success: true, data };
  }

  /**
   * POST /turnover/resignations
   * Cria registro de rescisão.
   * 🆕 Sprint B3 (ADR-049): body aceita `isCritical` (cópia histórica
   * do flag no momento do desligamento — não depende do Employee atual).
   */
  @Post('resignations')
  async createResignation(
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    const data = await this.turnoverService.createResignation(
      user.companyId,
      user.id,
      body,
    );
    return { success: true, data };
  }

  /** DELETE /turnover/resignations/:id — remove rescisão. */
  @Delete('resignations/:id')
  async deleteResignation(@Param('id') id: string) {
    await this.turnoverService.deleteResignation(id);
    return { success: true };
  }
}
// =================================================================
// FIM: backend/src/turnover/turnover.controller.ts
// =================================================================