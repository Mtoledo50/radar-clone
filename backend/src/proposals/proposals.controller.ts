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
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';           // 🆕 A3
import { Roles } from '../common/decorators/roles.decorator';        // 🆕 A3
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * =================================================================
 * 📋 ProposalsController — Gestão de Propostas Comerciais
 * =================================================================
 * 🛡️ PROTEÇÃO:
 * - @UseGuards(JwtAuthGuard, RolesGuard): auth + RBAC
 * - @Roles('ADMIN'): apenas em operações sensíveis (nova versão, exclusão)
 * =================================================================
 */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('proposals')
@UseGuards(JwtAuthGuard, RolesGuard)  // ✅ CORRIGIDO: adicionado RolesGuard
export class ProposalsController {
  constructor(private readonly service: ProposalsService) {}

  // =================================================================
  // 📊 DASHBOARDS E MÉTRICAS
  // =================================================================

  @Get('dashboard')
  async getDashboardStats(
    @CurrentUser() user: UserPayload,
    @Query('period') period: string,
  ) {
    return {
      success: true,
      data: await this.service.getDashboardStats(user.companyId, period),
    };
  }

  @Get('trend')
  async getTrendData(
    @CurrentUser() user: UserPayload,
    @Query('period') period: string,
  ) {
    return {
      success: true,
      data: await this.service.getTrendData(user.companyId, period),
    };
  }

  @Get('loss-reasons')
  async getLossReasonsData(
    @CurrentUser() user: UserPayload,
    @Query('period') period: string,
  ) {
    return {
      success: true,
      data: await this.service.getLossReasonsData(user.companyId, period),
    };
  }

  @Get('conversion-trend')
  async getConversionTrend(
    @CurrentUser() user: UserPayload,
    @Query('period') period: string,
  ) {
    return {
      success: true,
      data: await this.service.getConversionTrend(user.companyId, period),
    };
  }

  // =================================================================
  // 🆕 SPRINT A3: Versões de Proposta
  // =================================================================

  /**
   * Lista todas as versões de proposta para um cliente específico.
   * Agrupa por originalProposalId e retorna a versão atual + histórico.
   *
   * GET /proposals/client/:clientId/versions
   */
  @Get('client/:clientId/versions')
  async getProposalsByClient(
    @Param('clientId') clientId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return {
      success: true,
      data: await this.service.getProposalsByClient(user.companyId, clientId),
    };
  }

  /**
   * Cria uma nova versão de uma proposta existente.
   * Duplica todos os dados, incrementa o version e marca como atual.
   *
   * POST /proposals/:id/new-version
   */
  @Post(':id/new-version')
  @Roles('ADMIN')  // ✅ Agora funciona porque importamos Roles + RolesGuard
  async createNewVersion(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const newProposal = await this.service.createNewVersion(
      id,
      user.companyId,
      user.id,
    );

    return {
      success: true,
      message: `Versão ${newProposal.version} criada com sucesso!`,
      data: newProposal,
    };
  }

  // =================================================================
  // 📋 CRUD
  // =================================================================

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
  ) {
    const data = await this.service.findAll(user.companyId, status);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      success: true,
      data: await this.service.findOne(id, user.companyId),
    };
  }

  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.service.create(user.companyId, user.id, body);
    return { success: true, message: 'Proposta criada!', data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    return {
      success: true,
      data: await this.service.update(id, user.companyId, body),
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.remove(id, user.companyId);
    return { success: true, message: 'Proposta removida!' };
  }

  // =================================================================
  // 🔄 MUDANÇAS DE STATUS
  // =================================================================

  @Post(':id/close')
  async closeProposal(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: { planId: string; price: number },
  ) {
    return {
      success: true,
      data: await this.service.closeProposal(id, user.companyId, body),
    };
  }

  @Post(':id/lose')
  async markAsLost(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: { reason: string },
  ) {
    return {
      success: true,
      data: await this.service.markAsLost(id, user.companyId, body.reason),
    };
  }

  @Post(':id/send')
  async markAsSent(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      success: true,
      data: await this.service.markAsSent(id, user.companyId),
    };
  }
}