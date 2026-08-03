// =================================================================
// INÍCIO: client.service.ts
// =================================================================
/**
 * ClientService
 * Gerencia a carteira de clientes, incluindo CRUD e métricas de dashboard (MRR, Churn).
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // INÍCIO: Método findAll
  // =================================================================
  /**
   * Lista todos os clientes da empresa, ordenados por nome.
   */
  async findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId },
      orderBy: { companyName: 'asc' },
    });
  }
  // =================================================================
  // FIM: Método findAll
  // =================================================================

  // =================================================================
  // INÍCIO: Método create
  // =================================================================
  /**
   * Cria um novo cliente na carteira.
   */
  async create(companyId: string, userId: string, data: any) {
    return this.prisma.client.create({
      data: {
        ...data,
        companyId,
        userId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
  // =================================================================
  // FIM: Método create
  // =================================================================

  // =================================================================
  // INÍCIO: Método update
  // =================================================================
  /**
   * Atualiza os dados de um cliente existente.
   */
  async update(id: string, data: any) {
    return this.prisma.client.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
  // =================================================================
  // FIM: Método update
  // =================================================================

  // =================================================================
  // INÍCIO: Método delete
  // =================================================================
  /**
   * Remove um cliente da carteira.
   */
  async delete(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }
  // =================================================================
  // FIM: Método delete
  // =================================================================

  // =================================================================
  // INÍCIO: Método getDashboard (NOVO - Para métricas MRR/Churn)
  // =================================================================
  /**
   * Retorna métricas da carteira de clientes:
   * - Total de clientes
   * - Clientes ativos e inativos
   * - MRR (Monthly Recurring Revenue)
   * - Taxa de Churn
   * - Ticket Médio
   */
  async getDashboard(companyId: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
    });

    const total = clients.length;
    const active = clients.filter((c) => c.status === 'ATIVO').length;
    const inactive = clients.filter((c) => c.status === 'INATIVO' || c.status === 'CHURN').length;

    // MRR: Soma dos honorários mensais dos clientes ativos
    const mrr = clients
      .filter((c) => c.status === 'ATIVO')
      .reduce((sum, c) => sum + (c.monthlyFee || 0), 0);

    // Churn Rate: Percentual de clientes inativos em relação ao total
    const churnRate = total > 0 ? (inactive / total) * 100 : 0;

    // Ticket Médio: MRR dividido pelo número de clientes ativos
    const averageTicket = active > 0 ? mrr / active : 0;

    return {
      total,
      active,
      inactive,
      mrr: Math.round(mrr * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      averageTicket: Math.round(averageTicket * 100) / 100,
    };
  }
  // =================================================================
  // FIM: Método getDashboard
  // =================================================================
}
// =================================================================
// FIM: client.service.ts
// =================================================================