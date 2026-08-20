// =================================================================
// INÍCIO: backend/src/employee/employee.controller.ts
// =================================================================
/**
 * =================================================================
 * EmployeeController — Gestão de Colaboradores (Sprints B1 + B2)
 * =================================================================
 * Endpoints REST para CRUD de colaboradores (Employee).
 *
 * 🛡️ Segurança:
 * - Todas as rotas exigem JWT (JwtAuthGuard)
 * - Queries filtradas por companyId (multi-tenant ADR-004)
 *
 * Rotas:
 * - GET    /employees                  → lista todos do tenant
 * - GET    /employees/metrics          → KPIs (total, ativos, admissões)
 * - GET    /employees/sector-distribution → 🆕 Sprint B2: distribuição por setor
 * - POST   /employees                  → cria colaborador
 * - PUT    /employees/:id              → atualiza colaborador
 * - DELETE /employees/:id              → remove colaborador
 *
 * ⚠️ ORDEM DAS ROTAS (NestJS): rotas LITERAIS antes de parametrizadas.
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

  @Get()
  async findAll(@Request() req) {
    const employees = await this.employeeService.findAll(req.user.companyId);
    return { data: employees };
  }

  // =================================================================
  // 📊 MÉTRICAS
  // =================================================================

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
   * Distribuição atual por setor (derivada dos Employee ATIVOS)
   * comparada com o benchmark contábil.
   *
   * Retorno:
   * {
   *   totalActive: number,
   *   sectors: [
   *     { name, current, currentPct, recommendedPct, recommendedHeadcount,
   *       delta, status: 'OK' | 'OVER' | 'UNDER' }
   *   ],
   *   unmapped: [{ name, current }]
   * }
   */
  @Get('sector-distribution')
  async getSectorDistribution(@Request() req) {
    const data = await this.employeeService.getSectorDistribution(
      req.user.companyId,
    );
    return { data };
  }

  // =================================================================
  // 💾 CRIAÇÃO
  // =================================================================

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

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const employee = await this.employeeService.update(id, dto);
    return { message: 'Colaborador atualizado!', data: employee };
  }

  // =================================================================
  // 🗑️ EXCLUSÃO
  // =================================================================

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.employeeService.delete(id);
    return { message: 'Colaborador removido!' };
  }
}
// =================================================================
// FIM: backend/src/employee/employee.controller.ts
// =================================================================