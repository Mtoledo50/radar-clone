import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * =================================================================
 * 🏢 ClientService — Gestão de Clientes Enterprise
 * =================================================================
 * Serviço central para CRUD de clientes com arquitetura multi-tenant,
 * transações atômicas e compliance contábil (soft delete / histórico).
 * 
 * Princípios:
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
   * - Contratos ativos (com plano comercial)
   * - Serviços avulsos ativos (com item de serviço e categoria)
   * 
   * Essencial para a tabela do frontend exibir plano e add-ons.
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
          include: { serviceItem: { include: { category: true } } },
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
   * Fluxo:
   * 1. Cria o registro do cliente
   * 2. Se houver commercialPlanId → cria ClientContract ATIVO
   * 3. Se houver avulsoServiceIds → cria ClientService ATIVO
   *    (herdando recurrence + basePrice + startDate)
   * 
   * Garantias:
   * - Atomicidade: se qualquer passo falhar, nada é salvo
   * - Multi-tenant: companyId é injetado automaticamente
   */
  async create(companyId: string, userId: string, data: any) {
    // Extrai campos relacionais do payload
    const { commercialPlanId, avulsoServiceIds, ...clientData } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o cliente
      const newClient = await tx.client.create({
        data: {
          ...clientData,
          companyId,
          userId,
          startDate: clientData.startDate ? new Date(clientData.startDate) : new Date(),
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

      // ✅ 3. Cria serviços avulsos (CORRIGIDO - sem updateMany, com herança do catálogo)
      if (avulsoServiceIds && avulsoServiceIds.length > 0) {
        // Busca os ServiceItems do catálogo para herdar recurrence + basePrice
        const serviceItems = await tx.serviceItem.findMany({
          where: { id: { in: avulsoServiceIds }, deletedAt: null },
          select: { id: true, recurrence: true, basePrice: true },
        });

        await tx.clientService.createMany({
          data: serviceItems.map((item) => ({
            companyId,
            clientId: newClient.id,              // ✅ CORRIGIDO: era 'id'
            serviceItemId: item.id,
            recurrence: item.recurrence,          // ✅ Herda do catálogo
            customPrice: item.basePrice,          // ✅ Preço do catálogo
            status: 'ATIVO',
            startDate: newClient.startDate,       // ✅ OBRIGATÓRIO no schema
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
            include: { serviceItem: { include: { category: true } } },
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
   * Estratégia de histórico (compliance contábil):
   * - Contratos antigos são marcados como INATIVO (não deletados)
   * - Serviços antigos são marcados como INATIVO (não deletados)
   * - Novos contratos/serviços são criados como ATIVO
   * 
   * Isso preserva o histórico completo para auditoria e BI.
   */
  async update(id: string, companyId: string, data: any) {
    // Valida posse do cliente (multi-tenant)
    const existing = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Cliente não encontrado.');
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
        // Desativa contratos antigos (preserva histórico)
        await tx.clientContract.updateMany({
          where: { clientId: id, status: 'ATIVO' },
          data: { status: 'INATIVO', endDate: new Date() },
        });

        // Cria novo contrato ativo se houver plano
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

      // ✅ 3. Sincroniza serviços avulsos (CORRIGIDO - com herança do catálogo)
      if (avulsoServiceIds !== undefined) {
        // Desativa serviços avulsos antigos (preserva histórico)
        await tx.clientService.updateMany({
          where: { clientId: id, status: 'ATIVO' },
          data: { status: 'INATIVO' },
        });

        // Cria novos serviços avulsos com campos obrigatórios
        if (avulsoServiceIds.length > 0) {
          // Busca os ServiceItems do catálogo para herdar recurrence + basePrice
          const serviceItems = await tx.serviceItem.findMany({
            where: { id: { in: avulsoServiceIds }, deletedAt: null },
            select: { id: true, recurrence: true, basePrice: true },
          });

          await tx.clientService.createMany({
            data: serviceItems.map((item) => ({
              companyId,
              clientId: id,
              serviceItemId: item.id,
              recurrence: item.recurrence,          // ✅ Herda do catálogo
              customPrice: item.basePrice,          // ✅ Preço do catálogo
              status: 'ATIVO',
              startDate: updatedClient.startDate,   // ✅ OBRIGATÓRIO no schema
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
            include: { serviceItem: { include: { category: true } } },
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
   * 
   * Motivo: Compliance contábil exige preservar histórico de clientes
   * por pelo menos 5 anos (legislação brasileira).
   * 
   * Proteções:
   * - Validação multi-tenant (impede deleção cruzada)
   * - Desativa contrato e serviços vinculados
   */
  async delete(id: string, companyId: string) {
    // Valida posse do cliente
    const existing = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Desativa contratos ativos
      await tx.clientContract.updateMany({
        where: { clientId: id, status: 'ATIVO' },
        data: { status: 'INATIVO', endDate: now },
      });

      // 2. Desativa serviços avulsos ativos
      await tx.clientService.updateMany({
        where: { clientId: id, status: 'ATIVO' },
        data: { status: 'INATIVO' },
      });

      // 3. Soft delete do cliente (marca como CHURN)
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

  async getDashboard(companyId: string, year: number) {
    // 1. Buscar clientes ativos para MRR e Ticket Médio
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

    // 2. Calcular Churn do Ano
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

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
      averageTicket,
      churnRate: Number(churnRate.toFixed(2)),
      churnedThisYear,
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

    // Se não existir dados, retorna array de 12 meses com zeros
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
    data: any,
  ) {
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
