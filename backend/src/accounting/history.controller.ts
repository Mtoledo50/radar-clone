import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface UserPayload {
  id: string;
  companyId: string;
  role: string;
}

/**
 * =================================================================
 * 🎛️ HistoryController — Endpoints do Pipeline Contábil
 * =================================================================
 * ✅ Decorators de HTTP ficam AQUI (não no service)
 * =================================================================
 */
@Controller('accounting/history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // 📊 Resumo do pipeline por cliente
  @Get('summary')
  async summary(
    @CurrentUser() user: UserPayload,
    @Query('clientId') clientId: string,
  ) {
    const data = await this.historyService.getSummary(user.companyId, clientId);
    return { success: true, data };
  }

  // 🏦 Importar extrato do mês (texto)
  @Post('import-statement')
  async importStatement(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.historyService.importBankStatement(
      user.companyId,
      user.id,
      body.clientId,
      body.content,
    );
    return { success: true, message: 'Extrato importado!', data };
  }

  // 🌐 Clonar Plano Padrão p/ contas do tenant (rodar 1x)
  @Post('clone-accounts')
  async clone(@CurrentUser() user: UserPayload) {
    const data = await this.historyService.cloneTemplateToTenant(user.companyId);
    return { success: true, message: 'Plano de contas clonado!', data };
  }

  // 📥 Salvar base histórica do cliente
  @Post('import-base')
  async importBase(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.historyService.importHistoryBase(
      user.companyId,
      body.clientId || null,
      body.year,
      body.content,
    );
    return { success: true, message: 'Base histórica importada!', data };
  }

  // 🤖 Conciliar PENDENTES com a base salva
  @Post('reconcile')
  async reconcile(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.historyService.reconcilePendingFromHistory(
      user.companyId,
      body.clientId,
    );
    return { success: true, message: 'Conciliação concluída!', data };
  }

  // 📤 Gerar TXT p/ SCI-Único
  @Post('export-sci')
  async exportSci(@CurrentUser() user: UserPayload, @Body() body: any) {
    const data = await this.historyService.exportSciUnico(
      user.companyId,
      body.clientId,
    );
    return { success: true, data };
  }
}