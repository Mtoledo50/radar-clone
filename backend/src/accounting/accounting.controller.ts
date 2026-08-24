// =================================================================
// INÍCIO: backend/src/accounting/accounting.controller.ts
// =================================================================
/**
 * AccountingController
 * Endpoints REST do módulo contábil:
 *   • CRUD de contas e lançamentos + conciliação
 *   • Exportação SCI • ponte Bancário→Contábil • DRE do cliente
 *   • 🆕 ETAPA 1: Balancete inicial + Razão + Sugeridor de conta
 */
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccountingService } from './accounting.service';
import { TrialBalanceService } from './trial-balance.service'; // 🆕 ETAPA 1
import { LedgerService } from './ledger.service'; // 🆕 ETAPA 1
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(
    private readonly service: AccountingService,
    private readonly trialBalanceService: TrialBalanceService, // 🆕
    private readonly ledgerService: LedgerService, // 🆕
  ) {}

  // =================================================================
  // CONTAS CONTÁBEIS (CRUD)
  // =================================================================

  /** GET /accounting/accounts — contas ativas (globais + da empresa) */
  @Get('accounts')
  async getAccounts(@Request() req) {
    return { success: true, data: await this.service.getAccounts(req.user.companyId) };
  }

  /** POST /accounting/accounts — cria conta c/ inferência de type/nature */
  @Post('accounts')
  async createAccount(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createAccount(req.user.companyId, body) };
  }

  /** PUT /accounting/accounts/:id — atualiza conta */
  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateAccount(id, body) };
  }

  /** DELETE /accounting/accounts/:id — soft delete */
  @Delete('accounts/:id')
  async deleteAccount(@Param('id') id: string) {
    return { success: true, data: await this.service.deleteAccount(id) };
  }

  // =================================================================
  // LANÇAMENTOS CONTÁBEIS (CRUD) + CONCILIAÇÃO
  // =================================================================

  /** PUT /accounting/entries/:id/conciliate — marca como CONCILIADO */
  @Put('entries/:id/conciliate')
  async conciliateEntry(@Param('id') id: string, @Request() req, @Body() body: any) {
    try {
      const result = await this.service.conciliateEntry(id, req.user.companyId, body);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /** GET /accounting/entries — lançamentos c/ nomes das contas */
  @Get('entries')
  async getEntries(@Request() req) {
    return { success: true, data: await this.service.getEntries(req.user.companyId) };
  }

  /** POST /accounting/entries — lançamento manual de partida dobrada */
  @Post('entries')
  async createEntry(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createEntry(req.user.companyId, body) };
  }

  /** PUT /accounting/entries/:id — atualiza lançamento */
  @Put('entries/:id')
  async updateEntry(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateEntry(id, req.user.companyId, body) };
  }

  /** DELETE /accounting/entries/:id — exclusão permanente */
  @Delete('entries/:id')
  async deleteEntry(@Request() req, @Param('id') id: string) {
    await this.service.deleteEntry(id, req.user.companyId);
    return { success: true };
  }

  // =================================================================
  // EXPORTAÇÃO SCI + PONTE BANCÁRIO + DRE
  // =================================================================

  /** GET /accounting/export-sci?year&month — gera CSV p/ SCI */
  @Get('export-sci')
  async exportToSCI(@Request() req, @Query('year') year?: string, @Query('month') month?: string) {
    const content = await this.service.exportToSCI(
      req.user.companyId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
    return { success: true, content, message: 'Arquivo gerado com sucesso!' };
  }

  /** POST /accounting/promote-from-banking — mês FECHADO → partidas dobradas */
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

  /** GET /accounting/dre?clientId&year&month — DRE oficial + confronto */
  @Get('dre')
  async getClientDRE(@Request() req, @Query('clientId') clientId: string, @Query('year') year?: string, @Query('month') month?: string) {
    const now = new Date();
    return {
      success: true,
      data: await this.service.getClientDRE(
        req.user.companyId,
        clientId,
        year ? parseInt(year) : now.getFullYear(),
        month ? parseInt(month) : now.getMonth() + 1,
      ),
    };
  }

  // =================================================================
  // 🆕 ETAPA 1 — CICLO CONTÁBIL DO CLIENTE (ADR-066/067)
  // =================================================================

  /**
   * POST /accounting/trial-balance/import
   * Body: { clientId, competence, content, fileName? }
   * Upload via TEXTO (zero multipart/boundary). Idempotente por período.
   */
  @Post('trial-balance/import')
  async importTrialBalance(@Request() req, @Body() body: any) {
    const result = await this.trialBalanceService.importTrialBalance(
      req.user.companyId,
      body.clientId,
      body.competence,
      body.content,
      body.fileName,
    );
    return { success: true, data: result };
  }

  /** GET /accounting/trial-balance?clientId — lista balancetes do cliente */
  @Get('trial-balance')
  async listTrialBalances(@Request() req, @Query('clientId') clientId: string) {
    return { success: true, data: await this.trialBalanceService.listTrialBalances(req.user.companyId, clientId) };
  }

  /** GET /accounting/trial-balance/:id/rows — linhas de um balancete */
  @Get('trial-balance/:id/rows')
  async getTrialBalanceRows(@Request() req, @Param('id') id: string) {
    return { success: true, data: await this.trialBalanceService.getTrialBalanceRows(id, req.user.companyId) };
  }

  /**
   * POST /accounting/ledger/import
   * Body: { clientId, periodLabel, content, fileName? }
   * Importa Razão/Livro Caixa (base mensal p/ comparação). Idempotente.
   */
  @Post('ledger/import')
  async importLedger(@Request() req, @Body() body: any) {
    const result = await this.ledgerService.importLedger(
      req.user.companyId,
      body.clientId,
      body.periodLabel,
      body.content,
      body.fileName,
    );
    return { success: true, data: result };
  }

  /** GET /accounting/ledger?clientId — lista importações de razão */
  @Get('ledger')
  async listLedgerImports(@Request() req, @Query('clientId') clientId: string) {
    return { success: true, data: await this.ledgerService.listLedgerImports(req.user.companyId, clientId) };
  }

  /**
   * 👑 GET /accounting/ledger/counterparty-map?clientId
   * Mapa contraparte→conta (ouro do razão) p/ sugerir conta no lançamento.
   */
  @Get('ledger/counterparty-map')
  async getCounterpartyMap(@Request() req, @Query('clientId') clientId: string) {
    return { success: true, data: await this.ledgerService.getCounterpartyMap(req.user.companyId, clientId) };
  }
}
// =================================================================
// FIM: backend/src/accounting/accounting.controller.ts
// =================================================================