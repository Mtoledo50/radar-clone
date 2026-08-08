import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException, // 🆕 Sprint 9: usado no assignClient
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { XmlParserService, ParsedInvoice } from './xml-parser.service';

/**
 * =================================================================
 * 📄 InvoiceService — Processamento de NF-e de Entrada
 * =================================================================
 * Responsabilidades centrais do módulo fiscal:
 * - Receber o XML parseado pelo XmlParserService
 * - Persistir nota + itens + fornecedor em transação atômica
 * - Atualizar estoque (Kardex) e custo médio ponderado
 * - Fornecer consultas paginadas e KPIs para o frontend
 *
 * 🆕 Sprint 8: Suporte completo a `clientId`:
 *   - Nota, produtos auto-criados e movimentos são vinculados ao cliente
 *   - Consultas e métricas podem ser filtradas por clientId
 *   - Dados legados (clientId = null) continuam funcionando
 *
 * 🛡️ Integridade:
 *   - NF-e duplicada é bloqueada pela accessKey (44 dígitos)
 *   - $transaction garante "tudo ou nada" (nota + itens + kardex)
 * =================================================================
 */
@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlParser: XmlParserService,
  ) {}

  // =================================================================
  // 📤 UPLOAD E PROCESSAMENTO EM LOTE
  // =================================================================

  /**
   * Processa um lote de arquivos XML.
   * Retorna resumo por arquivo (sucesso/erro) — nunca aborta o lote.
   *
   * @param companyId - Tenant autenticado (do token JWT)
   * @param userId    - Usuário que executou o upload (auditoria)
   * @param clientId  - 🆕 Sprint 8: cliente dono do estoque (opcional)
   * @param files     - Arquivos recebidos via multipart
   *
   * @returns { total, processed, errors, results[] }
   */
    // =================================================================
  // 📤 UPLOAD E PROCESSAMENTO EM LOTE (RESILIENTE)
  // =================================================================

  /**
   * Processa um lote de arquivos XML.
   *
   * 🆕 Sprint 9 — Resiliência:
   *   - Cada arquivo é processado ISOLADAMENTE (try/catch por arquivo)
   *   - NF-e duplicada NÃO aborta o lote: é marcada como DUPLICATE e o
   *     processamento CONTINUA para os demais arquivos
   *   - Status semânticos: PROCESSED | DUPLICATE | ERROR
   *
   * @param clientId - 🆕 Sprint 8: cliente dono das notas importadas
   * @returns { total, processed, duplicates, errors, results[] }
   */
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
        // 🆕 Sprint 9: Duplicata vira status próprio (não bloqueia o lote)
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

    return {
      total: files.length,
      processed,
      duplicates, // 🆕 Sprint 9
      errors,
      results,
    };
  }
  // =================================================================
  // 💾 PERSISTÊNCIA ATÔMICA DA NF-e
  // =================================================================

  /**
   * Persiste uma NF-e parseada com transação atômica:
   * fornecedor + produtos + nota + itens + kardex.
   *
   * Fluxo por item:
   *   1. Tenta casar com o catálogo (código do fornecedor ou EAN)
   *   2. Se não existir, cria o produto (status NEW)
   *   3. Recalcula custo médio ponderado móvel
   *   4. Registra movimento de ENTRADA no kardex
   *
   * @throws ConflictException se a accessKey já foi importada
   */
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

      // 2. Fornecedor: cria ou vincula por CNPJ (compartilhado entre clientes)
      const supplier = await tx.fiscalSupplier.upsert({
        where: {
          companyId_cnpj: { companyId, cnpj: parsed.supplier.cnpj },
        },
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
        // 🆕 Sprint 8: matching considera o catálogo do cliente
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
              clientId: clientId || null, // 🆕 Sprint 8
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
          clientId: clientId || null, // 🆕 Sprint 8
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
          clientId: clientId || null, // 🆕 Sprint 8
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
  // 📋 LISTAGEM PAGINADA
  // =================================================================

  /**
   * Lista notas da empresa com fornecedor e contagem de itens.
   * 🆕 Sprint 8: filtro opcional por clientId.
   *
   * @param filters.page   - Página atual (padrão 1)
   * @param filters.limit  - Itens por página (padrão 50, máx 100)
   * @param filters.search - Busca por número, chave ou fornecedor
   * @param filters.clientId - 🆕 Filtra notas do cliente selecionado
   */
  async findAll(
    companyId: string,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      clientId?: string;
    } = {},
  ) {
    const { page = 1, limit = 50, search = '', clientId } = filters;

    const where: any = {
      companyId,
      ...(clientId && { clientId }), // 🆕 Sprint 8
      ...(search && {
        OR: [
          { number: { contains: search } },
          { accessKey: { contains: search } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      this.prisma.fiscalInvoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { emissionDate: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, cnpj: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.fiscalInvoice.count({ where }),
    ]);

    return {
      data: invoices.map((i) => ({
        ...i,
        totalValue: Number(i.totalValue),
        icmsValue: Number(i.icmsValue),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // =================================================================
  // 🔍 DETALHE DA NOTA
  // =================================================================

  /**
   * Detalhe da nota com itens e produtos vinculados.
   * Usado pelo modal de visualização no frontend.
   *
   * @throws NotFoundException se não existir ou pertencer a outro tenant
   */
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

  /**
   * Métricas agregadas para os cards da tela de Notas Fiscais.
   * 🆕 Sprint 8: filtro opcional por clientId.
   *
   * ⚡ Performance: 3 queries em paralelo via Promise.all
   * 🛡️ Tipagem: filtros de nota e de movimento tipados separadamente
   *    (evita o erro de compatibilidade DateTimeFilter entre modelos)
   */
  async getMetrics(
    companyId: string,
    filters: { startDate?: string; endDate?: string; clientId?: string } = {},
  ) {
    const { startDate, endDate, clientId } = filters;

    // Filtro de período para notas fiscais
    const where: Prisma.FiscalInvoiceWhereInput = { companyId };
    if (startDate || endDate) {
      where.emissionDate = {
        ...(startDate && { gte: new Date(`${startDate}T00:00:00`) }),
        ...(endDate && { lte: new Date(`${endDate}T23:59:59`) }),
      };
    }
    if (clientId) {
      where.clientId = clientId; // 🆕 Sprint 8
    }

    // Filtro de período para movimentos (tipagem própria do modelo)
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
      movementWhere.clientId = clientId; // 🆕 Sprint 8
    }

    const [invoiceAgg, suppliers, movementAgg] = await Promise.all([
      // Totais da nota (valores + impostos)
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
      // Fornecedores distintos no período
      this.prisma.fiscalInvoice.findMany({
        where,
        distinct: ['supplierId'],
        select: { supplierId: true },
      }),
      // Volume e custo de itens entrados no kardex
      this.prisma.fiscalInventoryMovement.aggregate({
        where: movementWhere,
        _sum: { quantity: true, totalCost: true },
      }),
    ]);

    // Converte Decimal → Number (JSON limpo para o frontend)
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

  /**
   * Atribui (ou remove) o vínculo de cliente em um conjunto de notas.
   * Usado para migrar notas legadas (clientId = null) para um cliente.
   *
   * 🆕 Sprint 9:
   *   - Atualiza o clientId das notas selecionadas
   *   - Atualiza o clientId das movimentações de estoque ligadas a elas
   *   - Atualiza o clientId dos produtos vinculados (apenas os que ainda
   *     não têm cliente, para não quebrar vínculos existentes)
   *
   * @param invoiceIds - Lista de notas a atualizar
   * @param clientId   - Cliente alvo (null para desvincular)
   * @throws NotFoundException se o cliente não existir
   * @throws BadRequestException se nenhuma nota for selecionada
   */
  async assignClient(
    companyId: string,
    data: { invoiceIds: string[]; clientId: string | null },
  ) {
    const { invoiceIds, clientId } = data;

    if (!invoiceIds || invoiceIds.length === 0) {
      throw new BadRequestException('Nenhuma nota selecionada.');
    }

    // Valida que o cliente existe e pertence ao tenant
    if (clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, companyId },
      });
      if (!client) {
        throw new NotFoundException('Cliente não encontrado.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza o clientId das notas
      const updatedInvoices = await tx.fiscalInvoice.updateMany({
        where: { companyId, id: { in: invoiceIds } },
        data: { clientId },
      });

      // 2. Atualiza o clientId das movimentações ligadas a essas notas
      await tx.fiscalInventoryMovement.updateMany({
        where: { companyId, invoiceId: { in: invoiceIds } },
        data: { clientId },
      });

      // 3. Atualiza o clientId dos produtos vinculados aos itens
      // (apenas produtos ainda sem cliente)
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

  /**
   * Exclui uma NF-e e reverte seus efeitos no estoque.
   *
   * 🆕 Sprint 9 — Estorno fiscalmente correto:
   *   1. Valida posse da nota (multi-tenant)
   *   2. Identifica produtos afetados pelas movimentações da nota
   *   3. Remove as movimentações da nota (estorno)
   *   4. Remove a nota (itens são removidos em cascata)
   *   5. Recalcula saldo + custo médio de cada produto afetado
   *      por REPLAY das movimentações restantes
   *
   * ⚠️ Por que não usar apenas cascade delete?
   *   FiscalInventoryMovement.invoiceId tem onDelete: SetNull, então
   *   deletar a nota NÃO removeria as movimentações — o estoque ficaria
   *   inflado. Por isso removemos explicitamente e recalculamos.
   *
   * @throws NotFoundException se a nota não existir
   */
  async remove(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Valida posse da nota
      const invoice = await tx.fiscalInvoice.findFirst({
        where: { id, companyId },
      });
      if (!invoice) {
        throw new NotFoundException('Nota fiscal não encontrada.');
      }

      // 2. Identifica produtos afetados
      const movements = await tx.fiscalInventoryMovement.findMany({
        where: { invoiceId: id },
        select: { productId: true },
      });
      const productIds = [...new Set(movements.map((m) => m.productId))];

      // 3. Remove as movimentações da nota (estorno)
      await tx.fiscalInventoryMovement.deleteMany({
        where: { invoiceId: id },
      });

      // 4. Remove a nota (itens removidos em cascata)
      await tx.fiscalInvoice.delete({ where: { id } });

      // 5. Recalcula cada produto afetado
      for (const productId of productIds) {
        await this.recalculateProduct(tx, productId);
      }

      return {
        message: 'Nota excluída e estoque ajustado.',
        recalculatedProducts: productIds.length,
      };
    });
  }

  /**
   * Recalcula saldo e custo médio de um produto por REPLAY das
   * movimentações restantes (usado após estorno de uma nota).
   *
   * @param tx - Cliente de transação Prisma
   * @param productId - Produto a recalcular
   */
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
        // Entrada: recalcula custo médio ponderado móvel
        const newStock = stock + qty;
        avg = newStock > 0 ? (stock * avg + qty * cost) / newStock : cost;
        stock = newStock;
      } else {
        // Saída/ajuste negativo: reduz saldo, mantém custo médio
        stock += qty;
      }
    }

    await tx.fiscalProduct.update({
      where: { id: productId },
      data: { currentStock: stock, averageCost: avg },
    });
  }

}