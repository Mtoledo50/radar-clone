import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType, ClientStatus } from '@prisma/client';

// =================================================================
// 📦 TIPOS E INTERFACES (Type Safety)
// =================================================================

/**
 * Interface para CRIAÇÃO de cliente.
 * companyName e startDate são OBRIGATÓRIOS (conforme schema Prisma).
 */
export interface CreateClientData {
  companyName: string; // ✅ OBRIGATÓRIO
  cnpj?: string;
  serviceType?: ServiceType;
  monthlyFee?: number;
  status?: ClientStatus;
  startDate: string | Date; // ✅ OBRIGATÓRIO
  endDate?: string | Date | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  observations?: string;
  commercialPlanId?: string;
  avulsoServiceIds?: string[];
}

/**
 * Interface para ATUALIZAÇÃO de cliente.
 * Todos os campos são opcionais (atualização parcial).
 */
export interface UpdateClientData {
  companyName?: string;
  cnpj?: string;
  serviceType?: ServiceType;
  monthlyFee?: number;
  status?: ClientStatus;
  startDate?: string | Date;
  endDate?: string | Date | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  observations?: string;
  commercialPlanId?: string;
  avulsoServiceIds?: string[];
}

/**
 * Interface para dados mensais (upsert)
 */
export interface MonthlyDataPayload {
  initialClients?: number | string;
  newClients?: number | string;
  churnedClients?: number | string;
  newRevenue?: number | string;
  lostRevenue?: number | string;
  finalRevenue?: number | string;
}

/**
 * Interface para métricas resumidas
 */
export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  prospectClients: number;
  churnedClients: number;
  totalMonthlyRevenue: number;
  churnRate: number;
}

/**
 * =================================================================
 * 🏢 ClientService — Gestão de Clientes Enterprise
 * =================================================================
 * Serviço central para CRUD de clientes com arquitetura multi-tenant,
 * transações atômicas e compliance contábil (soft delete / histórico).
 *
 * 🎯 Princípios Arquiteturais:
 * - 🛡️ Multi-tenant rigoroso (companyId em todas as queries)
 * - 🔄 Transações atômicas em operações compostas
 * - 📜 Soft delete para preservar histórico contábil
 * - 🔗 Sincronização automática de contratos e serviços avulsos
 * - 📊 Herança de recurrence/basePrice do catálogo
 * =================================================================
 */
