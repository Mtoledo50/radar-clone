import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

/**
 * =================================================================
 * 📦 ProductService — Catálogo de Produtos Fiscais
 * =================================================================
 * Sprint 8: Todas as queries agora suportam filtro por clientId.
 * A criação de produtos agora aceita e salva o clientId.
 * =================================================================
 */
@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(product: any) {
    return {
      ...product,
      averageCost: Number(product.averageCost ?? 0),
      currentStock: Number(product.currentStock ?? 0),
    };
  }

  private normalizeDigits(value?: string): string {
    return (value || '').replace(/\D/g, '');
  }

  async findAll(
    companyId: string,
    filters: { search?: string; page?: number; limit?: number; clientId?: string } = {},
  ) {
    const { search = '', page = 1, limit = 50, clientId } = filters;
    const digits = this.normalizeDigits(search);

    const orConditions: any[] = [
      { description: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
    if (digits) {
      orConditions.push({ ncm: { contains: digits } });
      orConditions.push({ ean: { contains: digits } });
    }

    const where: any = {
      companyId,
      deletedAt: null,
      ...(clientId && { clientId }), // 🆕 Sprint 8: Filtra por cliente se fornecido
      ...(search && { OR: orConditions }),
    };

    const [products, total] = await Promise.all([
      this.prisma.fiscalProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { description: 'asc' },
      }),
      this.prisma.fiscalProduct.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toResponse(p)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, companyId: string) {
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        _count: { select: { movements: true, invoiceItems: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado ou não pertence a esta empresa.');
    }

    return this.toResponse(product);
  }

  async create(companyId: string, dto: CreateProductDto) {
    const ncm = this.normalizeDigits(dto.ncm);

    if (ncm.length !== 8) {
      throw new BadRequestException('NCM inválido. Deve conter 8 dígitos (ex: 03019900).');
    }

    // 🆕 Sprint 8: Unicidade agora considera o clientId (ou null)
    const existing = await this.prisma.fiscalProduct.findFirst({
      where: { 
        companyId, 
        clientId: dto.clientId || null, 
        code: dto.code, 
        deletedAt: null 
      },
    });
    
    if (existing) {
      throw new ConflictException(
        `Já existe um produto com o código ${dto.code} ${dto.clientId ? 'para este cliente' : 'no catálogo geral'}.`,
      );
    }

    const product = await this.prisma.fiscalProduct.create({
      data: {
        companyId,
        clientId: dto.clientId || null, // 🆕 Sprint 8
        code: dto.code,
        description: dto.description,
        ncm,
        unit: dto.unit.toUpperCase(),
        ean: dto.ean ? this.normalizeDigits(dto.ean) : null,
        averageCost: dto.averageCost ?? 0,
        currentStock: dto.currentStock ?? 0,
      },
    });

    return this.toResponse(product);
  }

  async update(id: string, companyId: string, dto: UpdateProductDto) {
    const existing = await this.prisma.fiscalProduct.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException('Produto não encontrado ou não pertence a esta empresa.');
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.fiscalProduct.findFirst({
        where: { companyId, clientId: existing.clientId, code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(`Já existe outro produto com o código ${dto.code}.`);
      }
    }

    let ncm: string | undefined;
    if (dto.ncm !== undefined) {
      ncm = this.normalizeDigits(dto.ncm);
      if (ncm.length !== 8) {
        throw new BadRequestException('NCM inválido. Deve conter 8 dígitos.');
      }
    }

    const product = await this.prisma.fiscalProduct.update({
      where: { id },
      data: {
        code: dto.code,
        description: dto.description,
        ncm,
        unit: dto.unit?.toUpperCase(),
        ean: dto.ean !== undefined ? this.normalizeDigits(dto.ean) : undefined,
        averageCost: dto.averageCost,
        currentStock: dto.currentStock,
        // Nota: clientId não é atualizado aqui para evitar órfãos de histórico
      },
    });

    return this.toResponse(product);
    }

  async delete(id: string, companyId: string) {
    const product = await this.findOne(id, companyId);

    const [movements, invoiceItems] = await Promise.all([
      this.prisma.fiscalInventoryMovement.count({ where: { productId: id } }),
      this.prisma.fiscalInvoiceItem.count({ where: { productId: id } }),
    ]);

    if (movements > 0 || invoiceItems > 0) {
      throw new ConflictException(
        `Não é possível excluir: este produto possui ${movements} movimentação(ões) e ${invoiceItems} item(ns) de nota vinculados.`,
      );
    }

    await this.prisma.fiscalProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Produto removido com sucesso.' };
  }
    // =================================================================
  // 🧹 LIMPEZA DE CATÁLOGO (Sprint 9)
  // =================================================================

  /**
   * Remove (soft delete) produtos que ficaram "órfãos" após o estorno
   * de notas fiscais.
   *
   * 🛡️ Critérios de segurança (TODOS obrigatórios):
   *   - currentStock = 0
   *   - nenhuma movimentação no kardex
   *   - nenhum item de nota vinculado
   *
   * Isso garante que NUNCA apagaremos um produto com histórico fiscal
   * ou saldo em estoque.
   *
   * @param clientId - se informado, limpa apenas produtos daquele cliente;
   *                   se null/undefined, limpa apenas os sem cliente (legado)
   */
  async cleanupEmpty(companyId: string, clientId?: string | null) {
    const empty = await this.prisma.fiscalProduct.findMany({
      where: {
        companyId,
        deletedAt: null,
        currentStock: 0,
        movements: { none: {} },      // sem movimentações
        invoiceItems: { none: {} },   // sem itens de nota
        ...(clientId ? { clientId } : {}),
      },
      select: { id: true },
    });

    if (empty.length === 0) {
      return { removed: 0, message: 'Nenhum produto vazio para limpar.' };
    }

    // Soft delete (mantém auditoria)
    await this.prisma.fiscalProduct.updateMany({
      where: { id: { in: empty.map((p) => p.id) } },
      data: { deletedAt: new Date() },
    });

    return {
      removed: empty.length,
      message: `${empty.length} produto(s) removido(s) do catálogo.`,
    };
  }
}