import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * =================================================================
 * 🏢 SupplierService — Gestão de Fornecedores Fiscais
 * =================================================================
 * CRUD completo de fornecedores com validação multi-tenant,
 * proteção contra duplicatas (CNPJ) e soft delete.
 *
 * 🛡️ Garantias:
 * - Fornecedor só pertence a uma empresa (companyId)
 * - CNPJ único por empresa
 * - Soft delete para preservar histórico fiscal
 * =================================================================
 */
@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos os fornecedores de uma empresa.
   * Suporta busca por nome/CNPJ e paginação.
   */
  async findAll(
    companyId: string,
    filters: { search?: string; page?: number; limit?: number } = {},
  ) {
    const { search = '', page = 1, limit = 50 } = filters;

    const where = {
      companyId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cnpj: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [suppliers, total] = await Promise.all([
      this.prisma.fiscalSupplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.fiscalSupplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca um fornecedor específico por ID.
   * Valida posse (multi-tenant) antes de retornar.
   */
  async findOne(id: string, companyId: string) {
    const supplier = await this.prisma.fiscalSupplier.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        _count: { select: { invoices: true } },
        invoices: {
          take: 10,
          orderBy: { emissionDate: 'desc' },
          select: {
            id: true,
            number: true,
            series: true,
            emissionDate: true,
            totalValue: true,
            status: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(
        'Fornecedor não encontrado ou não pertence a esta empresa.',
      );
    }

    return supplier;
  }

  /**
   * Cria um novo fornecedor com validação de duplicidade.
   */
  async create(companyId: string, data: {
    cnpj: string;
    name: string;
    tradeName?: string;
    stateRegistration?: string;
    state?: string;
    email?: string;
    phone?: string;
  }) {
    // Validação de dados obrigatórios
    if (!data.cnpj || !data.name) {
      throw new BadRequestException('CNPJ e Nome são obrigatórios.');
    }

    // Normaliza CNPJ (remove formatação)
    const cleanCnpj = data.cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos.');
    }

    // Verifica duplicidade
    const existing = await this.prisma.fiscalSupplier.findFirst({
      where: { companyId, cnpj: cleanCnpj, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(
        `Já existe um fornecedor com o CNPJ ${data.cnpj} nesta empresa.`,
      );
    }

    return this.prisma.fiscalSupplier.create({
      data: {
        ...data,
        cnpj: cleanCnpj,
        companyId,
      },
    });
  }

  /**
   * Atualiza um fornecedor existente.
   * Se CNPJ mudar, valida duplicidade.
   */
  async update(
    id: string,
    companyId: string,
    data: {
      cnpj?: string;
      name?: string;
      tradeName?: string;
      stateRegistration?: string;
      state?: string;
      email?: string;
      phone?: string;
    },
  ) {
    // Valida posse
    await this.findOne(id, companyId);

    // Se CNPJ mudar, valida duplicidade
    if (data.cnpj) {
      const cleanCnpj = data.cnpj.replace(/\D/g, '');
      const duplicate = await this.prisma.fiscalSupplier.findFirst({
        where: {
          companyId,
          cnpj: cleanCnpj,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Já existe outro fornecedor com o CNPJ ${data.cnpj}.`,
        );
      }

      data.cnpj = cleanCnpj;
    }

    return this.prisma.fiscalSupplier.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete: marca como deletado sem remover fisicamente.
   * Essencial para compliance fiscal (não apagar histórico).
   */
  async delete(id: string, companyId: string) {
    const supplier = await this.findOne(id, companyId);

    // Verifica se há notas fiscais vinculadas
    const invoiceCount = await this.prisma.fiscalInvoice.count({
      where: { supplierId: id },
    });

    if (invoiceCount > 0) {
      throw new ConflictException(
        `Não é possível excluir: este fornecedor possui ${invoiceCount} nota(s) fiscal(is) vinculada(s).`,
      );
    }

    return this.prisma.fiscalSupplier.update({
      where: { id: supplier.id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Busca ou cria fornecedor pelo CNPJ (usado pelo parser de XML).
   * Retorna fornecedor existente ou cria novo automaticamente.
   */
  async findOrCreateByCnpj(
    companyId: string,
    cnpj: string,
    data: {
      name: string;
      tradeName?: string;
      stateRegistration?: string;
      state?: string;
    },
  ) {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    const existing = await this.prisma.fiscalSupplier.findFirst({
      where: { companyId, cnpj: cleanCnpj, deletedAt: null },
    });

    if (existing) return existing;

    return this.prisma.fiscalSupplier.create({
      data: {
        ...data,
        cnpj: cleanCnpj,
        companyId,
      },
    });
  }
}