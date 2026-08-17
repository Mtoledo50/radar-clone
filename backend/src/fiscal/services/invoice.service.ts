import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { XmlParserService, ParsedInvoice } from './xml-parser.service';

/**
 * =================================================================
 * 📄 InvoiceService — Processamento de NF-e de Entrada
 * =================================================================
 * 🆕 Sprint 8: clientId • 🆕 Sprint 9: lote resiliente + estorno replay
 * 🆕 Sprint F4: Base ICMS persistida (parser + schema)
 * 🆕 Sprint F5: coluna "Produtos" + ordenação + busca por produto
 *
 * 🧠 ADR-025 (Sprint F5 hotfix): ordenação "Produto (A–Z)" feita na
 * camada de aplicação (localeCompare pt-BR), sem agregação de relação
 * do Prisma — compatível com qualquer versão do Prisma/Postgres e com
 * colação independente de acentos/caixa.
 * =================================================================
 */
@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlParser: XmlParserService,
  ) {}

  // =================================================================
  // 📤 UPLOAD E PROCESSAMENTO EM LOTE (RESILIENTE — Sprint 9)
  // =================================================================
  async processUpload(
    companyId: string,
    userId: string,
    clientId: string | undefined,
    files: Express.Multer.File[],
  ) {
    const results: any[] = [];
    let processed = 0;
    let duplicates = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const parsed = this.xmlParser.parse(file.buffer.toString('utf-8'));
        const invoice = await this.persistInvoice(companyId, userId, clientId, parsed);
        processed++;
        results.push({
          fileName: file.originalname,
          status: 'PROCESSED',
          accessKey: parsed.accessKey,
          invoiceId: invoice.id,
          items: parsed.items.length,
          totalValue: parsed.totalValue,
        });
      } catch (e: any) {
        if (e instanceof ConflictException) {
          duplicates++;
          results.push({
            fileName: file.originalname,
            status: 'DUPLICATE',
            error: 'NF-e já foi importada (chave de acesso duplicada). Ignorada.',
          });
        } else {
          errors++;
          results.push({
            fileName: file.originalname,
            status: 'ERROR',
            error: e?.message || 'Erro desconhecido no parser.',
          });
        }
      }
    }

    return { total: files.length, processed, duplicates, errors, results };
  }

  // =================================================================
  // 💾 PERSISTÊNCIA ATÔMICA DA NF-e
  // =================================================================
  private async persistInvoice(
    companyId: string,
    userId: string,
    clientId: string | undefined,
    parsed: ParsedInvoice,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Duplicidade: mesma chave não entra duas vezes
      const existing = await tx.fiscalInvoice.findFirst({
        where: { companyId, accessKey: parsed.accessKey },
      });
      if (existing) {
        throw new ConflictException(
          `NF-e ${parsed.number} já foi importada (chave ${parsed.accessKey}).`,
        );
      }

      // 2. Fornecedor: cria ou vincula por CNPJ
      const supplier = await tx.fiscalSupplier.upsert({
        where: { companyId_cnpj: { companyId, cnpj: parsed.supplier.cnpj } },
        update: {},
        create: {
          companyId,
          cnpj: parsed.supplier.cnpj,
          name: parsed.supplier.name,
          tradeName: parsed.supplier.tradeName,
          stateRegistration: parsed.supplier.stateRegistration,
          state: parsed.supplier.state,
        },
      });

      // 3. Itens: casa com catálogo ou cria produto novo
      const itemRows: any[] = [];
      const movements: any[] = [];

      for (const item of parsed.items) {
        let product = item.supplierCode
          ? await tx.fiscalProduct.findFirst({
              where: {
                companyId,
                clientId: clientId || null,
                deletedAt: null,
                code: item.supplierCode,
              },
            })
          : null;

        if (!product && item.ean) {
          product = await tx.fiscalProduct.findFirst({
            where: {
              companyId,
              clientId: clientId || null,
              deletedAt: null,
              ean: item.ean,
            },
          });
        }

        const matched = !!product;

        if (!product) {
          product = await tx.fiscalProduct.create({
            data: {
              companyId,
              clientId: clientId || null,
              code:
                item.supplierCode ||
                `AUTO-${parsed.accessKey.slice(-6)}-${item.itemNumber}`,
              ean: item.ean,
              description: item.description,
              ncm: item.ncm,
              unit: item.unit,
              averageCost: item.unitValue,
              currentStock: 0,
            },
          });
        }

        // 4. Custo médio ponderado móvel (exigência fiscal)
        const currentStock = Number(product.currentStock);
        const currentAvg = Number(product.averageCost);
        const newStock = currentStock + item.quantity;
        const newAvg =
          newStock > 0
            ? (currentStock * currentAvg + item.quantity * item.unitValue) /
              newStock
            : item.unitValue;

        await tx.fiscalProduct.update({
          where: { id: product.id },
          data: { currentStock: newStock, averageCost: newAvg },
        });

        itemRows.push({
          itemNumber: item.itemNumber,
          productId: product.id,
          productMatchStatus: matched ? 'IDENTIFIED' : 'NEW',
          supplierCode: item.supplierCode,
          description: item.description,
          ncm: item.ncm,
          cfop: item.cfop,
          cst: item.cst,
          csosn: item.csosn,
          quantity: item.quantity,
          unitValue: item.unitValue,
          totalValue: item.totalValue,
          discount: item.discount,
          icmsBase: item.icmsBase,
          icmsRate: item.icmsRate,
          icmsValue: item.icmsValue,
          icmsStBase: item.icmsStBase,
          icmsStValue: item.icmsStValue,
          ipiValue: item.ipiValue,
          pisValue: item.pisValue,
          cofinsValue: item.cofinsValue,
        });

        movements.push({
          companyId,
          clientId: clientId || null,
          productId: product.id,
          type: 'ENTRADA',
          date: parsed.emissionDate,
          quantity: item.quantity,
          unitCost: item.unitValue,
          totalCost: item.quantity * item.unitValue,
          averageCostAfter: newAvg,
          reason: `Entrada NF-e ${parsed.number}`,
          userId,
        });
      }

      // 5. Nota + itens
      const invoice = await tx.fiscalInvoice.create({
        data: {
          companyId,
          clientId: clientId || null,
          supplierId: supplier.id,
          status: 'PARSED',
          number: parsed.number,
          series: parsed.series,
          accessKey: parsed.accessKey,
          emissionDate: parsed.emissionDate,
          entryDate: new Date(),
          cfop: parsed.cfop,
          natOp: parsed.natOp,
          totalValue: parsed.totalValue,
          discountValue: parsed.discountValue,
          freightValue: parsed.freightValue,
          insuranceValue: parsed.insuranceValue,
          otherValues: parsed.otherValues,
          icmsBase: parsed.icmsBase,
          icmsValue: parsed.icmsValue,
          icmsStValue: parsed.icmsStValue,
          ipiValue: parsed.ipiValue,
          pisValue: parsed.pisValue,
          cofinsValue: parsed.cofinsValue,
          items: { create: itemRows },
        },
      });

      // 6. Kardex de entradas
      await tx.fiscalInventoryMovement.createMany({
        data: movements.map((m) => ({ ...m, invoiceId: invoice.id })),
      });

      return invoice;
    });
  }

  // =================================================================
  // 📋 LISTAGEM PAGINADA (Sprint F5 + hotfix ADR-025)
  // =================================================================

  /**
   * Lista notas com fornecedor, contagem e descrições dos PRODUTOS
   * (já em A–Z) para a coluna "Produtos".
   *
   * sortBy:
   *  - 'emission' (padrão): mais recentes primeiro (SQL direto).
   *  - 'product': 🧠 ADR-025 — ordenação na aplicação:
   *      1) query LEVE (id + itens ordenados) respeitando os filtros;
   *      2) rankeia pelo 1º produto com localeCompare('pt-BR');
   *      3) fatia a página e busca as linhas completas só da fatia;
   *      4) notas sem itens vão para o FINAL.
   *    ⚡ Escala: ótimo p/ centenas/milhares de notas; se um dia tiver
   *    100k+, evoluir para coluna desnormalizada `firstProductName`.
   */
  async findAll(
    companyId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      clientId?: string;
      sortBy?: 'emission' | 'product';
    } = {},
  ) {
    const { page = 1, limit = 50, search = '', clientId, sortBy = 'emission' } = filters;

    const where: any = {
      companyId,
      ...(clientId && { clientId }),
      ...(search && {
        OR: [
          { number: { contains: search } },
          { accessKey: { contains: search } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
          // 🆕 Sprint F5: busca também pelo nome do produto
          { items: { some: { description: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    // Include compartilhado pelas duas rotas de ordenação
    const listInclude = {
      supplier: { select: { id: true, name: true, cnpj: true } },
      _count: { select: { items: true } },
      // 🆕 Sprint F5: descrições já ordenadas A–Z (coluna + tooltip)
      items: {
        select: { description: true },
        orderBy: { description: 'asc' as const },
      },
    };

    // Converte Decimal → Number (JSON limpo p/ frontend)
    const toRow = (i: any) => ({
      ...i,
      totalValue: Number(i.totalValue),
      icmsValue: Number(i.icmsValue),
    });

    // ---------------------------------------------------------------
    // ROTA 1 (padrão): mais recentes primeiro — SQL direto
    // ---------------------------------------------------------------
    if (sortBy !== 'product') {
      const [invoices, total] = await Promise.all([
        this.prisma.fiscalInvoice.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { emissionDate: 'desc' },
          include: listInclude,
        }),
        this.prisma.fiscalInvoice.count({ where }),
      ]);

      return {
        data: invoices.map(toRow),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    // ---------------------------------------------------------------
    // ROTA 2: Produto (A–Z) — 🧠 ADR-025 (ordenação na aplicação)
    // ---------------------------------------------------------------

    // 1) Query LEVE: só id + itens (descrições já A–Z), respeitando filtros
    const light = await this.prisma.fiscalInvoice.findMany({
      where,
      select: {
        id: true,
        items: {
          select: { description: true },
          orderBy: { description: 'asc' as const },
        },
      },
    });

    // 2) Rankeia pelo 1º produto (A–Z, sem sensibilidade a caixa/acento)
    const ranked = light
      .map((i) => ({ id: i.id, first: i.items[0]?.description ?? null }))
      .sort((a, b) => {
        if (a.first === null && b.first === null) return 0;
        if (a.first === null) return 1; // sem itens → final da lista
        if (b.first === null) return -1;
        return a.first.localeCompare(b.first, 'pt-BR', { sensitivity: 'base' });
      });

    // 3) Paginação SOBRE o ranking + busca só as linhas da página
    const total = ranked.length;
    const pageIds = ranked
      .slice((page - 1) * limit, page * limit)
      .map((r) => r.id);

    const invoices = await this.prisma.fiscalInvoice.findMany({
      where: { id: { in: pageIds } },
      include: listInclude,
    });

    // 4) Preserva a ordem do ranking (IN não garante ordem)
    const pos = new Map(pageIds.map((id, idx) => [id, idx]));
    invoices.sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));

    return {
      data: invoices.map(toRow),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // =================================================================
  // 🔍 DETALHE DA NOTA
  // =================================================================
  async findOne(id: string, companyId: string) {
    const invoice = await this.prisma.fiscalInvoice.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Nota fiscal não encontrada.');
    }

    return invoice;
  }

  // =================================================================
  // 📊 KPIs DO PERÍODO
  // =================================================================
  async getMetrics(
    companyId: string,
    filters: { startDate?: string; endDate?: string; clientId?: string } = {},
  ) {
    const { startDate, endDate, clientId } = filters;

    const where: Prisma.FiscalInvoiceWhereInput = { companyId };
    if (startDate || endDate) {
      where.emissionDate = {
        ...(startDate && { gte: new Date(`${startDate}T00:00:00`) }),
        ...(endDate && { lte: new Date(`${endDate}T23:59:59`) }),
      };
    }
    if (clientId) {
      where.clientId = clientId;
    }

    const movementWhere: Prisma.FiscalInventoryMovementWhereInput = {
      companyId,
      type: 'ENTRADA',
    };
    if (startDate || endDate) {
      movementWhere.date = {
        ...(startDate && { gte: new Date(`${startDate}T00:00:00`) }),
        ...(endDate && { lte: new Date(`${endDate}T23:59:59`) }),
      };
    }
    if (clientId) {
      movementWhere.clientId = clientId;
    }

    const [invoiceAgg, suppliers, movementAgg] = await Promise.all([
      this.prisma.fiscalInvoice.aggregate({
        where,
        _count: { id: true },
        _sum: {
          totalValue: true,
          icmsValue: true,
          icmsStValue: true,
          ipiValue: true,
          pisValue: true,
          cofinsValue: true,
        },
      }),
      this.prisma.fiscalInvoice.findMany({
        where,
        distinct: ['supplierId'],
        select: { supplierId: true },
      }),
      this.prisma.fiscalInventoryMovement.aggregate({
        where: movementWhere,
        _sum: { quantity: true, totalCost: true },
      }),
    ]);

    const sum = invoiceAgg._sum;
    return {
      totalInvoices: invoiceAgg._count.id,
      totalValue: Number(sum.totalValue ?? 0),
      totalIcms: Number(sum.icmsValue ?? 0),
      totalIcmsSt: Number(sum.icmsStValue ?? 0),
      totalIpi: Number(sum.ipiValue ?? 0),
      totalPis: Number(sum.pisValue ?? 0),
      totalCofins: Number(sum.cofinsValue ?? 0),
      distinctSuppliers: suppliers.length,
      totalItemsQuantity: Number(movementAgg._sum.quantity ?? 0),
      totalItemsCost: Number(movementAgg._sum.totalCost ?? 0),
    };
  }

  // =================================================================
  // 🔗 VINCULAR NOTAS ANTIGAS A UM CLIENTE (Sprint 9)
  // =================================================================
  async assignClient(
    companyId: string,
    data: { invoiceIds: string[]; clientId: string | null },
  ) {
    const { invoiceIds, clientId } = data;

    if (!invoiceIds || invoiceIds.length === 0) {
      throw new BadRequestException('Nenhuma nota selecionada.');
    }

    if (clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, companyId },
      });
      if (!client) {
        throw new NotFoundException('Cliente não encontrado.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedInvoices = await tx.fiscalInvoice.updateMany({
        where: { companyId, id: { in: invoiceIds } },
        data: { clientId },
      });

      await tx.fiscalInventoryMovement.updateMany({
        where: { companyId, invoiceId: { in: invoiceIds } },
        data: { clientId },
      });

      const items = await tx.fiscalInvoiceItem.findMany({
        where: { invoiceId: { in: invoiceIds }, productId: { not: null } },
        select: { productId: true },
      });
      const productIds = items.map((i) => i.productId).filter(Boolean) as string[];

      if (productIds.length > 0) {
        await tx.fiscalProduct.updateMany({
          where: { companyId, id: { in: productIds }, clientId: null },
          data: { clientId },
        });
      }

      return { updated: updatedInvoices.count };
    });
  }

  // =================================================================
  // 🗑️ DELETAR NOTA COM ESTORNO DE ESTOQUE (Sprint 9)
  // =================================================================
  async remove(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.fiscalInvoice.findFirst({
        where: { id, companyId },
      });
      if (!invoice) {
        throw new NotFoundException('Nota fiscal não encontrada.');
      }

      const movements = await tx.fiscalInventoryMovement.findMany({
        where: { invoiceId: id },
        select: { productId: true },
      });
      const productIds = [...new Set(movements.map((m) => m.productId))];

      await tx.fiscalInventoryMovement.deleteMany({
        where: { invoiceId: id },
      });

      await tx.fiscalInvoice.delete({ where: { id } });

      for (const productId of productIds) {
        await this.recalculateProduct(tx, productId);
      }

      return {
        message: 'Nota excluída e estoque ajustado.',
        recalculatedProducts: productIds.length,
      };
    });
  }

  private async recalculateProduct(
    tx: Prisma.TransactionClient,
    productId: string,
  ) {
    const movements = await tx.fiscalInventoryMovement.findMany({
      where: { productId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    let stock = 0;
    let avg = 0;

    for (const m of movements) {
      const qty = Number(m.quantity);
      const cost = Number(m.unitCost);

      if (qty > 0) {
        const newStock = stock + qty;
        avg = newStock > 0 ? (stock * avg + qty * cost) / newStock : cost;
        stock = newStock;
      } else {
        stock += qty;
      }
    }

    await tx.fiscalProduct.update({
      where: { id: productId },
      data: { currentStock: stock, averageCost: avg },
    });
  }
}