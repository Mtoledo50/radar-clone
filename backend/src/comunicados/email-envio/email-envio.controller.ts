// ============================================================================
// SPRINT F13 + F17-A — EmailEnvioController
//
// Endpoints:
//   GET  /api/email-envios                 lista com filtros + paginação
//   GET  /api/email-envios/:id             detalhe com timeline completa
//   POST /api/email-envios/:id/reenviar    🆕 F17-A: reenvio manual
// ============================================================================
import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusEnvio } from '@prisma/client';
import { EmailRetryService } from './email-retry.service';

@Controller('api/email-envios')
export class EmailEnvioController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retryService: EmailRetryService, // 🆕 F17-A
  ) {}

  /**
   * Lista envios com filtros e paginação.
   */
  @Get()
  async listar(
    @Query('status') status?: StatusEnvio,
    @Query('clienteId') clienteId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const pp = perPage ? parseInt(perPage, 10) : 20;
    const skip = (p - 1) * pp;

    const where: any = {};
    if (status) where.status = status;
    if (clienteId) where.clienteId = clienteId;

    const [data, total] = await Promise.all([
      this.prisma.emailEnvio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pp,
        include: {
          eventos: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      }),
      this.prisma.emailEnvio.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: p,
        perPage: pp,
        total,
        totalPages: Math.ceil(total / pp),
      },
    };
  }

  /**
   * Detalhe de um envio específico (com todos os eventos).
   */
  @Get(':id')
  async detalhe(@Param('id') id: string) {
    return this.prisma.emailEnvio.findUnique({
      where: { id },
      include: {
        eventos: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  /**
   * 🆕 F17-A — Reenvio manual imediato (ignora backoff e limite de retries).
   * Usado pelo botão "Reenviar" na tela de envios quando um email falhou.
   */
  @Post(':id/reenviar')
  async reenviar(@Param('id') id: string) {
    return this.retryService.reenviarManual(id);
  }
}