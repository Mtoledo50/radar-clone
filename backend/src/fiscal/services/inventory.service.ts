import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, MovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 📦 InventoryService — Estoque Fiscal e Kardex
 * =================================================================
 * Gerencia o saldo atual de estoque, histórico de movimentações (kardex)
 * e ajustes manuais de inventário.
 *
 * 🆕 Sprint 8: Suporte completo a `clientId`:
 *   - getBalance filtra produtos por cliente
 *   - getMetrics calcula KPIs por cliente
 *   - createAdjustment herda o clientId do produto
 *
 * 🛡️ Segurança:
 *   - Todas as queries filtram por companyId (multi-tenant)
 *   - Validação de posse do produto antes de operações
 *   - Ajustes não podem deixar estoque negativo
 * =================================================================
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista o saldo atual de cada produto (grid principal da tela de estoque).
   *
   * @param filters.search - Busca por descrição ou código
   * @param filters.ncm - Filtro por NCM (aceita parcial, ex: "7318")
   * @param filters.onlyPositive - true para mostrar apenas produtos com saldo > 0
   * @param filters.clientId - 🆕 Sprint 8: filtra produtos por cliente
   */
  async getBalance(
    companyId: string,
    filters: {
      search?: string;
      ncm?: string;
      onlyPositive?: boolean;
      page?: number;
      limit?: number;
      clientId?: string; // 🆕 Sprint 8
    } = {},
  ) {
    const { search = '', ncm, onlyPositive = false, page = 1, limit = 50, clientId } = filters;
    const digits = (ncm || '').replace(/\D/g, '');

    const where: Prisma.FiscalProductWhereInput = {
      companyId,
      deletedAt: null,
      ...(clientId && { clientId }), // 🆕 Sprint 8
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(digits && { ncm: { startsWith: digits } }),
      ...(onlyPositive && { currentStock: { gt: 0 } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.fiscalProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { description: 'asc' },
        include: { _count: { select: { movements: true } } },
      }),
      this.prisma.fiscalProduct.count({ where }),
    ]);

    return {
      data: products.map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
        ncm: p.ncm,
        unit: p.unit,
        currentStock: Number(p.currentStock ?? 0),
        averageCost: Number(p.averageCost ?? 0),
        totalValue: Number(p.currentStock ?? 0) * Number(p.averageCost ?? 0),
        movementsCount: p._count.movements,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Histórico completo de movimentações (kardex) de um produto específico.
   * Essencial para auditoria fiscal e Bloco H do SPED.
   *
   * @throws NotFoundException se o produto não existir ou não pertencer ao companyId
   */
  async getMovements(
    companyId: string,
    productId: string,
    filters: { startDate?: string; endDate?: string; limit?: number } = {},
  ) {
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado ou não pertence a esta empresa.');
    }

    const where: Prisma.FiscalInventoryMovementWhereInput = {
      companyId,
      productId,
    };
    if (filters.startDate || filters.endDate) {
      where.date = {
        ...(filters.startDate && { gte: new Date(`${filters.startDate}T00:00:00`) }),
        ...(filters.endDate && { lte: new Date(`${filters.endDate}T23:59:59`) }),
      };
    }

    const movements = await this.prisma.fiscalInventoryMovement.findMany({
      where,
      orderBy: { date: 'desc' },
      take: filters.limit || 200,
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            series: true,
            supplier: { select: { name: true, cnpj: true } },
          },
        },
      },
    });

    return {
      product: {
        id: product.id,
        code: product.code,
        description: product.description,
        ncm: product.ncm,
        unit: product.unit,
        currentStock: Number(product.currentStock ?? 0),
        averageCost: Number(product.averageCost ?? 0),
      },
      movements: movements.map((m) => ({
        id: m.id,
        date: m.date,
        type: m.type as MovementType,
        quantity: Number(m.quantity),
        unitCost: Number(m.unitCost),
        totalCost: Number(m.totalCost),
        averageCostAfter: Number(m.averageCostAfter),
        reason: m.reason,
        invoice: m.invoice
          ? {
              id: m.invoice.id,
              number: m.invoice.number,
              series: m.invoice.series,
              supplier: m.invoice.supplier,
            }
          : null,
      })),
    };
  }

  /**
   * KPIs agregados do estoque para os cards do dashboard.
   *
   * @param clientId - 🆕 Sprint 8: filtra métricas por cliente específico
   */
  async getMetrics(companyId: string, clientId?: string) { // 🆕 Sprint 8
    const where: Prisma.FiscalProductWhereInput = {
      companyId,
      deletedAt: null,
      ...(clientId && { clientId }), // 🆕 Sprint 8
    };

    const products = await this.prisma.fiscalProduct.findMany({
      where,
      select: { currentStock: true, averageCost: true, ncm: true },
    });

    let totalValue = 0;
    let totalQuantity = 0;
    let productsWithStock = 0;
    const ncmSet = new Set<string>();

    for (const p of products) {
      const qty = Number(p.currentStock ?? 0);
      const avg = Number(p.averageCost ?? 0);
      totalValue += qty * avg;
      totalQuantity += qty;
      if (qty > 0) productsWithStock++;
      if (p.ncm) ncmSet.add(p.ncm);
    }

    const topWhere: Prisma.FiscalProductWhereInput = {
      companyId,
      deletedAt: null,
      currentStock: { gt: 0 },
      ...(clientId && { clientId }), // 🆕 Sprint 8
    };

    const topProducts = await this.prisma.fiscalProduct.findMany({
      where: topWhere,
      take: 10,
      orderBy: { currentStock: 'desc' },
      select: {
        id: true,
        code: true,
        description: true,
        currentStock: true,
        averageCost: true,
      },
    });

    const suppliersCount = await this.prisma.fiscalSupplier.count({
      where: { companyId, deletedAt: null },
    });

    return {
      totalProducts: products.length,
      productsWithStock,
      totalQuantity,
      totalValue,
      distinctNcms: ncmSet.size,
      distinctSuppliers: suppliersCount,
      topProducts: topProducts.map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
        quantity: Number(p.currentStock),
        unitCost: Number(p.averageCost),
        totalValue: Number(p.currentStock) * Number(p.averageCost),
      })),
    };
  }

  /**
   * Registra um ajuste manual de inventário (sobra ou quebra).
   *
   * 🛡️ Regras de Negócio:
   * - Ajuste negativo não pode deixar o estoque negativo
   * - Justificativa é obrigatória (auditoria fiscal)
   * - Custo médio NÃO é alterado (só quantidade)
   * - userId é registrado para rastreabilidade
   *
   * 💡 O clientId é herdado do produto (não pode ser alterado via ajuste).
   */
  async createAdjustment(
    companyId: string,
    userId: string,
    data: {
      productId: string;
      type: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
      quantity: number;
      reason: string;
    },
  ) {
    if (!data.quantity || data.quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero.');
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new BadRequestException('Justificativa deve ter pelo menos 5 caracteres.');
    }

    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id: data.productId, companyId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const currentStock = Number(product.currentStock);
    const currentAvg = Number(product.averageCost);
    const delta = data.type === 'AJUSTE_POSITIVO' ? data.quantity : -data.quantity;
    const newStock = currentStock + delta;

    if (newStock < 0) {
      throw new BadRequestException(
        `Estoque insuficiente. Saldo atual: ${currentStock} ${product.unit}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.fiscalProduct.update({
        where: { id: data.productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.fiscalInventoryMovement.create({
        data: {
          companyId,
          clientId: product.clientId, // 🆕 Sprint 8: herda do produto
          productId: data.productId,
          type: data.type,
          date: new Date(),
          quantity: delta,
          unitCost: currentAvg,
          totalCost: Math.abs(delta) * currentAvg,
          averageCostAfter: currentAvg,
          reason: data.reason,
          userId,
        },
      });

            return {
        movement: {
          id: movement.id,
          type: movement.type,
          quantity: delta,
          reason: movement.reason,
        },
        product: {
          currentStock: Number(updated.currentStock),
          averageCost: Number(updated.averageCost),
        },
      };
    });
  }

  // =================================================================
  // ☢️ EXCLUSÃO TOTAL DO ESTOQUE (Sprint 9 — operação destrutiva)
  // =================================================================

  /**
   * Remove TODOS os produtos e movimentações do escopo selecionado.
   *
   * 🛡️ Semântica de escopo:
   *   - clientId informado → apaga apenas o estoque daquele cliente
   *   - clientId null      → apaga TODO o estoque da empresa (nuclear)
   *
   * ⚠️ Efeitos colaterais documentados:
   *   - Movimentações (kardex) são removidas
   *   - Itens de notas fiscais ficam com productId = null (SetNull),
   *     ou seja, as notas são mantidas mas perdem o vínculo de catálogo
   *   - Saldos mensais (balances) são removidos em cascata
   *
   * 🔒 Uso previsto: reset do catálogo para reimportação limpa.
   * A confirmação forte (digitar EXCLUIR) é feita no frontend.
   *
   * @returns { productsDeleted, movementsDeleted }
   */
  async wipe(companyId: string, clientId?: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const productWhere: Prisma.FiscalProductWhereInput = {
        companyId,
        ...(clientId ? { clientId } : {}), // null = todos os escopos
      };
      const movementWhere: Prisma.FiscalInventoryMovementWhereInput = {
        companyId,
        ...(clientId ? { clientId } : {}),
      };

      // Contagem prévia para o feedback ao usuário
      const [products, movements] = await Promise.all([
        tx.fiscalProduct.count({ where: productWhere }),
        tx.fiscalInventoryMovement.count({ where: movementWhere }),
      ]);

      // 1. Remove movimentações explicitamente
      await tx.fiscalInventoryMovement.deleteMany({ where: movementWhere });

      // 2. Remove produtos (balances em cascata; invoiceItems → SetNull)
      await tx.fiscalProduct.deleteMany({ where: productWhere });

      return { productsDeleted: products, movementsDeleted: movements };
    });
  }
}