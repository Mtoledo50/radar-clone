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
 * Sprint 14: unificação de códigos via planilha (POST unify-codes)
 * =================================================================
 */
@Controller('fiscal/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('metrics')
  getMetrics(@Request() req, @Query('clientId') clientId?: string) {
    return this.inventoryService.getMetrics(req.user.companyId, clientId);
  }

  @Get('balance')
  getBalance(
    @Request() req,
    @Query('search') search?: string,
    @Query('ncm') ncm?: string,
    @Query('onlyPositive') onlyPositive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.inventoryService.getBalance(req.user.companyId, {
      search,
      ncm,
      onlyPositive: onlyPositive === 'true',
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 50, 100),
      clientId,
    });
  }

  @Get('compare')
  compare(@Request() req, @Query('clientId') clientId?: string) {
    return this.inventoryService.getComparison(
      req.user.companyId,
      clientId || null,
    );
  }

  @Get('report/tax')
  inventoryTaxReport(
    @Request() req,
    @Query('clientId') clientId?: string,
  ) {
    return this.inventoryService.getInventoryTaxReport(
      req.user.companyId,
      clientId || null,
    );
  }

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

  @Post('adjust')
  async adjust(@Request() req, @Body() body: any) {
    if (!body.productId || !body.type || !body.quantity || !body.reason) {
      throw new BadRequestException(
        'Campos obrigatórios: productId, type, quantity, reason.',
      );
    }
    try {
      return await this.inventoryService.createAdjustment(
        req.user.companyId,
        req.user.id,
        {
          productId: body.productId,
          type: body.type,
          quantity: Number(body.quantity),
          reason: String(body.reason),
        },
      );
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Erro ao criar ajuste.');
    }
  }

  @Post('wipe')
  wipe(@Request() req, @Body() body: any) {
    return this.inventoryService.wipe(req.user.companyId, body?.clientId ?? null);
  }

  @Post('initial-import')
  initialImport(@Request() req, @Body() body: any) {
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Nenhum item para importar.');
    }
    return this.inventoryService.importInitialStock(
      req.user.companyId,
      req.user.id,
      body.clientId ?? null,
      {
        referenceDate: body.referenceDate,
        items: body.items,
      },
    );
  }

  /**
   * POST /fiscal/inventory/unify-codes
   * 🆕 Sprint 14: aplica códigos unificados da planilha.
   */
  @Post('unify-codes')
  unifyCodes(@Request() req, @Body() body: any) {
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items deve ser um array.');
    }
    return this.inventoryService.unifyCodes(req.user.companyId, body.items);
  }
}