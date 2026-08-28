import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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

import { VersionProposalDto, CompareVersionsDto } from './dto/version-proposal.dto';
import { CloseProposalDto } from './dto/close-proposal.dto';

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
  // 1. DASHBOARDS E MÉTRICAS (Rotas LITERAIS - DEVEM VIR PRIMEIRO)
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

  // =================================================================
  // 2. CRUD BÁSICO DE PROPOSTAS
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
    return { success: true, message: 'Proposta criada com sucesso!', data };
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
  @Roles('ADMIN', 'MANAGER')
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.service.remove(id, user.companyId);
    return { success: true, message: 'Proposta removida com sucesso!' };
  }

  // =================================================================
  // 3. MUDANÇAS DE STATUS DO FUNIL
  // =================================================================

  @Post(':id/send')
  async markAsSent(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return {
      success: true,
      data: await this.service.markAsSent(id, user.companyId),
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

  // =================================================================
  // 4. SPRINT A3: VERSIONAMENTO DE PROPOSTAS
  // =================================================================

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

  @Post(':id/version')
  @Roles('ADMIN', 'MANAGER')
  async createVersion(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: VersionProposalDto,
  ) {
    const newVersion = await this.service.createVersion(
      id, 
      user.companyId, 
      user.id, 
      dto
    );
    return {
      success: true,
      message: `Versão ${newVersion.version} criada com sucesso!`,
      data: newVersion,
    };
  }

  @Get(':id/versions')
  async listVersions(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const versions = await this.service.listVersions(id, user.companyId);
    return { success: true, data: versions };
  }

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
  // 5. SPRINT A4: FECHAMENTO COM GANHO (Rota Unificada)
  // =================================================================
  
  @Post(':id/close')
  @Roles('ADMIN', 'MANAGER')
  async close(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    if (typeof body?.discountPercent === 'number') {
      const result = await this.service.closeWithGain(
        user.companyId, 
        id, 
        body as CloseProposalDto
      );
      
      return { 
        success: true, 
        message: `Proposta fechada com ganho de R$ ${result.gain.gainMonthly.toFixed(2)}/mês`,
        data: result.proposal, 
        gain: result.gain 
      };
    }

    return {
      success: true,
      message: 'Proposta fechada (modo legado)',
      data: await this.service.closeProposal(id, user.companyId, body),
    };
  }
}