// =================================================================
// INÍCIO: accounting.controller.ts
// =================================================================
/**
 * AccountingController
 * Gerencia os endpoints REST para contas contábeis, lançamentos 
 * e exportação de arquivos para o sistema SCI.
 * 
 * 🆕 Sprint 25.2: endpoint promote-from-banking
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
  Request 
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  // =================================================================
  // ENDPOINTS DE CONTAS CONTÁBEIS (CRUD)
  // =================================================================

  @Get('accounts')
  async getAccounts(@Request() req) {
    return { 
      success: true, 
      data: await this.service.getAccounts(req.user.companyId) 
    };
  }

  @Post('accounts')
  async createAccount(@Request() req, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.createAccount(req.user.companyId, body) 
    };
  }

  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.updateAccount(id, body) 
    };
  }

  @Delete('accounts/:id')
  async deleteAccount(@Param('id') id: string) {
    return { 
      success: true, 
      data: await this.service.deleteAccount(id) 
    };
  }

  // =================================================================
  // CONCILIAÇÃO DE LANÇAMENTOS
  // =================================================================

  @Put('entries/:id/conciliate')
  async conciliateEntry(@Param('id') id: string, @Request() req, @Body() body: any) {
    try {
      const result = await this.service.conciliateEntry(id, req.user.companyId, body);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // ENDPOINTS DE LANÇAMENTOS CONTÁBEIS (CRUD)
  // =================================================================

  @Get('entries')
  async getEntries(@Request() req) {
    return { 
      success: true, 
      data: await this.service.getEntries(req.user.companyId) 
    };
  }

  @Post('entries')
  async createEntry(@Request() req, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.createEntry(req.user.companyId, body) 
    };
  }

  @Put('entries/:id')
  async updateEntry(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { 
      success: true, 
      data: await this.service.updateEntry(id, req.user.companyId, body) 
    };
  }

  @Delete('entries/:id')
  async deleteEntry(@Request() req, @Param('id') id: string) {
    await this.service.deleteEntry(id, req.user.companyId);
    return { success: true };
  }

  // =================================================================
  // EXPORTAÇÃO PARA SCI
  // =================================================================

  @Get('export-sci')
  async exportToSCI(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {
    const content = await this.service.exportToSCI(
      req.user.companyId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined
    );

    return { 
      success: true, 
      content,
      message: 'Arquivo gerado com sucesso!' 
    };
  }

  // =================================================================
  // 🆕 SPRINT 25.2: PROMOVER TRANSAÇÕES BANCÁRIAS P/ CONTÁBIL
  // =================================================================
  /**
   * POST /accounting/promote-from-banking
   * Body: { statementId, clientId?, accountMapping, bankAccountId }
   * 
   * Transforma todas as transações de um mês FECHADO em lançamentos
   * contábeis de partida dobrada, usando o mapeamento categoria → conta.
   * Idempotente: não duplica lançamentos já promovidos.
   */
  @Post('promote-from-banking')
  async promoteFromBanking(@Request() req, @Body() body: any) {
    const result = await this.service.promoteFromBanking(req.user.companyId, {
      statementId: body.statementId,
      clientId: body.clientId || null,
      accountMapping: body.accountMapping || {},
      bankAccountId: body.bankAccountId,
    });

    return { success: true, data: result };
  }
}
// =================================================================
// FIM: accounting.controller.ts
// =================================================================