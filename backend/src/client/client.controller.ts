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
import { ClientService } from './client.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Payload tipado do usuário autenticado (via JWT)
 */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

/**
 * =================================================================
 * 🏢 ClientController — Gestão de Clientes (Multi-Tenant)
 * =================================================================
 * 🛡️ Todas as rotas exigem JWT + validam companyId do usuário
 * 📦 Respostas padronizadas: { success, message, data }
 * =================================================================
 */
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  // =================================================================
  // 📋 CRUD BÁSICO
  // =================================================================

  /**
   * Lista todos os clientes da empresa (tenant)
   * @route GET /clients
   */
  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    const data = await this.clientService.findAll(user.companyId);
    return { success: true, data };
  }

  /**
   * Cria novo cliente
   * @route POST /clients
   */
  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() dto: any) {
    const data = await this.clientService.create(
      user.companyId,
      user.id,
      dto,
    );
    return {
      success: true,
      message: 'Cliente criado com sucesso!',
      data,
    };
  }

  /**
   * Atualiza cliente existente
   * @route PUT /clients/:id
   * ✅ Proteção multi-tenant: valida companyId
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: any,
  ) {
    const data = await this.clientService.update(id, user.companyId, dto);
    return { success: true, message: 'Cliente atualizado!', data };
  }

  /**
   * Remove cliente (soft delete - marca como Churn)
   * @route DELETE /clients/:id
   * ✅ Proteção multi-tenant: valida companyId
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.clientService.delete(id, user.companyId);
    return {
      success: true,
      message: 'Cliente encerrado (Churn) com sucesso.',
    };
  }

  // =================================================================
  // 📊 DASHBOARD E MÉTRICAS
  // =================================================================

  /**
   * Retorna métricas do dashboard de clientes
   * @route GET /clients/dashboard?year=2026
   */
  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: UserPayload,
    @Query('year') year: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const data = await this.clientService.getDashboard(
      user.companyId,
      yearNum,
    );
    return { success: true, data };
  }

  /**
   * Retorna métricas resumidas de clientes
   * @route GET /clients/metrics
   * ✅ CORRIGIDO: usa @CurrentUser() e formato padronizado
   */
  @Get('metrics')
  async getMetrics(@CurrentUser() user: UserPayload) {
    const data = await this.clientService.getMetrics(user.companyId);
    return { success: true, data };
  }

  // =================================================================
  // 📅 DADOS MENSAIS (Histórico)
  // =================================================================

  /**
   * Retorna dados mensais de um ano específico
   * @route GET /clients/monthly?year=2026
   */
  @Get('monthly')
  async getMonthlyData(
    @CurrentUser() user: UserPayload,
    @Query('year') year: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const data = await this.clientService.getMonthlyData(
      user.companyId,
      yearNum,
    );
    return { success: true, data };
  }

  /**
   * Cria ou atualiza dados mensais
   * @route POST /clients/monthly
   */
  @Post('monthly')
  async upsertMonthlyData(
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    const { year, month, data } = body;
    const result = await this.clientService.upsertMonthlyData(
      user.companyId,
      user.id,
      year,
      month,
      data,
    );
    return { success: true, data: result };
  }
}