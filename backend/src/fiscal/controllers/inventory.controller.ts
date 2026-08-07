import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * =================================================================
 * 📦 InventoryController — Estoque Fiscal e Kardex
 * =================================================================
 * Endpoints:
 *   GET  /fiscal/inventory/metrics          → KPIs agregados
 *   GET  /fiscal/inventory/balance          → saldo por produto (paginado)
 *   GET  /fiscal/inventory/movements/:id    → kardex de um produto
 *   POST /fiscal/inventory/adjust           → ajuste manual de inventário
 *
 * ⚠️ Ordem das rotas: literais ANTES de ':id' para evitar conflitos.
 * =================================================================
 */
@Controller('fiscal/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * GET /fiscal/inventory/metrics
   * KPIs agregados do estoque (cards do dashboard de estoque)
   */
  @Get('metrics')
  getMetrics(@Request() req) {
    return this.inventoryService.getMetrics(req.user.companyId);
  }

  /**
   * GET /fiscal/inventory/balance?search=&ncm=&onlyPositive=&page=&limit=
   * Saldo atual por produto (grid da tela de estoque)
   */
  @Get('balance')
  getBalance(
    @Request() req,
    @Query('search') search?: string,
    @Query('ncm') ncm?: string,
    @Query('onlyPositive') onlyPositive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getBalance(req.user.companyId, {
      search,
      ncm,
      onlyPositive: onlyPositive === 'true',
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
    });
  }

  /**
   * GET /fiscal/inventory/movements/:productId?startDate=&endDate=&limit=
   * Kardex (histórico de movimentações) de um produto específico
   */
  @Get('movements/:productId')
  getMovements(
    @Request() req,
    @Param('productId') productId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovements(req.user.companyId, productId, {
      startDate,
      endDate,
      limit: limit ? Number(limit) : 200,
    });
  }

    /**
   * POST /fiscal/inventory/adjust
   * Ajuste manual de inventário (sobra/quebra)
   * Exceções de negócio (400/404) propagam direto do service
   */
  @Post('adjust')
  adjust(@Request() req, @Body() body: any) {
    if (!body.productId || !body.type || !body.quantity || !body.reason) {
      throw new BadRequestException(
        'Campos obrigatórios: productId, type, quantity, reason.',
      );
    }
    return this.inventoryService.createAdjustment(
      req.user.companyId,
      req.user.id,
      {
        productId: body.productId,
        type: body.type,
        quantity: Number(body.quantity),
        reason: String(body.reason),
      },
    );
  }
}