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
 * Responsabilidades:
 * - CRUD multi-tenant (companyId em todas as queries)
 * - Normalização de NCM/EAN (somente dígitos)
 * - Validação de NCM (8 dígitos — exigência fiscal)
 * - Soft delete com bloqueio se houver movimentações
 * - Conversão Decimal → Number na resposta (JSON limpo)
 * =================================================================
 */
@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Converte campos Decimal do Prisma para Number no JSON.
   * Evita strings quebradas no frontend ("12.5000" vs 12.5).
   */
  private toResponse(product: any) {
    return {
      ...product,
      averageCost: Number(product.averageCost ?? 0),
      currentStock: Number(product.currentStock ?? 0),
    };
  }

  /**
   * Normaliza NCM/EAN: remove pontuação, mantém só dígitos.
   */
  private normalizeDigits(value?: string): string {
    return (value || '').replace(/\D/g, '');
  }

  /**
   * Lista produtos com busca (descrição, código, NCM, EAN) e paginação.
   */
  async findAll(
    companyId: string,
    filters: { search?: string; page?: number; limit?: number } = {},
  ) {
    const { search = '', page = 1, limit = 50 } = filters;
    const digits = this.normalizeDigits(search);

    // Busca textual + busca por dígitos (NCM/EAN)
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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca um produto específico (validação multi-tenant).
   */
  async findOne(id: string, companyId: string) {
    const product = await this.prisma.fiscalProduct.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        _count: {
          select: { movements: true, invoiceItems: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence a esta empresa.',
      );
    }

    return this.toResponse(product);
  }

  /**
   * Cria produto com validação de NCM e unicidade de código.
   */
  async create(companyId: string, dto: CreateProductDto) {
    const ncm = this.normalizeDigits(dto.ncm);

    // NCM fiscal brasileiro: exatamente 8 dígitos
    if (ncm.length !== 8) {
      throw new BadRequestException(
        'NCM inválido. Deve conter 8 dígitos (ex: 03019900).',
      );
    }

    // Unicidade de código por empresa
    const existing = await this.prisma.fiscalProduct.findFirst({
      where: { companyId, code: dto.code, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe um produto com o código ${dto.code} nesta empresa.`,
      );
    }

    const product = await this.prisma.fiscalProduct.create({
      data: {
        companyId,
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

  /**
   * Atualiza produto (com re-validação de NCM e código).
   */
  async update(id: string, companyId: string, dto: UpdateProductDto) {
    const existing = await this.prisma.fiscalProduct.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(
        'Produto não encontrado ou não pertence a esta empresa.',
      );
    }

    // Se código mudou, valida unicidade
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.fiscalProduct.findFirst({
        where: { companyId, code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(
          `Já existe outro produto com o código ${dto.code}.`,
        );
      }
    }

    // Se NCM informado, re-valida 8 dígitos
    let ncm: string | undefined;
    if (dto.ncm !== undefined) {
      ncm = this.normalizeDigits(dto.ncm);
      if (ncm.length !== 8) {
        throw new BadRequestException(
          'NCM inválido. Deve conter 8 dígitos (ex: 03019900).',
        );
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
      },
    });

    return this.toResponse(product);
  }

  /**
   * Soft delete com proteção de integridade:
   * bloqueia exclusão se o produto tiver movimentações ou itens de NF.
   */
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
}