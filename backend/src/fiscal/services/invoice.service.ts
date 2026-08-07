import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XmlParserService, ParsedInvoice } from './xml-parser.service';

/**
 * =================================================================
 * 📄 InvoiceService — Processamento de NF-e de Entrada
 * =================================================================
 * Fluxo de uma nota uploadada:
 * 1. Parser extrai dados do XML
 * 2. Bloqueia NF-e duplicada (accessKey única por empresa)
 * 3. Cria/vincula fornecedor (findOrCreate por CNPJ)
 * 4. Casa itens com o catálogo (ou cria produto novo = status NEW)
 * 5. Grava nota + itens em transação
 * 6. Gera movimentos de ENTRADA no Kardex
 * 7. Atualiza saldo + custo médio ponderado do produto
 * =================================================================
 */
@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlParser: XmlParserService,
  ) {}

  /**
   * Processa um lote de arquivos XML.
   * Retorna resumo por arquivo (sucesso/erro) — nunca aborta o lote.
   */
  async processUpload(
    companyId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    const results: any[] = [];

    for (const file of files) {
      try {
        const parsed = this.xmlParser.parse(file.buffer.toString('utf-8'));
        const invoice = await this.persistInvoice(companyId, userId, parsed);
        results.push({
          fileName: file.originalname,
          status: 'PROCESSED',
          accessKey: parsed.accessKey,
          invoiceId: invoice.id,
          items: parsed.items.length,
          totalValue: parsed.totalValue,
        });
      } catch (e: any) {
        results.push({
          fileName: file.originalname,
          status: 'ERROR',
          error: e?.message || 'Erro desconhecido no parser.',
        });
      }
    }

    return {
      total: files.length,
      processed: results.filter((r) => r.status === 'PROCESSED').length,
      errors: results.filter((r) => r.status === 'ERROR').length,
      results,
    };
  }

  /**
   * Persiste uma NF-e parseada com transação atômica:
   * fornecedor + produtos + nota + itens + kardex + saldo.
   */
  private async persistInvoice(
    companyId: string,
    userId: string,
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
        let product = item.supplierCode
          ? await tx.fiscalProduct.findFirst({
              where: {
                companyId,
                deletedAt: null,
                code: item.supplierCode,
              },
            })
          : null;

        if (!product && item.ean) {
          product = await tx.fiscalProduct.findFirst({
            where: { companyId, deletedAt: null, ean: item.ean },
          });
        }

        const matched = !!product;

        if (!product) {
          product = await tx.fiscalProduct.create({
            data: {
              companyId,
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

  /** Lista notas da empresa com fornecedor e contagem de itens */
  async findAll(
    companyId: string,
    filters: { page?: number; limit?: number; search?: string } = {},
  ) {
    const { page = 1, limit = 50, search = '' } = filters;

    const where: any = {
      companyId,
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

  /** Detalhe da nota com itens e produtos */
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
}