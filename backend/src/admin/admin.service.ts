import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardClientDto } from './dto/onboard-client.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { catalogData } from '../seed-full-catalog-data';
import * as bcrypt from 'bcrypt';

/**
 * =================================================================
 * 🛡️ AdminService — Regras de Negócio Administrativas
 * =================================================================
 * Centraliza toda a lógica do painel administrativo. O controller
 * apenas coordena HTTP e passa os parâmetros para este service.
 * 
 * Princípios aplicados:
 * - Single Responsibility (SRP): uma responsabilidade por método
 * - Defensive Programming: valida todas as entradas
 * - Atomicidade: operações compostas usam transações
 * =================================================================
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 🏢 GESTÃO DE EMPRESAS (Tenants)
  // =================================================================

  /**
   * Lista todas as empresas do sistema (visão Super Admin)
   */
  async listCompanies() {
    return this.prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Atualiza plano e módulos permitidos de uma empresa
   */
  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        plan: dto.plan,
        allowedModules: dto.allowedModules,
      },
    });
  }

  /**
   * 🗑️ SOFT DELETE de empresa (desativa empresa e seus usuários)
   *
   * Proteções aplicadas:
   * 1. Impede deleção da empresa padrão do sistema
   * 2. Impede que admin delete a própria empresa
   * 3. Usa soft delete (não apaga dados fisicamente)
   */
  async deleteCompany(id: string, requesterUserId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: { users: { select: { id: true } } },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    // 🛡️ Proteção 1: Empresa padrão do sistema
    if (
      company.name.includes('Escritório Padrão') ||
      company.id === '00000000-0000-0000-0000-000000000001'
    ) {
      throw new BadRequestException(
        'Não é possível deletar a empresa padrão do sistema.',
      );
    }

    // 🛡️ Proteção 2: Obter companyId do usuário que está fazendo a requisição
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
      select: { companyId: true },
    });

    if (requester?.companyId === id) {
      throw new BadRequestException(
        'Você não pode deletar a empresa da qual faz parte.',
      );
    }

    // 🧹 SOFT DELETE em transação: desativa empresa + usuários
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Desativa todos os usuários da empresa
      await tx.user.updateMany({
        where: { companyId: id },
        data: { deletedAt: now },
      });

      // Desativa a empresa
      return tx.company.update({
        where: { id },
        data: { deletedAt: now },
      });
    });
  }

  // =================================================================
  // 👥 GESTÃO DE USUÁRIOS
  // =================================================================

  /**
   * Lista todos os usuários do sistema
   */
  async listUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Atualiza a role de um usuário
   */
  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });
  }

  /**
   * 🗑️ SOFT DELETE de usuário
   *
   * Proteção: impede que admin delete a si mesmo
   */
  async deleteUser(id: string, requesterUserId: string) {
    if (id === requesterUserId) {
      throw new BadRequestException(
        'Você não pode deletar o seu próprio usuário.',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Soft delete (preserva histórico de auditoria)
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =================================================================
  // 🚀 ONBOARDING DE NOVOS CLIENTES (Enterprise)
  // =================================================================

  /**
   * Cria empresa + usuário admin em uma única transação.
   * 
   * Garantias:
   * - Atomicidade: se o usuário falhar, a empresa é revertida
   * - Validação de email duplicado antes da transação
   * - Hash de senha com bcrypt (10 rounds)
   * - Plano e módulos padrão definidos
   */
  async onboardClient(dto: OnboardClientDto) {
    // Validação pré-transação (falha rápida)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }

    // Hash da senha (operacionalmente custoso, fora da transação)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Transação atômica: empresa + usuário
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria a empresa (Tenant)
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          cnpj: dto.cnpj || null,
          plan: dto.plan || 'BASIC',
          allowedModules: dto.allowedModules || [
            'dashboard',
            'pessoas',
            'clientes',
          ],
        },
      });

      // 2. Cria o usuário admin da nova empresa
      const user = await tx.user.create({
        data: {
          name: dto.userName,
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN', // 👑 O primeiro usuário da empresa é ADMIN
          companyId: company.id,
        },
      });

      // Retorna dados limpos (sem senha!)
      return {
        company,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
      };
    });
  }

  // =================================================================
  // 📦 IMPORTAÇÃO DE CATÁLOGO COMPLETO
  // =================================================================

  /**
   * 📦 IMPORTAÇÃO DE CATÁLOGO COMPLETO
   * 
   * Popula o catálogo da empresa com 17 departamentos e ~200 serviços
   * pré-configurados (MEI, IRPF, Fiscal, Contábil, BPO, etc.).
   * 
   * Garantias:
   * - Transação atômica: se falhar, nada é salvo
   * - Idempotente: limpa catálogo anterior antes de importar
   * - Dados ricos: escopo, fora-do-escopo, SLA, documentos, preço
   * 
   * @param companyId - ID da empresa que receberá o catálogo
   */
  async importFullCatalog(companyId: string) {
    // Valida se a empresa existe
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Limpar catálogo existente (ordem correta: filhos antes dos pais)
      await tx.planServiceItem.deleteMany({
        where: { plan: { companyId } },
      });
      await tx.serviceItem.deleteMany({ where: { companyId } });
      await tx.serviceCategory.deleteMany({ where: { companyId } });

      // 2. Criar categorias e itens
      let totalItems = 0;
      for (const category of catalogData) {
        const dbCategory = await tx.serviceCategory.create({
          data: {
            companyId,
            name: category.name,
            icon: category.icon,
            order: category.order,
            description: category.description,
          },
        });

               for (const item of category.items) {
          await tx.serviceItem.create({
            data: {
              companyId: companyId,
              categoryId: dbCategory.id,
              name: item.name,
              basePrice: item.basePrice,
              recurrence: item.recurrence as any,
              slaDays: item.slaDays,
              scope: item.scope,
              outOfScope: item.outOfScope,
              requiredDocs: item.requiredDocs,
              isActive: true,
            } as any, // ✅ Cast para contornar conflito de tipos do Prisma
          });
          totalItems++;
        }
      }

      return {
        message: 'Catálogo importado com sucesso!',
        categories: catalogData.length,
        services: totalItems,
      };
    });
  }
}