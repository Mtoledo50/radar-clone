// =================================================================
// banking.controller.ts — Endpoints REST do Módulo Bancário
// Sprints 21–24 (extrato/categorias/fechamento) + 29 (conciliação)
// =================================================================
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BankingService } from './banking.service';
import { BankingReconcileService, MatchSuggestion } from './banking-reconcile.service';
import { BankingReviewService } from './banking-review.service';
@Controller('banking')
@UseGuards(JwtAuthGuard)
export class BankingController {
  // =================================================================
  // 🆕 CONSTRUTOR: injeção de dependências (Sprint 29)
  // O NestJS instancia e injeta os services automaticamente.
  // =================================================================
  constructor(
    private readonly bankingService: BankingService,
    private readonly reconcileService: BankingReconcileService, // 🆕 Sprint 29
    private readonly reviewService: BankingReviewService, // 🆕 Sprint 32

  ) {}

  // =================================================================
  // IMPORTAÇÃO E CONSULTA DO EXTRATO (Sprint 21)
  // =================================================================

  /** POST /banking/import — importa CSV já parseado no frontend */
  @Post('import')
  import(@Request() req, @Body() body: any) {
    return this.bankingService.importStatement(req.user.companyId, body.clientId ?? null, {
      year: Number(body.year),
      month: Number(body.month),
      fileName: body.fileName,
      rows: body.rows || [],
    });
  }

  /** GET /banking/statement — extrato + categorias + resumo do mês */
  @Get('statement')
  statement(
    @Request() req,
    @Query('clientId') clientId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.bankingService.getStatement(
      req.user.companyId,
      clientId || null,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  // =================================================================
  // CATEGORIAS / NATUREZAS (Sprint 24)
  // =================================================================

  /** GET /banking/categories — lista (com seed automático) */
  @Get('categories')
  categories(@Request() req, @Query('clientId') clientId?: string) {
    return this.bankingService.listCategories(req.user.companyId, clientId || null);
  }

  /** POST /banking/categories — cria natureza personalizada */
  @Post('categories')
  createCategory(@Request() req, @Body() body: any) {
    return this.bankingService.createCategory(
      req.user.companyId,
      body.clientId ?? null,
      body.label,
      body.group,
    );
  }

  /** PATCH /banking/categories/:id — renomeia/troca grupo */
  @Patch('categories/:id')
  updateCategory(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.bankingService.updateCategory(req.user.companyId, id, {
      label: body.label,
      group: body.group,
    });
  }

  /** DELETE /banking/categories/:id — exclui (protegido se em uso) */
  @Delete('categories/:id')
  deleteCategory(@Request() req, @Param('id') id: string) {
    return this.bankingService.deleteCategory(req.user.companyId, id);
  }

  // =================================================================
  // FECHAR / REABRIR MÊS (Sprint 24 — trava de compliance)
  // =================================================================

  /** POST /banking/close/:id — trava edição do mês */
  @Post('close/:id')
  close(@Request() req, @Param('id') id: string) {
    return this.bankingService.closeStatement(req.user.companyId, id);
  }

  /** POST /banking/reopen/:id — reabre para ajustes */
  @Post('reopen/:id')
  reopen(@Request() req, @Param('id') id: string) {
    return this.bankingService.reopenStatement(req.user.companyId, id);
  }

  // =================================================================
  // TRANSAÇÕES (Sprint 22)
  // =================================================================

  /** PATCH /banking/transactions/:id — edita + aprende regra */
  @Patch('transactions/:id')
  updateTransaction(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.bankingService.updateTransaction(req.user.companyId, id, body);
  }

  /** POST /banking/transactions — lançamento manual */
  @Post('transactions')
  createManual(@Request() req, @Body() body: any) {
    return this.bankingService.createManual(req.user.companyId, body.clientId ?? null, {
      year: Number(body.year),
      month: Number(body.month),
      date: body.date,
      description: body.description,
      amount: Number(body.amount),
      nature: body.nature,
    });
  }

  /** DELETE /banking/transactions/:id — exclui 1 transação */
  @Delete('transactions/:id')
  deleteTransaction(@Request() req, @Param('id') id: string) {
    return this.bankingService.deleteTransaction(req.user.companyId, id);
  }

  /** DELETE /banking/statements/:id — exclui o mês inteiro */
  @Delete('statements/:id')
  deleteStatement(@Request() req, @Param('id') id: string) {
    return this.bankingService.deleteStatement(req.user.companyId, id);
  }

  // =================================================================
  // 🆕 SPRINT 29: CONCILIAÇÃO BANCO × NF-e
  // =================================================================

  /** POST /banking/reconcile/suggest — roda o motor de matching */
   @Post('reconcile/suggest')
  async suggestReconcile(
    @Request() req,
    @Body() body: { clientId: string; year: number; month: number },
  ): Promise<{
    suggestions: MatchSuggestion[];
    unmatched: { banks: any[]; invoices: any[] };
    stats: any;
  }> {
    return this.reconcileService.suggest(
      req.user.companyId,
      body.clientId,
      body.year,
      body.month,
    );
  }

  /** POST /banking/reconcile/confirm — confirma/descarta pares */
  @Post('reconcile/confirm')
  confirmReconcile(
    @Request() req,
    @Body() body: { matches: Array<{ bankTransactionId: string; fiscalInvoiceId: string; action: 'confirm' | 'discard'; score?: number; breakdown?: any }> },
  ) {
    return this.reconcileService.confirm(req.user.companyId, req.user.id, body.matches);
  }

  /** GET /banking/reconcile — lista matches do mês */
  @Get('reconcile')
  listReconcile(
    @Request() req,
    @Query('clientId') clientId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reconcileService.list(
      req.user.companyId,
      clientId,
      parseInt(year),
      parseInt(month),
    );
  }

  // =================================================================
  // 🆕 SPRINT 32: WIZARD DE REVISÃO DE LANÇAMENTOS
  // =================================================================

  /**
   * GET /banking/review/groups
   * Retorna grupos de transações pendentes com sugestões
   */
  @Get('review/groups')
  async getReviewGroups(
    @Request() req,
    @Query('clientId') clientId?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.reviewService.getReviewGroups(
      req.user.companyId,
      clientId || null,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
  }

  /**
   * POST /banking/review/apply
   * Aplica natureza em lote e opcionalmente aprende a regra
   */
  @Post('review/apply')
  async applyReview(
    @Request() req,
    @Body() body: {
      items: Array<{
        transactionIds: string[];
        nature: string;
        learn: boolean;
        counterparty?: string;
      }>;
    },
  ) {
    return this.reviewService.applyReview(req.user.companyId, body.items);
  }
}