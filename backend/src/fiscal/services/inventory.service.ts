import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 📦 InventoryService — Estoque Fiscal, Kardex e Relatórios
 * =================================================================
 * Responsável pela gestão completa do estoque fiscal do sistema:
 * - Saldo atual por produto (currentStock + averageCost)
 * - Kardex (histórico de movimentações)
 * - Ajustes manuais de inventário (sobra/quebra)
 * - Importação de saldo inicial (Sprint 10)
 * - Relatórios fiscais: Comparativo (Sprint 11), H010 (Sprint 13)
 * - Unificação de códigos via planilha (Sprint 14)
 * - Operações destrutivas: wipe e cleanup (Sprint 9)
 *
 * 🛡️ Todas as operações validam companyId (multi-tenant)
 * 📐 Custo médio ponderado móvel recalculado a cada movimentação
 * =================================================================
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 🔧 HELPER PRIVADO
  // =================================================================

  /**
   * Arredonda para 2 casas decimais com segurança.
   * Evita erros de ponto flutuante em cálculos financeiros.
   */
  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  // =================================================================
  // 📊 KPIs DO ESTOQUE (Dashboard)
  // =================================================================

  /**
   * GET /fiscal/inventory/metrics
   *
   * KPIs agregados do estoque para os cards do dashboard.
   * Suporta filtro por cliente (Sprint 8).
   *
   * @returns { totalProducts, productsWithStock, totalQuantity,
   *            totalValue, distinctNcms, distinctSuppliers, topProducts[] }
   */
  async getMetrics(companyId: string, clientId?: string | null) {
    const products = await this.prisma.fiscalProduct.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(clientId ? { clientId } : {}),
      },
      include: {
        movements: {
          where: { type: 'ENTRADA' },
          include: { invoice: { include: { supplier: true } } },
        },
      },
    });

    let totalProducts = 0;
    let productsWithStock = 0;
    let totalQuantity = 0;
    let totalValue = 0;
    const ncmSet = new Set<string>();
    const supplierSet = new Set<string>();

    for (const p of products) {
      totalProducts++;
      const stock = Number(p.currentStock);
      const cost = Number(p.averageCost);
      if (stock > 0) {
        productsWithStock++;
        totalQuantity += stock;
        totalValue += stock * cost;
      }
      if (p.ncm) ncmSet.add(p.ncm);
      for (const m of p.movements) {
        if (m.invoice?.supplier?.id) {
          supplierSet.add(m.invoice.supplier.id);
        }
      }
    }

    // Top 5 produtos por valor total em estoque
    const topProducts = products
      .map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
        quantity: Number(p.currentStock),
        unitCost: Number(p.averageCost),
        totalValue: this.round2(Number(p.currentStock) * Number(p.averageCost)),
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return {
      totalProducts,
      productsWithStock,
      totalQuantity: this.round2(totalQuantity),
      totalValue: this.round2(totalValue),
      distinctNcms: ncmSet.size,
      distinctSuppliers: supplierSet.size,
      topProducts,
    };
  }

  // =================================================================
  // 📋 SALDO POR PRODUTO (Grid paginado)
  // =================================================================

  /**
   * GET /fiscal/inventory/balance
   *
   * Lista o saldo atual de cada produto com paginação, busca e filtros.
   */
  /**
   * GET /fiscal/inventory/balance
   *
   * Lista o saldo atual de cada produto com paginação, busca e filtros.
   *
   * 🆕 Sprint 17: procedência por produto —
   *   - codNf      → código do produto NA NF-e (supplierCode do item)
   *   - origin     → INICIAL | NFE | AMBOS | OUTRO
   *   - nfNumber/nfSeries/nfEmissionDate → última nota de entrada
   *   - importedAt → data da importação (createdAt do movimento)
   */
  async getBalance(
    companyId: string,
    opts: {
      search?: string;
      ncm?: string;
      onlyPositive?: boolean;
      page: number;
      limit: number;
      clientId?: string;
    },
  ) {
    const where: any = {
      companyId,
      deletedAt: null,
      ...(opts.clientId ? { clientId: opts.clientId } : {}),
    };

    if (opts.search) {
      where.OR = [
        { description: { contains: opts.search, mode: 'insensitive' } },
        { code: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    if (opts.ncm) {
      where.ncm = { contains: opts.ncm };
    }
    if (opts.onlyPositive) {
      where.currentStock = { gt: 0 };
    }

    const [data, total] = await Promise.all([
      this.prisma.fiscalProduct.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { description: 'asc' },
        include: {
          _count: { select: { movements: true } },
          // 🆕 Sprint 17: movimentações c/ NF-e (mais recente primeiro)
          movements: {
            select: {
              type: true,
              createdAt: true,
              invoice: {
                select: { number: true, series: true, emissionDate: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          // 🆕 Sprint 17: código do fornecedor nos itens de NF-e (COD_NF)
          invoiceItems: { select: { supplierCode: true } },
        },
      }),
      this.prisma.fiscalProduct.count({ where }),
    ]);

    const rows = data.map((p) => {
      // Última ENTRADA e SALDO_INICIAL (movements já ordenado desc)
      const lastEntry = p.movements.find((m) => m.type === 'ENTRADA');
      const initial = p.movements.find((m) => m.type === 'SALDO_INICIAL');
      // Primeiro código de fornecedor encontrado nos itens de NF-e
      const codNf =
        p.invoiceItems.map((i) => i.supplierCode).find((c) => !!c) || '';

      return {
        id: p.id,
        code: p.code ?? '',
        description: p.description,
        ncm: p.ncm,
        unit: p.unit,
        currentStock: Number(p.currentStock),
        averageCost: Number(p.averageCost),
        totalValue: this.round2(
          Number(p.currentStock) * Number(p.averageCost),
        ),
        movementsCount: p._count.movements,
        clientId: p.clientId,
        // 🆕 Sprint 17: procedência completa
        codNf,
        origin:
          initial && lastEntry
            ? 'AMBOS'
            : lastEntry
              ? 'NFE'
              : initial
                ? 'INICIAL'
                : 'OUTRO',
        nfNumber: lastEntry?.invoice?.number ?? null,
        nfSeries: lastEntry?.invoice?.series ?? null,
        nfEmissionDate: lastEntry?.invoice?.emissionDate ?? null,
        importedAt: lastEntry?.createdAt ?? initial?.createdAt ?? null,
      };
    });

    return {
      data: rows,
      meta: {
        total,
        page: opts.page,
        totalPages: Math.ceil(total / opts.limit),
      },
    };
  }

  // =================================================================
  // 📜 KARDEX (histórico de movimentações de um produto)
  // =================================================================

  /**
   * GET /fiscal/inventory/movements/:productId
   *
   * Retorna o histórico completo de movimentações de um produto,
   * ordenado cronologicamente (mais antigo → mais recente).
   * Essencial para auditoria fiscal e Bloco H do SPED.
   */
  async getMovements(
    companyId: string,
    productId: string,
    opts: { startDate?: string; endDate?: string; limit?: number },
  ) {
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const where: any = { productId };
    if (opts.startDate || opts.endDate) {
      where.date = {};
      if (opts.startDate) where.date.gte = new Date(opts.startDate);
      if (opts.endDate) where.date.lte = new Date(opts.endDate);
    }

    const movements = await this.prisma.fiscalInventoryMovement.findMany({
      where,
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      take: opts.limit || 200,
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
        currentStock: Number(product.currentStock),
        averageCost: Number(product.averageCost),
      },
      movements: movements.map((m) => ({
        id: m.id,
        date: m.date,
        type: m.type,
        quantity: Number(m.quantity),
        unitCost: Number(m.unitCost),
        totalCost: Number(m.totalCost),
        averageCostAfter: Number(m.averageCostAfter),
        reason: m.reason,
        invoice: m.invoice,
      })),
    };
  }

  // =================================================================
  // ⚖️ COMPARATIVO: ESTOQUE INICIAL × NF-e (Sprint 11)
  // =================================================================

  /**
   * GET /fiscal/inventory/compare
   *
   * Conciliação entre três fontes de verdade:
   *   1. Saldo inicial (movimentos SALDO_INICIAL - Sprint 10)
   *   2. Entradas via NF-e (movimentos ENTRADA)
   *   3. Saldo atual do catálogo
   *
   * Fórmula: teórico = inicial + entradas + ajustes
   *         divergência = atual − teórico (esperado: 0)
   *
   * Status por produto:
   *   - OK              → tem inicial, sem NF-e, atual = inicial
   *   - MOVIMENTADO_NFE → recebeu entradas via NF-e
   *   - DIVERGENTE      → atual ≠ teórico
   *   - SEM_SALDO       → tudo zerado
   */
  async getComparison(companyId: string, clientId?: string | null) {
    const products = await this.prisma.fiscalProduct.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { description: 'asc' },
      include: {
        movements: {
          select: { type: true, quantity: true, unitCost: true, totalCost: true },
        },
      },
    });

    const rows = products.map((p) => {
      let initialQty = 0;
      let initialCost = 0;
      let entryQty = 0;
      let entryValue = 0;
      let adjustQty = 0;

      for (const m of p.movements) {
        const q = Number(m.quantity);
        if (m.type === 'SALDO_INICIAL') {
          initialQty += q;
          initialCost = Number(m.unitCost);
        } else if (m.type === 'ENTRADA') {
          entryQty += q;
          entryValue += Number(m.totalCost);
        } else {
          adjustQty += q;
        }
      }

      const current = Number(p.currentStock);
      const theoretical = initialQty + entryQty + adjustQty;
      const divergence = this.round2(current - theoretical);

      let status: string;
      if (Math.abs(divergence) > 0.000001) status = 'DIVERGENTE';
      else if (entryQty !== 0) status = 'MOVIMENTADO_NFE';
      else if (initialQty !== 0 || current !== 0) status = 'OK';
      else status = 'SEM_SALDO';

      return {
        id: p.id,
        code: p.code,
        description: p.description,
        ncm: p.ncm,
        unit: p.unit,
        initialQty: this.round2(initialQty),
        initialCost,
        initialTotal: this.round2(initialQty * initialCost),
        entryQty: this.round2(entryQty),
        entryValue: this.round2(entryValue),
        adjustQty: this.round2(adjustQty),
        currentStock: current,
        currentTotal: this.round2(current * Number(p.averageCost)),
        divergence,
        status,
      };
    });

    const summary = {
      total: rows.length,
      ok: rows.filter((r) => r.status === 'OK').length,
      movedByNfe: rows.filter((r) => r.status === 'MOVIMENTADO_NFE').length,
      divergent: rows.filter((r) => r.status === 'DIVERGENTE').length,
      noBalance: rows.filter((r) => r.status === 'SEM_SALDO').length,
    };

      return { summary, rows };
  }

  // =================================================================
  // 🔎 DETALHE DA CONCILIAÇÃO POR PRODUTO (Sprint 15)
  // =================================================================

  /**
   * GET /fiscal/inventory/compare/:productId/details
   *
   * Drill-down da conciliação: mostra as EVIDÊNCIAS de cada origem
   * de saldo do produto, para auditoria completa.
   *
   * 🏷️ Flags de procedência (respondem "de onde veio este código?"):
   *   - origin.initialImport → true se recebeu SALDO_INICIAL (PDF/planilha)
   *   - origin.nfe           → true se possui entradas via NF-e
   *
   * ⚠️ Honestidade de dados: o catálogo é MISTO (inicial + NF-e +
   *    unificação Sprint 14). As flags + evidências dão a
   *    rastreabilidade real de cada produto.
   *
   * @returns { product, origin, initial[], entries[], adjustments[], summary }
   */
  async getComparisonDetails(companyId: string, productId: string) {
    // 1. Valida posse do produto (multi-tenant)
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id: productId, companyId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    // 2. Busca todas as movimentações com a NF-e + fornecedor embutidos
    const movements = await this.prisma.fiscalInventoryMovement.findMany({
      where: { productId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            series: true,
            accessKey: true,
            emissionDate: true,
            supplier: { select: { name: true, cnpj: true } },
          },
        },
      },
    });

    // 3. Separa por origem (evidências da conciliação)
    const initial = movements
      .filter((m) => m.type === 'SALDO_INICIAL')
      .map((m) => ({
        date: m.date,
        quantity: Number(m.quantity),
        unitCost: Number(m.unitCost),
        totalCost: Number(m.totalCost),
        reason: m.reason,
      }));

    const entries = movements
      .filter((m) => m.type === 'ENTRADA')
      .map((m) => ({
        invoiceId: m.invoice?.id,
        invoiceNumber: m.invoice?.number,
        series: m.invoice?.series,
        accessKey: m.invoice?.accessKey,
        emissionDate: m.invoice?.emissionDate,
        supplierName: m.invoice?.supplier?.name,
        supplierCnpj: m.invoice?.supplier?.cnpj,
        quantity: Number(m.quantity),
        unitCost: Number(m.unitCost),
        totalCost: Number(m.totalCost),
      }));

    const adjustments = movements
      .filter((m) =>
        ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCAO'].includes(m.type),
      )
      .map((m) => ({
        date: m.date,
        type: m.type,
        quantity: Number(m.quantity),
        reason: m.reason,
      }));

    // 4. Resumo auditável: a fórmula da conciliação
    const initialQty = initial.reduce((s, i) => s + i.quantity, 0);
    const entryQty = entries.reduce((s, i) => s + i.quantity, 0);
    const adjustQty = adjustments.reduce((s, i) => s + i.quantity, 0);
    const current = Number(product.currentStock);
    const divergence = this.round2(current - (initialQty + entryQty + adjustQty));

    return {
      product: {
        id: product.id,
        code: product.code,
        description: product.description,
        ncm: product.ncm,
        unit: product.unit,
        currentStock: current,
        averageCost: Number(product.averageCost),
      },
      // 🏷️ Procedência do produto (rastreabilidade do código)
      origin: {
        initialImport: initial.length > 0,  // veio do estoque inicial (PDF/planilha)
        nfe: entries.length > 0,            // tem entradas via NF-e
      },
      initial,
      entries,
      adjustments,
      summary: {
        initialQty: this.round2(initialQty),
        entryQty: this.round2(entryQty),
        adjustQty: this.round2(adjustQty),
        currentStock: current,
        divergence,
      },
    };
  }

  // =================================================================
  // 📑 RELATÓRIO H010 ESTENDIDO COM TRIBUTOS (Sprint 13)
  // =================================================================

  /**
   * GET /fiscal/inventory/report/tax
   *
   * Lista produtos com saldo ≠ 0 que foram movimentados por NF-e,
   * incluindo todos os tributos (ICMS, IPI, PIS, COFINS, ICMS-ST).
   *
   * Formato: 17 colunas conforme layout H010 do SPED Fiscal.
   *
   * 🎯 Regra: produto deve ter saldo ≠ 0 E movimentações
   */
  async getInventoryTaxReport(companyId: string, clientId?: string | null) {
    const products = await this.prisma.fiscalProduct.findMany({
      where: {
        companyId,
        deletedAt: null,
        currentStock: { not: 0 },
        ...(clientId ? { clientId } : {}),
        movements: { some: {} },
      },
      include: {
        movements: {
          where: { type: 'ENTRADA' },
          include: {
            invoice: {
              include: {
                items: {
                  where: { productId: { not: null } },
                },
              },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const rows: any[] = [];

    for (const p of products) {
      // Agrega tributos das aquisições (itens de NF-e)
      let icms = 0;
      let icmsBase = 0;
      let st = 0;
      let ipi = 0;
      let pis = 0;
      let cofins = 0;
      let cst = '';
      let reference = '';

      for (const m of p.movements) {
        if (m.invoice?.items) {
          for (const it of m.invoice.items) {
            if (it.productId === p.id) {
              icms += Number(it.icmsValue ?? 0);
              icmsBase += Number(it.icmsBase ?? 0);
              st += Number(it.icmsStValue ?? 0);
              ipi += Number(it.ipiValue ?? 0);
              pis += Number(it.pisValue ?? 0);
              cofins += Number(it.cofinsValue ?? 0);
              cst = it.cst || it.csosn || cst;
              reference = it.supplierCode || reference;
            }
          }
        }
      }

      const quantity = Number(p.currentStock);
      const unitValue = Number(p.averageCost);
      const totalValue = this.round2(quantity * unitValue);

      rows.push({
        code: p.code,
        reference: p.description || reference, // 🆕 Sprint 14: nome do produto
        quantity: this.round2(quantity),
        unitValue,
        totalValue,
        icmsBase: this.round2(icmsBase),
        icms: this.round2(icms),
        st: this.round2(st),
        ipi: this.round2(ipi),
        pis: this.round2(pis),
        cofins: this.round2(cofins),
        cst,
        ncm: p.ncm,
        unit: p.unit,
        ownershipIndicator: '0', // Mercadoria própria (padrão SPED)
        ownerCnpjCpf: '',
        spedAccount: '',
        observations: '',
        irValue: totalValue,
      });
    }

    return { count: rows.length, rows };
  }

  // =================================================================
  // ✏️ AJUSTE MANUAL DE INVENTÁRIO
  // =================================================================

  /**
   * POST /fiscal/inventory/adjust
   *
   * Registra ajuste manual (sobra ou quebra) de inventário.
   *
   * 🛡️ Regras:
   *   - Ajuste negativo não pode deixar estoque negativo
   *   - Justificativa obrigatória (mínimo 5 caracteres)
   *   - Custo médio NÃO é alterado
   *   - userId registrado para auditoria
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
    if (data.quantity <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero.');
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new BadRequestException('Justificativa é obrigatória (mínimo 5 caracteres).');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.fiscalProduct.findFirst({
        where: { id: data.productId, companyId, deletedAt: null },
      });
      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }

      const currentStock = Number(product.currentStock);
      const avgCost = Number(product.averageCost);
      const delta = data.type === 'AJUSTE_POSITIVO' ? data.quantity : -data.quantity;
      const newStock = currentStock + delta;

      if (newStock < 0) {
        throw new BadRequestException(
          `Estoque insuficiente. Saldo atual: ${currentStock}, ajuste: ${delta}.`,
        );
      }

      // Custo médio inalterado em ajustes manuais
      const newAvgCost = avgCost;

      const movement = await tx.fiscalInventoryMovement.create({
        data: {
          companyId,
          productId: product.id,
          clientId: product.clientId,
          type: data.type,
          date: new Date(),
          quantity: delta,
          unitCost: newAvgCost,
          totalCost: this.round2(Math.abs(delta) * newAvgCost),
          averageCostAfter: newAvgCost,
          reason: data.reason,
          userId,
        },
      });

      const updated = await tx.fiscalProduct.update({
        where: { id: product.id },
        data: { currentStock: newStock },
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
  // ☢️ OPERAÇÃO DESTRUTIVA: WIPE (Excluir todo o estoque)
  // =================================================================

  /**
   * POST /fiscal/inventory/wipe
   *
   * Remove TODOS os produtos e movimentações do escopo selecionado.
   * ⚠️ Operação irreversível — frontend exige digitar "EXCLUIR".
   */
  async wipe(companyId: string, clientId?: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const productWhere: any = {
        companyId,
        ...(clientId ? { clientId } : {}),
      };
      const movementWhere: any = {
        companyId,
        ...(clientId ? { clientId } : {}),
      };

      const [products, movements] = await Promise.all([
        tx.fiscalProduct.count({ where: productWhere }),
        tx.fiscalInventoryMovement.count({ where: movementWhere }),
      ]);

      await tx.fiscalInventoryMovement.deleteMany({ where: movementWhere });
      await tx.fiscalProduct.deleteMany({ where: productWhere });

      return { productsDeleted: products, movementsDeleted: movements };
    });
  }

  // =================================================================
  // 📥 IMPORTAÇÃO DE SALDO INICIAL (Sprint 10)
  // =================================================================

  /**
   * POST /fiscal/inventory/initial-import
   *
   * Importa o saldo inicial de estoque (abertura) com regras anti-duplicidade:
   *   - Produto NÃO existe        → cria + movimento SALDO_INICIAL
   *   - Existe SEM movimentações  → atualiza saldo/custo + movimento
   *   - Existe COM movimentações  → PULA (não duplica saldo)
   */
  async importInitialStock(
    companyId: string,
    userId: string,
    clientId: string | null,
    data: {
      referenceDate?: string;
      items: {
        code: string;
        description: string;
        ncm?: string;
        unit?: string;
        quantity: number;
        averageCost: number;
      }[];
    },
  ) {
    const refDate = data.referenceDate
      ? new Date(`${data.referenceDate}T12:00:00`)
      : new Date();

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const item of data.items) {
      if (!item.code || !item.description) {
        skipped++;
        results.push({
          code: item.code || '(sem código)',
          status: 'ERROR',
          error: 'Código ou descrição ausentes.',
        });
        continue;
      }

      try {
        const qty = Number(item.quantity ?? 0);
        const cost = Number(item.averageCost ?? 0);
        const ncm = (item.ncm || '').replace(/\D/g, '') || '00000000';
        const unit = (item.unit || 'UN').toUpperCase();

        const existing = await this.prisma.fiscalProduct.findFirst({
          where: {
            companyId,
            clientId: clientId || null,
            code: item.code,
            deletedAt: null,
          },
        });

        if (existing) {
          const movCount = await this.prisma.fiscalInventoryMovement.count({
            where: { productId: existing.id },
          });

          if (movCount > 0) {
            skipped++;
            results.push({
              code: item.code,
              status: 'SKIPPED',
              error: 'Produto já possui movimentações.',
            });
            continue;
          }

          await this.prisma.$transaction(async (tx) => {
            await tx.fiscalProduct.update({
              where: { id: existing.id },
              data: {
                currentStock: qty,
                averageCost: cost,
                ncm,
                unit,
                description: item.description,
              },
            });
            await tx.fiscalInventoryMovement.create({
              data: {
                companyId,
                clientId: clientId || null,
                productId: existing.id,
                type: 'SALDO_INICIAL',
                date: refDate,
                quantity: qty,
                unitCost: cost,
                totalCost: qty * cost,
                averageCostAfter: cost,
                reason: `Saldo inicial importado (data-base ${refDate.toLocaleDateString('pt-BR')})`,
                userId,
              },
            });
          });
          updated++;
          results.push({ code: item.code, status: 'UPDATED' });
        } else {
          await this.prisma.$transaction(async (tx) => {
            const product = await tx.fiscalProduct.create({
              data: {
                companyId,
                clientId: clientId || null,
                code: item.code,
                description: item.description,
                ncm,
                unit,
                averageCost: cost,
                currentStock: qty,
              },
            });
            await tx.fiscalInventoryMovement.create({
              data: {
                companyId,
                clientId: clientId || null,
                productId: product.id,
                type: 'SALDO_INICIAL',
                date: refDate,
                quantity: qty,
                unitCost: cost,
                totalCost: qty * cost,
                averageCostAfter: cost,
                reason: `Saldo inicial importado (data-base ${refDate.toLocaleDateString('pt-BR')})`,
                userId,
              },
            });
          });
          created++;
          results.push({ code: item.code, status: 'CREATED' });
        }
      } catch (e: any) {
        skipped++;
        results.push({
          code: item.code,
          status: 'ERROR',
          error: e?.message || 'Erro ao processar a linha.',
        });
      }
    }

    return { created, updated, skipped, results };
  }

  // =================================================================
  // 🔀 UNIFICAÇÃO DE CÓDIGOS VIA PLANILHA (Sprint 14 → 19)
  // =================================================================

  /**
   * POST /fiscal/inventory/unify-codes
   *
   * 🆕 Sprint 19: NÃO altera o código do catálogo (code).
   * Grava o "Código Unificado Encontrado" da planilha na coluna
   * dedicada `unifiedCode` (campo informativo, sem constraint unique).
   *
   * 🛡️ Regras:
   *   - Valida posse do produto (companyId + não deletado)
   *   - Idempotente: se unifiedCode já é igual, pula
   *   - Transação atômica: tudo ou nada
   *
   * ⚠️ O histórico das notas NUNCA é reescrito (auditoria preservada).
   */
  async unifyCodes(
    companyId: string,
    items: { productId: string; newCode: string }[],
  ) {
    if (!items || items.length === 0) {
      return { updated: 0, skipped: [] };
    }

    let updated = 0;
    const skipped: any[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const it of items) {
        const newCode = (it.newCode || '').trim();
        if (!newCode) {
          skipped.push({ productId: it.productId, reason: 'Código vazio.' });
          continue;
        }

        const product = await tx.fiscalProduct.findFirst({
          where: { id: it.productId, companyId, deletedAt: null },
        });
        if (!product) {
          skipped.push({ productId: it.productId, reason: 'Produto não encontrado.' });
          continue;
        }

        if (product.unifiedCode === newCode) {
          continue; // já unificado (idempotente)
        }

        await tx.fiscalProduct.update({
          where: { id: product.id },
          data: { unifiedCode: newCode },
        });
        updated++;
      }
    });

    return { updated, skipped };
  }
  // =================================================================
  // ✏️ MANUTENÇÃO MANUAL DE PRODUTO (Sprint 16)
  // =================================================================

  /**
   * PUT /fiscal/inventory/products/:id
   *
   * Edição manual completa do produto:
   *   - code        → editável; vazio = "sem código" (nullable)
   *   - description / ncm / unit → edição direta
   *   - quantity    → edição direta gera movimento de AJUSTE (auditoria)
   *   - averageCost → reavaliação de custo
   *
   * 🛡️ Regras: posse (companyId), anti-colisão de código,
   *    saldo nunca negativo, transação atômica.
   */
  async updateProduct(
    companyId: string,
    userId: string,
    id: string,
    data: {
      code?: string | null;
      description?: string;
      ncm?: string;
      unit?: string;
      quantity?: number;
      averageCost?: number;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.fiscalProduct.findFirst({
        where: { id, companyId, deletedAt: null },
      });
      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }

      // Normaliza código: vazio → null ("sem código")
      const newCode =
        data.code === undefined
          ? undefined
          : (data.code || '').trim() === ''
            ? null
            : (data.code || '').trim();

      // 🛡️ ANTI-COLISÃO: código já em uso por outro produto?
      if (newCode && newCode !== product.code) {
        const clash = await tx.fiscalProduct.findFirst({
          where: {
            companyId,
            clientId: product.clientId,
            code: newCode,
            deletedAt: null,
            id: { not: id },
          },
        });
        if (clash) {
          throw new ConflictException(
            `Código "${newCode}" já em uso por outro produto.`,
          );
        }
      }

      const update: any = {};
      if (newCode !== undefined) update.code = newCode;
      if (data.description !== undefined) update.description = data.description;
      if (data.ncm !== undefined) update.ncm = data.ncm;
      if (data.unit !== undefined) update.unit = data.unit;
      if (data.averageCost !== undefined) update.averageCost = Number(data.averageCost);

      // 📐 Edição de saldo → movimento de AJUSTE (trilha de auditoria)
      if (data.quantity !== undefined) {
        const current = Number(product.currentStock);
        const target = Number(data.quantity);
        if (target < 0) {
          throw new BadRequestException('O saldo não pode ser negativo.');
        }
        const delta = target - current;
        if (delta !== 0) {
          const cost = Number(product.averageCost);
          await tx.fiscalInventoryMovement.create({
            data: {
              companyId,
              clientId: product.clientId,
              productId: id,
              type: delta > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
              date: new Date(),
              quantity: delta,
              unitCost: cost,
              totalCost: this.round2(Math.abs(delta) * cost),
              averageCostAfter: cost,
              reason: 'Edição manual de produto (Sprint 16)',
              userId,
            },
          });
          update.currentStock = target;
        }
      }

      return tx.fiscalProduct.update({ where: { id }, data: update });
    });
  }

  /**
   * DELETE /fiscal/inventory/products/:id
   *
   * 🗑️ Exclusão do produto (SOFT DELETE — preserva histórico fiscal).
   * O produto some do catálogo/relatórios; notas e kardex permanecem.
   */
  async deleteProduct(companyId: string, id: string) {
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }
    return this.prisma.fiscalProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}