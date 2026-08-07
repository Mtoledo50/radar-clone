import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, MovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 📦 InventoryService — Estoque Fiscal e Kardex
 * =================================================================
 * Responsabilidades:
 * - Saldo atual por produto (FiscalProduct.currentStock / averageCost)
 * - Kardex completo (histórico de movimentações de um produto)
 * - KPIs agregados do estoque (valor total, NCMs distintos, top itens)
 * - Ajuste manual de inventário (sobra/quebra) com justificativa
 *
 * 🛡️ Multi-tenant: todas as queries filtradas por companyId
 * ✅ Erros de negócio lançam exceções NestJS tipadas (404/400),
 *    nunca Error genérico (que vira 500)
 * =================================================================
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------
  // 📋 SALDO DE ESTOQUE POR PRODUTO (catálogo atual)
  // ---------------------------------------------------------------
  async getBalance(
    companyId: string,
    filters: {
      search?: string;
      ncm?: string;
      onlyPositive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { search = '', ncm, onlyPositive = false, page = 1, limit = 50 } = filters;
    const digits = (ncm || '').replace(/\D/g, '');

    const where: Prisma.FiscalProductWhereInput = {
      companyId,
      deletedAt: null,
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
        include: {
          _count: { select: { movements: true } },
        },
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

  // ---------------------------------------------------------------
  // 📜 KARDEX — Histórico de movimentações de um produto
  // ---------------------------------------------------------------
  async getMovements(
    companyId: string,
    productId: string,
    filters: { startDate?: string; endDate?: string; limit?: number } = {},
  ) {
    // Valida posse do produto (multi-tenant) — 404 tipado, não 500
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence a esta empresa.',
      );
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

  // ---------------------------------------------------------------
  // 📊 KPIs AGREGADOS DO ESTOQUE
  // ---------------------------------------------------------------
  async getMetrics(companyId: string) {
    const products = await this.prisma.fiscalProduct.findMany({
      where: { companyId, deletedAt: null },
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

    const topProducts = await this.prisma.fiscalProduct.findMany({
      where: { companyId, deletedAt: null, currentStock: { gt: 0 } },
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

  // ---------------------------------------------------------------
  // ✏️ AJUSTE MANUAL DE INVENTÁRIO
  // ---------------------------------------------------------------
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
    // Validações de negócio — 400 tipado
    if (!data.quantity || data.quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero.');
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new BadRequestException(
        'Justificativa deve ter pelo menos 5 caracteres.',
      );
    }

    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id: data.productId, companyId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence a esta empresa.',
      );
    }

    // Calcula novo estoque (ajuste não altera custo médio)
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
}