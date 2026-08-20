// =================================================================
// INÍCIO: backend/src/employee/employee.controller.ts
// =================================================================
/**
 * =================================================================
 * EmployeeController — Gestão de Colaboradores (Sprints B1+B2+B3)
 * =================================================================
 * Rotas (todas com JWT + companyId do tenant — ADR-004):
 * - GET  /employees                     → lista todos
 * - GET  /employees/metrics             → KPIs básicos
 * - GET  /employees/sector-distribution → 🅱️2 distribuição validada
 * - GET  /employees/turnover-kpis       → 🅱️3 novatos/críticos/tenure
 * - POST /employees                     → cria (contractType + isCritical)
 * - PUT  /employees/:id                 → atualiza (patch parcial)
 * - DELETE /employees/:id               → remove
 *
 * ⚠️ ORDEM DAS ROTAS: literais (metrics/sector-distribution/turnover-kpis)
 *    antes de qualquer GET parametrizado (NestJS casa na ordem).
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
  Request,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  // =================================================================
  // 📋 LISTAGEM
  // =================================================================

  /** GET /employees — lista todos do tenant, ordenados por nome. */
  @Get()
  async findAll(@Request() req) {
    const employees = await this.employeeService.findAll(req.user.companyId);
    return { data: employees };
  }

  // =================================================================
  // 📊 MÉTRICAS BÁSICAS
  // =================================================================

  /** GET /employees/metrics — total, ativos, admissões no mês. */
  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.employeeService.getMetrics(req.user.companyId);
    return { data: metrics };
  }

  // =================================================================
  // 🆕 SPRINT B2 — DISTRIBUIÇÃO POR SETOR VALIDADA
  // =================================================================

  /**
   * GET /employees/sector-distribution
   * Distribuição atual (Employee ATIVOS) × benchmark contábil (ADR-048),
   * com selos OK/OVER/UNDER e lista de departamentos não reconhecidos.
   */
  @Get('sector-distribution')
  async getSectorDistribution(@Request() req) {
    const data = await this.employeeService.getSectorDistribution(
      req.user.companyId,
    );
    return { data };
  }

  // =================================================================
  // 🆕 SPRINT B3 — KPIs DE TURNOVER (novatos + críticos + tenure)
  // =================================================================

  /**
   * GET /employees/turnover-kpis?year=2026
   * - newbieTurnoverRate: % de desligados com tenure <12 meses
   * - criticalDismissals: críticos 🔑 perdidos no ano (ADR-049)
   * - avgTenureMonths: tenure médio dos ativos
   * - criticalActive: críticos 🔑 atualmente ativos
   */
  @Get('turnover-kpis')
  async getTurnoverKpis(
    @Request() req,
    @Query('year') year?: string,
  ) {
    const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const safeYear = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
    const data = await this.employeeService.getTurnoverKpis(
      req.user.companyId,
      safeYear,
    );
    return { data };
  }

  // =================================================================
  // 💾 CRIAÇÃO
  // =================================================================

  /**
   * POST /employees
   * Body: { name*, position*, admissionDate*, email?, phone?, department?,
   *         status?, salary?, contractType?, isCritical? }
   */
  @Post()
  async create(@Request() req, @Body() dto: any) {
    const employee = await this.employeeService.create(
      req.user.companyId,
      req.user.id,
      dto,
    );
    return { message: 'Colaborador criado com sucesso!', data: employee };
  }

  // =================================================================
  // 🔄 ATUALIZAÇÃO
  // =================================================================

  /** PUT /employees/:id — patch parcial (inclui isCritical 🔑). */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const employee = await this.employeeService.update(id, dto);
    return { message: 'Colaborador atualizado!', data: employee };
  }

  // =================================================================
  // 🗑️ EXCLUSÃO
  // =================================================================

  /** DELETE /employees/:id — hard delete (futuro: soft delete). */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.employeeService.delete(id);
    return { message: 'Colaborador removido!' };
  }
}
// =================================================================
// FIM: backend/src/employee/employee.controller.ts
// =================================================================