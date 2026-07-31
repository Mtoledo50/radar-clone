import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os clientes do usuário autenticado
   */
  async findAll(userId: string) {
    return this.prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cria um novo cliente
   */
  async create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        userId,
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.endDate ? 'INATIVO' : 'ATIVO',
      },
    });
  }

  /**
   * Atualiza um cliente existente
   */
  async update(userId: string, clientId: string, dto: CreateClientDto) {
    return this.prisma.client.update({
      where: { id: clientId, userId },
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.endDate ? 'INATIVO' : 'ATIVO',
      },
    });
  }

  /**
   * Remove um cliente
   */
  async remove(userId: string, clientId: string) {
    return this.prisma.client.delete({
      where: { id: clientId, userId },
    });
  }

  /**
   * Calcula métricas da carteira de clientes
   * - Total de clientes ativos
   - Faturamento mensal recorrente (soma dos monthlyFee dos ativos)
   - Clientes novos no mês
   - Ticket médio (faturamento / total ativos)
   */
  async getMetrics(userId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total de clientes ativos
    const totalActive = await this.prisma.client.count({
      where: { userId, status: 'ATIVO' },
    });

    // Total geral de clientes
    const totalClients = await this.prisma.client.count({
      where: { userId },
    });

    // Faturamento mensal recorrente (soma dos honorários dos ativos)
    const activeClients = await this.prisma.client.findMany({
      where: { userId, status: 'ATIVO' },
      select: { monthlyFee: true },
    });
    
    const monthlyRevenue = activeClients.reduce((sum, client) => sum + client.monthlyFee, 0);

    // Clientes novos no mês atual
    const newClientsThisMonth = await this.prisma.client.count({
      where: {
        userId,
        startDate: { gte: firstDayOfMonth },
      },
    });

    // Ticket médio
    const averageTicket = totalActive > 0 ? monthlyRevenue / totalActive : 0;

    return {
      totalActive,
      totalClients,
      monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
      newClientsThisMonth,
      averageTicket: parseFloat(averageTicket.toFixed(2)),
    };
  }
}