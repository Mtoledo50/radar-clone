/**
 * =================================================================
 * NotificationsService — CRUD + seed de notificações
 * =================================================================
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Lista notificações do tenant (não lidas primeiro) */
  async list(companyId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { companyId },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  /** Conta não lidas */
  async countUnread(companyId: string) {
    return this.prisma.notification.count({
      where: { companyId, read: false },
    });
  }

  /** Marca uma como lida */
  async markAsRead(id: string, companyId: string) {
    return this.prisma.notification.updateMany({
      where: { id, companyId },
      data: { read: true, readAt: new Date() },
    });
  }

  /** Marca todas como lidas */
  async markAllAsRead(companyId: string) {
    return this.prisma.notification.updateMany({
      where: { companyId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  /** Cria uma notificação (usado por outros módulos futuramente) */
  async create(data: {
    companyId: string;
    userId?: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  /** Seed de notificações demo (para testes visuais) */
  async seedDemo(companyId: string) {
    const now = new Date();
    const demo = [
      {
        type: 'BILLING_OVERDUE' as NotificationType,
        title: 'Cobrança vencida',
        message: 'A cobrança de R$ 320,50 do Cliente Regua Aurora venceu há 3 dias.',
        link: '/dashboard/funcionario-digital/cobranca',
        createdAt: new Date(now.getTime() - 3 * 86400000),
      },
      {
        type: 'GUIDE_DUE' as NotificationType,
        title: 'Guia DAS próxima do vencimento',
        message: 'A guia DAS de agosto/2026 vence em 5 dias (R$ 660,00).',
        link: '/dashboard/funcionario-digital/guias',
        createdAt: new Date(now.getTime() - 1 * 86400000),
      },
      {
        type: 'TASK_OVERDUE' as NotificationType,
        title: 'Tarefa atrasada',
        message: 'A tarefa "Fechar contabilidade agosto" está 2 dias atrasada.',
        link: '/dashboard/tarefas',
        createdAt: new Date(now.getTime() - 2 * 86400000),
      },
      {
        type: 'PROPOSAL_VIEWED' as NotificationType,
        title: 'Proposta visualizada',
        message: 'O cliente Academia do Renan visualizou sua proposta comercial.',
        link: '/dashboard/precificacao',
        createdAt: new Date(now.getTime() - 30 * 60000),
      },
      {
        type: 'SYSTEM' as NotificationType,
        title: 'Bem-vindo à Fase E! 🎉',
        message: 'Command Palette (Ctrl+K), Onde Parou e Notificações estão ativos.',
        link: null,
        createdAt: new Date(now.getTime() - 5 * 60000),
      },
    ];

    const created = [];
    for (const n of demo) {
      created.push(
        await this.prisma.notification.create({
          data: { companyId, ...n },
        }),
      );
    }
    return created;
  }
}