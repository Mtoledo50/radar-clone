// =================================================================
// INÍCIO: backend/src/employee/employee.controller.ts
// =================================================================
/**
 * =================================================================
 * EmployeeController — Gestão de Colaboradores (Sprint B1)
 * =================================================================
 * Endpoints REST para CRUD de colaboradores (Employee).
 *
 * 🛡️ Segurança:
 * - Todas as rotas exigem JWT (JwtAuthGuard)
 * - Queries filtradas por companyId (multi-tenant ADR-004)
 *
 * 🆕 Sprint B1: aceita `contractType` no body de POST/PUT.
 *
 * Rotas:
 * - GET    /employees          → lista todos do tenant
 * - GET    /employees/metrics  → KPIs (total, ativos, admissões)
 * - POST   /employees          → cria colaborador
 * - PUT    /employees/:id      → atualiza colaborador
 * - DELETE /employees/:id      → remove colaborador
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

  /**
   * GET /employees
   * Lista todos os colaboradores do tenant logado, ordenados por nome.
   */
  @Get()
  async findAll(@Request() req) {
    const employees = await this.employeeService.findAll(req.user.companyId);
    return { data: employees };
  }

  // =================================================================
  // 📊 MÉTRICAS
  // =================================================================

  /**
   * GET /employees/metrics
   * KPIs básicos: total, ativos, admissões no mês, taxa de turnover.
   * 🆕 Sprint B1: métricas ainda básicas; B2/B3 expandirão.
   */
  @Get('metrics')
  async getMetrics(@Request() req) {
    const metrics = await this.employeeService.getMetrics(req.user.companyId);
    return { data: metrics };
  }

  // =================================================================
  // 💾 CRIAÇÃO
  // =================================================================

  /**
   * POST /employees
   * Cria um novo colaborador.
   * 🆕 Sprint B1: aceita `contractType` (CLT/ESTAGIARIO/TERCEIRIZADO/SOCIO).
   *
   * Body esperado:
   * {
   *   name: string,
   *   email?: string,
   *   phone?: string,
   *   position: string,
   *   department?: string,
   *   admissionDate: string (AAAA-MM-DD),
   *   dismissalDate?: string,
   *   salary?: number,
   *   status?: 'ACTIVE' | 'INACTIVE' | 'DISMISSED',
   *   contractType?: 'CLT' | 'ESTAGIARIO' | 'TERCEIRIZADO' | 'SOCIO'
   * }
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

  /**
   * PUT /employees/:id
   * Atualiza dados do colaborador (patch parcial).
   * 🆕 Sprint B1: aceita `contractType`.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const employee = await this.employeeService.update(id, dto);
    return { message: 'Colaborador atualizado!', data: employee };
  }

  // =================================================================
  // 🗑️ EXCLUSÃO
  // =================================================================

  /**
   * DELETE /employees/:id
   * Remove colaborador (hard delete — futuro: soft delete).
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.employeeService.delete(id);
    return { message: 'Colaborador removido!' };
  }
}
// =================================================================
// FIM: backend/src/employee/employee.controller.ts
// =================================================================