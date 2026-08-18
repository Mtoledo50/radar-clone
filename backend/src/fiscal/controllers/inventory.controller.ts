import {
  Controller,
  Get,
  Post,
  Put, // 🆕 Sprint 16: edição manual de produto
  Delete, // 🆕 Sprint 16: exclusão de produto
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
 * 📦 InventoryController — Estoque Fiscal, Kardex e Relatórios
 * =================================================================
 * Gerencia o saldo atual de estoque, histórico de movimentações
 * (kardex), ajustes manuais, importações, relatórios fiscais e a
 * manutenção manual de produtos (Sprint 16).
 *
 * 🆕 Sprint 8:  todos os endpoints suportam `clientId` (multi-cliente)
 * 🆕 Sprint 15: drill-down da conciliação (compare/:id/details)
 * 🆕 Sprint 16: edição manual (PUT) e exclusão (DELETE) de produto
 *
 * 📌 Endpoints:
 *   GET    /fiscal/inventory/metrics                → KPIs agregados
 *   GET    /fiscal/inventory/balance                → Saldo por produto (paginado)
 *   GET    /fiscal/inventory/compare                → Conciliação inicial × NF-e × atual
 *   GET    /fiscal/inventory/compare/:id/details    → 🆕 Sprint 15: drill-down
 *   GET    /fiscal/inventory/report/tax             → Relatório H010 (17 colunas)
 *   GET    /fiscal/inventory/movements/:productId   → Kardex do produto
 *   POST   /fiscal/inventory/adjust                 → Ajuste manual (sobra/quebra)
 *   POST   /fiscal/inventory/wipe                   → Excluir todo o estoque
 *   POST   /fiscal/inventory/initial-import         → Importar saldo inicial
 *   POST   /fiscal/inventory/unify-codes            → Unificar códigos (planilha)
 *   PUT    /fiscal/inventory/products/:id           → 🆕 Editar produto
 *   DELETE /fiscal/inventory/products/:id           → 🆕 Excluir produto
 *
 * ⚠️ Ordem das rotas:
 * Rotas literais ('metrics', 'balance', 'compare', 'report/tax',
 * 'adjust', 'wipe', 'initial-import', 'unify-codes') vêm ANTES das
 * parametrizadas ('movements/:id', 'compare/:id/details',
 * 'products/:id') para evitar conflitos de matching.
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
   * @param clientId - 🆕 Sprint 8: filtra métricas por cliente
   * @returns { totalProducts, productsWithStock, totalQuantity,
   *            totalValue, distinctNcms, distinctSuppliers, topProducts[] }
   */
  @Get('metrics')
  getMetrics(@Request() req, @Query('clientId') clientId?: string) {
    return this.inventoryService.getMetrics(req.user.companyId, clientId);
  }

  /**
   * GET /fiscal/inventory/balance
   *
   * Lista o saldo atual de cada produto (grid principal da tela).
   *
   * @param search - Busca por descrição ou código
   * @param ncm - Filtro por NCM (aceita parcial)
   * @param onlyPositive - "true" para mostrar apenas saldo > 0
   * @param page / limit - paginação (limit máx 100)
   * @param clientId - 🆕 Sprint 8: filtra por cliente
   */
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

  /**
   * GET /fiscal/inventory/compare?clientId=
   *
   * ⚖️ Sprint 11: conciliação estoque inicial (PDF) × entradas NF-e
   * × saldo atual. Retorna { summary, rows[] } com divergências.
   */
  @Get('compare')
  compare(@Request() req, @Query('clientId') clientId?: string) {
    return this.inventoryService.getComparison(
      req.user.companyId,
      clientId || null,
    );
  }

  /**
   * GET /fiscal/inventory/compare/:productId/details
   *
   * 🆕 Sprint 15: drill-down da conciliação — evidências por origem
   * (saldo inicial, NF-es com fornecedor/CNPJ/chave, ajustes) +
   * flags de procedência do código.
   */
  @Get('compare/:productId/details')
  compareDetails(@Request() req, @Param('productId') productId: string) {
    return this.inventoryService.getComparisonDetails(
      req.user.companyId,
      productId,
    );
  }

  /**
   * GET /fiscal/inventory/report/tax?clientId=
   *
   * 📑 Sprint 13: Relatório de Inventário Fiscal com Tributos
   * (layout H010 estendido — 17 colunas).
   *
   * 🎯 Regra: produtos que ESTÃO nas notas E com saldo ≠ 0.
   */
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

  /**
   * GET /fiscal/inventory/movements/:productId
   *
   * Histórico completo de movimentações (kardex) de um produto.
   * Essencial para auditoria fiscal e Bloco H do SPED.
   *
   * 🛡️ O service valida se o produto pertence ao companyId do usuário.
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
   * Registra ajuste manual de inventário (sobra ou quebra).
   *
   * 🛡️ Regras: ajuste negativo não zera estoque; justificativa
   * obrigatória; custo médio inalterado; userId para auditoria.
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
      // Erros de negócio viram 400 (não 500)
      throw new BadRequestException(e.message || 'Erro ao criar ajuste.');
    }
  }

  /**
   * POST /fiscal/inventory/wipe
   *
   * ☢️ Sprint 9: exclui TODO o estoque do escopo selecionado.
   * Body: { clientId?: string | null }
   *
   * ⚠️ Operação destrutiva — frontend exige digitar "EXCLUIR".
   */
  @Post('wipe')
  wipe(@Request() req, @Body() body: any) {
    return this.inventoryService.wipe(req.user.companyId, body?.clientId ?? null);
  }

  /**
   * POST /fiscal/inventory/initial-import
   *
   * 🆕 Sprint 10: importa saldo inicial de estoque (abertura).
   *
   * Body: { clientId?, referenceDate?, items: [{ code, description,
   *         ncm?, unit?, quantity, averageCost }] }
   *
   * 🛡️ O frontend envia apenas linhas REVISADAS pelo usuário.
   */
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
   * POST /fiscal/inventory/import-catalog
   *
   * 🆕 Sprint F8: importa catálogo permanente do cliente (descrição + código).
   * Produtos existentes recebem unifiedCode; novos são criados com estoque 0.
   *
   * Body: { clientId?: string | null, items: [{ description, code }] }
   *
   * 🛡️ Anti-colisão + transação atômica + detecção de conflitos no service.
   */
  @Post('import-catalog')
  importCatalog(@Request() req, @Body() body: any) {
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('items deve ser um array não-vazio.');
    }
    return this.inventoryService.importCatalog(
      req.user.companyId,
      body.clientId ?? null,
      body.items,
    );
  }
  /**
   * POST /fiscal/inventory/unify-codes
   *
   * 🆕 Sprint 14: aplica códigos unificados da planilha
   * (revisados no frontend). Body: { items: [{ productId, newCode }] }
   *
   * 🛡️ Anti-colisão + transação atômica no service.
   */
  @Post('unify-codes')
  unifyCodes(@Request() req, @Body() body: any) {
    if (!body.items || !Array.isArray(body.items)) {
      throw new BadRequestException('items deve ser um array.');
    }
    return this.inventoryService.unifyCodes(req.user.companyId, body.items);
  }

  /**
   * PUT /fiscal/inventory/products/:id
   *
   * 🆕 Sprint 16: edição manual completa do produto.
   *
   * Body: {
   *   code?        → editável; vazio = "sem código" (nullable)
   *   description? → obrigatória no frontend
   *   ncm? / unit? → edição direta
   *   quantity?    → gera movimento de AJUSTE (auditoria)
   *   averageCost? → reavaliação de custo
   * }
   *
   * 🛡️ Anti-colisão de código + saldo nunca negativo (service).
   */
  @Put('products/:id')
  updateProduct(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.inventoryService.updateProduct(
      req.user.companyId,
      req.user.id, // Auditoria: quem editou
      id,
      body,
    );
  }

  /**
   * DELETE /fiscal/inventory/products/:id
   *
   * 🆕 Sprint 16: exclusão do produto (SOFT DELETE).
   * O produto some do catálogo/relatórios; notas e kardex
   * permanecem para auditoria fiscal.
   */
  @Delete('products/:id')
  deleteProduct(@Request() req, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(req.user.companyId, id);
  }
}