@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  // =================================================================
  // 📋 LISTAGEM (com relações para o frontend)
  // =================================================================

  /**
   * Lista todos os clientes de uma empresa, incluindo:
   * - Contrato ativo mais recente (com plano comercial)
   * - Serviços avulsos ativos (com item de serviço e categoria)
   */
  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        contracts: {
          where: { status: 'ATIVO' },
          include: { commercialPlan: true },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        services: {
          where: { status: 'ATIVO' },
          include: {
            serviceItem: { include: { category: true } },
          },
        },
      },
    });
  }

  // =================================================================
  // ➕ CRIAÇÃO ENTERPRISE (Cliente + Contrato + Serviços)
  // =================================================================

  /**
   * Cria cliente com contrato e serviços avulsos em transação atômica.
   *
   * 🔄 Fluxo:
   * 1. Valida dados obrigatórios
   * 2. Cria o registro do cliente
   * 3. Se houver commercialPlanId → cria ClientContract ATIVO
   * 4. Se houver avulsoServiceIds → cria ClientService ATIVO
   * 5. Retorna cliente com relações populadas
   */
  async create(companyId: string, userId: string, data: CreateClientData) {
    // Validação de dados obrigatórios
    if (!data.companyName) {
      throw new BadRequestException('Nome da empresa do cliente é obrigatório.');
    }
    if (!data.startDate) {
      throw new BadRequestException('Data de início é obrigatória.');
    }

    // Extrai campos relacionais do payload
    const { commercialPlanId, avulsoServiceIds, ...clientData } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o cliente
      const newClient = await tx.client.create({
        data: {
          ...clientData,
          monthlyFee: clientData.monthlyFee ?? 0, // ✅ LINHA NOVA — garante obrigatório
          companyId,
          user: { connect: { id: userId } },
          startDate: clientData.startDate
            ? new Date(clientData.startDate)
            : new Date(),
          endDate: clientData.endDate ? new Date(clientData.endDate) : null,
        },
      });

      // 2. Cria contrato se houver plano selecionado
      if (commercialPlanId) {
        await tx.clientContract.create({
          data: {
            companyId,
            clientId: newClient.id,
            commercialPlanId,
            startDate: newClient.startDate,
            monthlyFee: clientData.monthlyFee || 0,
            status: 'ATIVO',
          },
        });
      }

      // 3. Cria serviços avulsos (com herança do catálogo)
      if (avulsoServiceIds && avulsoServiceIds.length > 0) {
        const serviceItems = await tx.serviceItem.findMany({
          where: {
            id: { in: avulsoServiceIds },
            deletedAt: null,
          },
          select: {
            id: true,
            recurrence: true,
            basePrice: true,
          },
        });

        if (serviceItems.length !== avulsoServiceIds.length) {
          throw new BadRequestException(
            'Um ou mais serviços avulsos não foram encontrados no catálogo.',
          );
        }

        await tx.clientService.createMany({
          data: serviceItems.map((item) => ({
            companyId,
            clientId: newClient.id,
            serviceItemId: item.id,
            recurrence: item.recurrence,
            status: 'ATIVO',
            startDate: newClient.startDate,
          })),
        });
      }

      // 4. Retorna cliente criado com relações populadas
      return tx.client.findUnique({
        where: { id: newClient.id },
        include: {
          contracts: {
            where: { status: 'ATIVO' },
            include: { commercialPlan: true },
          },
          services: {
            where: { status: 'ATIVO' },
            include: {
              serviceItem: { include: { category: true } },
            },
          },
        },
      });
    });
  }

  // =================================================================
  // 🔄 UPDATE ENTERPRISE (Cliente + Contrato + Serviços)
  // =================================================================

  /**
   * Atualiza cliente e sincroniza contrato e serviços avulsos.
   *
   * 📜 Estratégia de Histórico (Compliance Contábil):
   * - Contratos antigos são marcados como INATIVO (não deletados)
   * - Serviços antigos são marcados como INATIVO (não deletados)
   * - Novos contratos/serviços são criados como ATIVO
   */
  async update(id: string, companyId: string, data: UpdateClientData) {
    // Valida posse do cliente (multi-tenant)
    const existing = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Cliente não encontrado ou não pertence a esta empresa.');
    }

    // Extrai campos relacionais do payload
    const { commercialPlanId, avulsoServiceIds, ...clientData } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza dados básicos do cliente
      const updatedClient = await tx.client.update({
        where: { id },
        data: {
          companyName: clientData.companyName,
          cnpj: clientData.cnpj,
          serviceType: clientData.serviceType,
          monthlyFee: clientData.monthlyFee,
          status: clientData.status,
          startDate: clientData.startDate ? new Date(clientData.startDate) : undefined,
          endDate: clientData.endDate ? new Date(clientData.endDate) : null,
          contactName: clientData.contactName,
          contactEmail: clientData.contactEmail,
          contactPhone: clientData.contactPhone,
          observations: clientData.observations,
        },
      });

      // 2. Sincroniza contrato com plano comercial
      if (commercialPlanId !== undefined) {
        await tx.clientContract.updateMany({
          where: { clientId: id, status: 'ATIVO' },
          data: { status: 'INATIVO', endDate: new Date() },
        });

        if (commercialPlanId) {
          await tx.clientContract.create({
            data: {
              companyId,
              clientId: id,
              commercialPlanId,
              startDate: updatedClient.startDate,
              monthlyFee: clientData.monthlyFee || 0,
              status: 'ATIVO',
            },
          });
        }
      }

      // 3. Sincroniza serviços avulsos
      if (avulsoServiceIds !== undefined) {
        await tx.clientService.updateMany({
          where: { clientId: id, status: 'ATIVO' },
          data: { status: 'INATIVO' },
        });

        if (avulsoServiceIds.length > 0) {
          const serviceItems = await tx.serviceItem.findMany({
            where: {
              id: { in: avulsoServiceIds },
              deletedAt: null,
            },
            select: {
              id: true,
              recurrence: true,
              basePrice: true,
            },
          });

          if (serviceItems.length !== avulsoServiceIds.length) {
            throw new BadRequestException(
              'Um ou mais serviços avulsos não foram encontrados no catálogo.',
            );
          }

          await tx.clientService.createMany({
            data: serviceItems.map((item) => ({
              companyId,
              clientId: id,
              serviceItemId: item.id,
              recurrence: item.recurrence,
              status: 'ATIVO',
              startDate: updatedClient.startDate,
            })),
          });
        }
      }

      // 4. Retorna cliente atualizado com relações
      return tx.client.findUnique({
        where: { id },
        include: {
          contracts: {
            where: { status: 'ATIVO' },
            include: { commercialPlan: true },
          },
          services: {
            where: { status: 'ATIVO' },
            include: {
              serviceItem: { include: { category: true } },
            },
          },
        },
      });
    });
  }

  // =================================================================
  // 🗑️ SOFT DELETE (Compliance Contábil)
  // =================================================================

  /**
   * SOFT DELETE: marca cliente como CHURN (não apaga fisicamente).
   */
  async delete(id: string, companyId: string) {
    const existing = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Cliente não encontrado ou não pertence a esta empresa.');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.clientContract.updateMany({
        where: { clientId: id, status: 'ATIVO' },
        data: { status: 'INATIVO', endDate: now },
      });

      await tx.clientService.updateMany({
        where: { clientId: id, status: 'ATIVO' },
        data: { status: 'INATIVO' },
      });

      return tx.client.update({
        where: { id },
        data: {
          deletedAt: now,
          status: 'CHURN',
          endDate: now,
        },
      });
    });
  }

  // =================================================================
  // 📊 DASHBOARD: Métricas Gerais (Churn, MRR, Ticket Médio)
  // =================================================================

  async getDashboard(companyId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    const activeClients = await this.prisma.client.findMany({
      where: { companyId, status: 'ATIVO', deletedAt: null },
      select: { monthlyFee: true, startDate: true },
    });

    const totalClients = activeClients.length;
    const monthlyRevenue = activeClients.reduce(
      (acc, client) => acc + (client.monthlyFee || 0),
      0,
    );
    const averageTicket = totalClients > 0 ? monthlyRevenue / totalClients : 0;

    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59);

    const churnedThisYear = await this.prisma.client.count({
      where: {
        companyId,
        status: 'CHURN',
        endDate: { gte: yearStart, lte: yearEnd },
      },
    });

    const avgClients = totalClients > 0 ? totalClients : 1;
    const churnRate = (churnedThisYear / avgClients) * 100;

    return {
      totalClients,
      monthlyRevenue,
      averageTicket: Number(averageTicket.toFixed(2)),
      churnRate: Number(churnRate.toFixed(2)),
      churnedThisYear,
    };
  }

  // =================================================================
  // 📊 MÉTRICAS RESUMIDAS (KPIs do Dashboard Principal)
  // =================================================================

  async getMetrics(companyId: string): Promise<ClientMetrics> {
    const [
      totalClients,
      activeClients,
      prospectClients,
      churnedClients,
      totalMonthlyRevenue,
    ] = await Promise.all([
      this.prisma.client.count({
        where: { companyId, deletedAt: null },
      }),
      this.prisma.client.count({
        where: { companyId, deletedAt: null, status: 'ATIVO' },
      }),
      this.prisma.client.count({
        where: { companyId, deletedAt: null, status: 'PROSPECT' },
      }),
      this.prisma.client.count({
        where: { companyId, deletedAt: null, status: 'CHURN' },
      }),
      this.prisma.client.aggregate({
        where: { companyId, deletedAt: null, status: 'ATIVO' },
        _sum: { monthlyFee: true },
      }),
    ]);

    const churnRate = totalClients > 0
      ? (churnedClients / totalClients) * 100
      : 0;

    return {
      totalClients,
      activeClients,
      prospectClients,
      churnedClients,
      totalMonthlyRevenue: totalMonthlyRevenue._sum.monthlyFee || 0,
      churnRate: Math.round(churnRate * 10) / 10,
    };
  }

  // =================================================================
  // 📅 DADOS MENSAIS: Buscar histórico de um ano
  // =================================================================

  async getMonthlyData(companyId: string, year: number) {
    const data = await this.prisma.clientMonthlyData.findMany({
      where: { companyId, year },
      orderBy: { month: 'asc' },
    });

    if (data.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        initialClients: 0,
        newClients: 0,
        churnedClients: 0,
        finalClients: 0,
        newRevenue: 0,
        lostRevenue: 0,
        finalRevenue: 0,
        churnRate: 0,
        accumulatedChurn: 0,
      }));
    }

    return data;
  }

  // =================================================================
  // 💾 DADOS MENSAIS: Salvar ou Atualizar (Upsert)
  // =================================================================

  async upsertMonthlyData(
    companyId: string,
    userId: string,
    year: number,
    month: number,
    data: MonthlyDataPayload,
  ) {
    if (month < 1 || month > 12) {
      throw new BadRequestException('Mês deve estar entre 1 e 12.');
    }

    const initial = Number(data.initialClients) || 0;
    const newClients = Number(data.newClients) || 0;
    const churned = Number(data.churnedClients) || 0;
    const finalClients = initial + newClients - churned;

    const newRev = Number(data.newRevenue) || 0;
    const lostRev = Number(data.lostRevenue) || 0;
    const finalRevenue =
      data.finalRevenue !== undefined ? Number(data.finalRevenue) : 0;

    const churnRate = initial > 0 ? (churned / initial) * 100 : 0;
    const accumulatedChurn = churnRate;

    return this.prisma.clientMonthlyData.upsert({
      where: {
        companyId_year_month: { companyId, year, month },
      },
      update: {
        initialClients: initial,
        newClients: newClients,
        churnedClients: churned,
        finalClients: finalClients,
        newRevenue: newRev,
        lostRevenue: lostRev,
        finalRevenue: finalRevenue,
        churnRate: Number(churnRate.toFixed(2)),
        accumulatedChurn: Number(accumulatedChurn.toFixed(2)),
      },
      create: {
        companyId,
        userId,
        year,
        month,
        initialClients: initial,
        newClients: newClients,
        churnedClients: churned,
        finalClients: finalClients,
        newRevenue: newRev,
        lostRevenue: lostRev,
        finalRevenue: finalRevenue,
        churnRate: Number(churnRate.toFixed(2)),
        accumulatedChurn: Number(accumulatedChurn.toFixed(2)),
      },
    });
  }
}