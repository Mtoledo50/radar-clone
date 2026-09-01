// =================================================================
// INÍCIO: backend/src/accounting/accounting.controller.ts
// =================================================================
/**
 * AccountingController — VERSÃO ESTÁVEL (ETAPA 2/3 • ADR-066..072)
 *
 * Endpoints organizados por domínio:
 *   • CRUD de contas contábeis
 *   • CRUD de lançamentos + conciliação
 *   • Exportação SCI • Ponte Bancário→Contábil • DRE do Cliente
 *   • 🆕 ETAPA 1: Balancete + Razão + Sugeridor de contraparte
 *   • 🆕 ETAPA 2: Importação inteligente de extrato (overlap + anti-dup)
 *   • 🆕 ADR-072: planos de contas por cliente
 *   • (ANTIGO) Import multipart (mantido para compatibilidade)
 */
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AccountingService } from './accounting.service';
import { TrialBalanceService } from './trial-balance.service';
import { LedgerService } from './ledger.service';
import { SmartImportService } from './smart-import.service';
import { ImportService } from './import.service';
import { PdfExtractService } from './domain/pdf/pdf-extract.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(
    private readonly service: AccountingService,
    private readonly trialBalanceService: TrialBalanceService,
    private readonly ledgerService: LedgerService,
    private readonly smartImport: SmartImportService,
    private readonly importService: ImportService,
    private readonly pdfExtract: PdfExtractService,

  ) {}

  // =================================================================
  // 🏦 CONTAS CONTÁBEIS (CRUD)
  // =================================================================

  @Get('accounts')
  async getAccounts(@Request() req) {
    return { success: true, data: await this.service.getAccounts(req.user.companyId) };
  }

  @Post('accounts')
  async createAccount(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createAccount(req.user.companyId, body) };
  }

  @Put('accounts/:id')
  async updateAccount(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateAccount(id, body) };
  }

  @Delete('accounts/:id')
  async deleteAccount(@Request() req, @Param('id') id: string) {
    try {
      return { success: true, data: await this.service.deleteAccount(req.user.companyId, id) };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =================================================================
  // 📝 LANÇAMENTOS CONTÁBEIS + CONCILIAÇÃO
  // =================================================================

  @Get('entries')
  async getEntries(@Request() req) {
    return { success: true, data: await this.service.getEntries(req.user.companyId) };
  }

  @Post('entries')
  async createEntry(@Request() req, @Body() body: any) {
    return { success: true, data: await this.service.createEntry(req.user.companyId, body) };
  }

  @Put('entries/:id')
  async updateEntry(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateEntry(id, req.user.companyId, body) };
  }

  @Delete('entries/:id')
  async deleteEntry(@Request() req, @Param('id') id: string) {
    await this.service.deleteEntry(id, req.user.companyId);
    return { success: true };
  }

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
  // 📤 EXPORTAÇÃO SCI + PONTE BANCÁRIO + DRE
  // =================================================================

  @Get('export-sci')
  async exportToSCI(
    @Request() req,
    @Query('clientId') clientId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const content = await this.service.exportToSCI(
      req.user.companyId,
      clientId || undefined,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
    return { success: true, content, message: 'Arquivo gerado com sucesso!' };
  }

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

  /** GET /accounting/dre — mensal (year+month) OU acumulado (start+end) */
  @Get('dre')
  async getClientDRE(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const now = new Date();
    return {
      success: true,
      data: await this.service.getClientDRE(
        req.user.companyId,
        clientId,
        year ? parseInt(year) : now.getFullYear(),
        month ? parseInt(month) : now.getMonth() + 1,
        start && end ? { start, end } : undefined,
      ),
    };
  }
  /** 🆕 Bloco 4 (ADR-078): puxa o último fechamento bancário p/ o contábil */
  @Post('bridge-from-banking')
  async bridgeFromBanking(@Request() req, @Body() body: { clientId: string }) {
    try {
      const data = await this.service.bridgeFromBanking(req.user.companyId, req.user.id, body.clientId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  // =================================================================
  // 🆕 ETAPA 1 — CICLO CONTÁBIL DO CLIENTE (Balancete + Razão)
  // =================================================================

  @Post('trial-balance/import')
  async importTrialBalance(@Request() req, @Body() body: any) {
    const result = await this.trialBalanceService.importTrialBalance(
      req.user.companyId, body.clientId, body.competence, body.content, body.fileName,
    );
    return { success: true, data: result };
  }

  @Get('trial-balance')
  async listTrialBalances(@Request() req, @Query('clientId') clientId: string) {
    return { success: true, data: await this.trialBalanceService.listTrialBalances(req.user.companyId, clientId) };
  }

  @Get('trial-balance/:id/rows')
  async getTrialBalanceRows(@Request() req, @Param('id') id: string) {
    return { success: true, data: await this.trialBalanceService.getTrialBalanceRows(id, req.user.companyId) };
  }

  @Delete('trial-balance/:id')
  async deleteTrialBalance(@Request() req, @Param('id') id: string) {
    return { success: true, data: await this.trialBalanceService.deleteTrialBalance(req.user.companyId, id) };
  }

  @Post('ledger/import')
  async importLedger(@Request() req, @Body() body: any) {
    const result = await this.ledgerService.importLedger(
      req.user.companyId, body.clientId, body.periodLabel, body.content, body.fileName,
    );
    return { success: true, data: result };
  }
  /** 🆕 Bloco 7 (ADR-080): promove o razão importado a lançamentos (alimenta o DRE) */
  @Post('ledger/promote')
  async promoteLedger(@Request() req, @Body() body: { clientId: string }) {
    try {
      const data = await this.ledgerService.promoteLedgerToEntries(req.user.companyId, body.clientId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  @Get('ledger')
  async listLedgerImports(@Request() req, @Query('clientId') clientId: string) {
    return { success: true, data: await this.ledgerService.listLedgerImports(req.user.companyId, clientId) };
  }

  @Get('ledger/counterparty-map')
  async getCounterpartyMap(@Request() req, @Query('clientId') clientId: string) {
    return { success: true, data: await this.ledgerService.getCounterpartyMap(req.user.companyId, clientId) };
  }
  // =================================================================
  // 📊 EXTRATO CONTÁBIL / RAZÃO ANALÍTICO (Para a nova tela de visualização)
  // =================================================================
  /**
   * GET /accounting/entries/period
   * Busca lançamentos de um cliente específico em um período, 
   * incluindo os dados da conta contábil (código e nome) para exibição.
   */
  @Get('entries/period')
  async getEntriesByPeriod(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const data = await this.service.getEntriesByPeriod(
      req.user.companyId,
      clientId,
      startDate,
      endDate
    );
    return { success: true, data };
  }
  // =================================================================
  // 🆕 ETAPA 2 — EXTRATO INTELIGENTE (anti-duplicidade ADR-066/067)
  // =================================================================

  @Get('import/overlap')
  async overlap(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return { success: true, data: await this.smartImport.getOverlap(req.user.companyId, clientId, start, end) };
  }

  @Delete('import/extrato')
  async deleteExtrato(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return { success: true, data: await this.smartImport.deleteImportedStatement(req.user.companyId, clientId, start, end) };
  }

  @Post('import/parse-smart')
  async parseSmart(@Request() req, @Body() body: any) {
    try {
      const data = await this.smartImport.parseSmart(req.user.companyId, body.clientId, body.content, body.bankCode);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post('import/save-smart')
  async saveSmart(@Request() req, @Body() body: any) {
    try {
      const result = await this.smartImport.saveSmart(
        req.user.companyId, body.clientId, body.drafts || [], body.mode || 'ONLY_NEW',
      );
      const msg = result.deleted > 0
        ? `${result.deleted} antigo(s) removido(s) • ${result.created} criado(s) • ${result.skipped} ignorado(s).`
        : `${result.created} lançamento(s) criado(s) • ${result.skipped} ignorado(s)/duplicado(s).`;
      return { success: true, message: msg, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
// Extratos de Bancos 
  /** 🆕 Lista bancos disponíveis p/ UI (ADR-098) */
  @Get('pdf-adapters')
  async listPdfAdapters() {
    return { success: true, data: this.pdfExtract.listAdapters() };
  }

  /** 🆕 Extrai PDF de extrato — banco opcional forçado pela UI */
@Post('extract-pdf')
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(), // 🛡️ mantém o buffer em RAM (não grava em disco)
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB de limite de segurança
}))
async extractPdf(
  @UploadedFile() file: Express.Multer.File,
  @Body('bank') bank?: string,
) {
  console.log('📥 Arquivo recebido no controller:', {
    fieldname: file?.fieldname,
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
    hasBuffer: !!file?.buffer,
    bufferLength: file?.buffer?.length,
  });

  if (!file) {
    return { success: false, message: 'Nenhum arquivo enviado' };
  }

  if (!file.buffer || file.buffer.length === 0) {
    return { success: false, message: 'Arquivo recebido sem conteúdo (buffer vazio).' };
  }

  try {
    const result = await this.pdfExtract.extract(file.buffer, bank);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
  // =================================================================
  // 🆕 ADR-072 — PLANOS DE CONTAS POR CLIENTE
  // =================================================================
  /** 🗑 DELETE /accounting/chart/:planName — exclui o plano inteiro */
  @Delete('chart/:planName')
  async deletePlan(@Request() req, @Param('planName') planName: string) {
    try {
      const data = await this.service.deletePlan(req.user.companyId, decodeURIComponent(planName));
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  @Get('plans')
  async listPlans(@Request() req) {
    return { success: true, data: await this.service.listPlans(req.user.companyId) };
  }

  @Put('client-plan')
  async setClientPlan(@Request() req, @Body() body: any) {
    try {
      const data = await this.service.setClientPlan(req.user.companyId, body.clientId, body.planName);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post('chart/import')
  async importChart(@Request() req, @Body() body: any) {
    try {
      const data = await this.service.importChartOfAccounts(
        req.user.companyId, body.clientId || null, body.planName || '', body.content,
      );
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  /** 🆕 Bloco 8: exclui uma importação de razão */
  @Delete('ledger/:id')
  async deleteLedger(@Request() req, @Param('id') id: string) {
    try {
      const data = await this.ledgerService.deleteLedgerImport(req.user.companyId, id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

    /** 🆕 Limpa lançamentos gerados por automação (mantém manuais) */
  @Post('entries/clear-automated')
  async clearAutomatedEntries(@Request() req, @Body() body: { clientId: string }) {
    try {
      const data = await this.service.clearAutomatedEntries(req.user.companyId, body.clientId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  // =================================================================
  // (ANTIGO, intacto) IMPORT MULTIPART — compatibilidade
  // =================================================================

  @Post('import/parse')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `import-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (/csv|txt/.test(extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Apenas .csv ou .txt'), false);
      },
    }),
  )
  async parseStatement(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) return { success: false, message: 'Nenhum arquivo enviado' };
    try {
      const result = await this.importService.parseBankStatement(file.path, file.originalname, req.user.companyId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Post('import/save')
  async saveStatement(@Request() req, @Body() body: any) {
    try {
      const result = await this.importService.saveImportedEntries(body.entries, req.user.companyId, req.user.id, body.clientId);
      return { success: true, message: `${result.length} lançamentos salvos com sucesso!`, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
// =================================================================
// FIM: backend/src/accounting/accounting.controller.ts
// =================================================================