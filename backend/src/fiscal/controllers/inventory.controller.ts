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
 * Gerencia o saldo atual de estoque, histórico de movimentações (kardex)
 * e ajustes manuais de inventário.
 * 
 * 🆕 Sprint 8: Todos os endpoints suportam `clientId` para visualizar
 * apenas o estoque do cliente selecionado.
 * 
 * 📌 Endpoints:
 *   GET  /fiscal/inventory/metrics           → KPIs agregados
 *   GET  /fiscal/inventory/balance           → Saldo por produto (paginado)
 *   GET  /fiscal/inventory/movements/:id     → Kardex de um produto
 *   POST /fiscal/inventory/adjust            → Ajuste manual (sobra/quebra)
 * 
 * ⚠️ Ordem das rotas:
 * Rotas literais ('metrics', 'balance', 'adjust') devem vir ANTES
 * de rotas parametrizadas (':productId') para evitar conflitos.
 * =================================================================
 */
@Controller('fiscal/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * GET /fiscal/inventory/metrics
   * 
   * KPIs agregados do estoque para os cards do dashboard.
   * 
   * @param clientId - 🆕 Sprint 8: filtra métricas por cliente específico
   * @returns {
   *   totalProducts, productsWithStock, totalQuantity, totalValue,
   *   distinctNcms, distinctSuppliers, topProducts[]
   * }
   * 
   * 💡 Os KPIs são calculados em tempo real a partir do currentStock
   * e averageCost dos produtos, garantindo sempre dados atualizados.
   */
  @Get('metrics')
  getMetrics(@Request() req, @Query('clientId') clientId?: string) {
    return this.inventoryService.getMetrics(req.user.companyId, clientId);
  }

  /**
   * GET /fiscal/inventory/balance
   * 
   * Lista o saldo atual de cada produto (grid principal da tela de estoque).
   * 
   * @param search - Busca por descrição ou código
   * @param ncm - Filtro por NCM (aceita parcial, ex: "7318")
   * @param onlyPositive - "true" para mostrar apenas produtos com saldo > 0
   * @param page - Página atual
   * @param limit - Itens por página (máx 100)
   * @param clientId - 🆕 Sprint 8: filtra produtos por cliente
   * 
   * @returns { data: ProdutoSaldo[], meta: PaginationMeta }
   */
  @Get('balance')
  getBalance(
    @Request() req,
    @Query('search') search?: string,
    @Query('ncm') ncm?: string,
    @Query('onlyPositive') onlyPositive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('clientId') clientId?: string, // 🆕 Sprint 8
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

  /**
   * GET /fiscal/inventory/movements/:productId
   * 
   * Histórico completo de movimentações (kardex) de um produto específico.
   * Essencial para auditoria fiscal e Bloco H do SPED.
   * 
   * @param productId - UUID do produto
   * @param startDate - Filtro inicial (YYYY-MM-DD)
   * @param endDate - Filtro final (YYYY-MM-DD)
   * @param limit - Máximo de registros (padrão: 200)
   * 
   * @returns {
   *   product: { id, code, description, ncm, unit, currentStock, averageCost },
   *   movements: [ { date, type, quantity, unitCost, totalCost, averageCostAfter, invoice? } ]
   * }
   * 
   * 🛡️ Segurança: o service valida se o produto pertence ao companyId do usuário.
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
   * 
   * Registra um ajuste manual de inventário (sobra ou quebra).
   * 
   * @param body - {
   *   productId: string (obrigatório),
   *   type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO',
   *   quantity: number (> 0),
   *   reason: string (mínimo 5 caracteres)
   * }
   * 
   * @returns { movement: AjusteCriado, product: NovoSaldo }
   * 
   * 🛡️ Regras de Negócio:
   * - Ajuste negativo não pode deixar o estoque negativo (BadRequest)
   * - Justificativa é obrigatória (auditoria fiscal)
   * - Custo médio NÃO é alterado (só quantidade)
   * - userId é registrado para rastreabilidade
   * 
   * 💡 Para ajustes via NF-e (entrada/devolução), use o upload de XML.
   * Este endpoint é apenas para ajustes manuais de inventário físico.
   */
  @Post('adjust')
  async adjust(@Request() req, @Body() body: any) {
    // Validação estrutural no controller (antes de chegar ao service)
    if (!body.productId || !body.type || !body.quantity || !body.reason) {
      throw new BadRequestException(
        'Campos obrigatórios: productId, type, quantity, reason.',
      );
    }
    try {
      return await this.inventoryService.createAdjustment(
        req.user.companyId,
        req.user.id, // Auditoria: quem fez o ajuste
        {
          productId: body.productId,
          type: body.type,
          quantity: Number(body.quantity),
          reason: String(body.reason),
        },
      );
       } catch (e: any) {
      // Transforma erros de negócio em 400 Bad Request (não 500)
      throw new BadRequestException(e.message || 'Erro ao criar ajuste.');
    }
  }

  /**
   * POST /fiscal/inventory/wipe
   * ☢️ Sprint 9: exclui TODO o estoque do escopo selecionado.
   * Body: { clientId?: string | null }
   *
   * ⚠️ Operação destrutiva e irreversível — o frontend exige
   * digitar "EXCLUIR" para habilitar o botão.
   */
  @Post('wipe')
  wipe(@Request() req, @Body() body: any) {
    return this.inventoryService.wipe(req.user.companyId, body?.clientId ?? null);
  }
}