// =================================================================
// INÍCIO: backend/src/proposals/proposals.controller.ts
// =================================================================
/**
 * =================================================================
 * 📋 ProposalsController — Gestão de Propostas Comerciais
 * =================================================================
 * Sprints integradas: A1 (herança) • A2 (insights) • A3 (versões) •
 * A4 (fechamento com ganho) • A5 (branding) • A6 (PDF/PNG) •
 * A7 (🆕 Dashboard de Desempenho).
 *
 * 🛡️ PROTEÇÃO:
 * - @UseGuards(JwtAuthGuard, RolesGuard): auth + RBAC em nível de classe
 * - @Roles('ADMIN'): operações sensíveis (nova versão, exclusão)
 *
 * ⚠️ ORDEM DAS ROTAS (NestJS):
 *    Rotas LITERAIS (ex: /dashboard, /performance) devem vir ANTES de
 *    rotas com parâmetro (:id). Se /performance vier depois de @Get(':id'),
 *    o NestJS interpreta "performance" como id e retorna 404.
 * =================================================================
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch, // 🆕 ADICIONADO: Faltava este import
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
// 🆕 ADICIONADO: Imports dos novos DTOs da Sprint A3
import { VersionProposalDto, CompareVersionsDto } from './dto/version-proposal.dto';
import { CloseProposalDto } from './dto/close-proposal.dto';

/** Payload do JWT (espelho do que o JwtStrategy injeta). */
interface UserPayload {
  id: string;
  companyId: string;
  email: string;
  role: string;
}

@Controller('proposals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProposalsController {
  constructor(private readonly service: ProposalsService) {}

  // =================================================================
  // 📊 DASHBOARDS E MÉTRICAS (rotas LITERAIS — antes das parametrizadas)
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

  /**
   * 🆕 SPRINT A7 — Dashboard de Desempenho Comercial
   * Funil + tempo médio + desconto médio + ganho acumulado (closingDetails)
   * + top fechamentos + motivos de perda.
   */
  @Get('performance')
  async getPerformance(
    @CurrentUser() user: UserPayload,
    @Query('period') period: string,
  ) {
    return {
      success: true,
      data: await this.service.getPerformance(user.companyId, period),
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
   */
  @Post(':id/new-version')
  @Roles('ADMIN')
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
// 🆕 SPRINT A4: Fechamento com Ganho
// =================================================================

/**
 * POST /proposals/:id/close
 * Fecha a proposta com desconto + memória de cálculo (ADR-029).
 * Trava: proposta já fechada não pode ser re-fechada.
 */
@Post(':id/close')
@Roles('ADMIN', 'MANAGER')
async closeWithGain(
  @Param('id') id: string,
  @CurrentUser() user: UserPayload,
  @Body() dto: CloseProposalDto,
) {
  const result = await this.service.closeWithGain(
    user.companyId,
    id,
    dto,
  );
  return {
    success: true,
    message: `Proposta fechada com ganho de R$ ${result.gain.gainMonthly.toFixed(2)}/mês`,
    data: result,
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
// =================================================================
// 🆕 SPRINT A3: ENDPOINTS DE VERSIONAMENTO
// =================================================================

/**
 * POST /proposals/:id/version
 * Cria uma nova versão da proposta.
 */
@Post(':id/version')
@Roles('ADMIN', 'MANAGER')
async createVersion(
  @Param('id') id: string,
  @CurrentUser() user: UserPayload,
  @Body() dto: VersionProposalDto,
) {
  const newVersion = await this.service.createVersion(id, user.companyId, user.id, dto);
  return {
    success: true,
    message: `Versão ${newVersion.version} criada com sucesso!`,
    data: newVersion,
  };
}

/**
 * GET /proposals/:id/versions
 * Lista todas as versões de uma proposta.
 */
@Get(':id/versions')
async listVersions(
  @Param('id') id: string,
  @CurrentUser() user: UserPayload,
) {
  const versions = await this.service.listVersions(id, user.companyId);
  return { success: true, data: versions };
}

/**
 * POST /proposals/compare
 * Compara duas versões lado a lado.
 */
@Post('compare')
async compareVersions(
  @CurrentUser() user: UserPayload,
  @Body() dto: CompareVersionsDto,
) {
  const result = await this.service.compareVersions(
    dto.versionAId,
    dto.versionBId,
    user.companyId,
  );
  return { success: true, data: result };
}

/**
 * PATCH /proposals/:id/activate
 * Torna esta versão a "atual" (isCurrent = true).
 */
@Patch(':id/activate')
@Roles('ADMIN', 'MANAGER')
async activateVersion(
  @Param('id') id: string,
  @CurrentUser() user: UserPayload,
) {
  const activated = await this.service.activateVersion(id, user.companyId);
  return {
    success: true,
    message: `Versão ${activated.version} ativada com sucesso!`,
    data: activated,
  };
}
  // =================================================================
  // 💰 SPRINT A4 — Fechamento com Ganho (rota unificada)
  // =================================================================
  /**
   * POST /proposals/:id/close
   * - body.discountPercent (número) → Fechamento com Ganho (A4)
   * - body.price/planId (legado)    → comportamento da UI antiga
   */
  @Post(':id/close')
  async close(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    if (typeof body?.discountPercent === 'number') {
      const result = await this.service.closeWithGain(user.companyId, id, body);
      return { success: true, data: result.proposal, gain: result.gain };
    }
    return {
      success: true,
      data: await this.service.closeProposal(id, user.companyId, body),
    };
  }
}
// =================================================================
// FIM: backend/src/proposals/proposals.controller.ts
// =================================================================