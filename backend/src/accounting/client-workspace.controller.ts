import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
// ⚠️ Use o MESMO caminho de import do JwtAuthGuard que está no accounting.controller.ts
// (ex.: '../auth/jwt-auth.guard' ou '../auth/guards/jwt-auth.guard')
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PrismaService } from '../prisma/prisma.service';

/**
 * 🏢 ClientWorkspaceController — "Ficha do Cliente" (Bloco 7 / ADR-104)
 *
 * 🛡️ Multi-tenant: todas as queries filtram por companyId do usuário logado.
 * 🔐 @UseGuards(JwtAuthGuard) é OBRIGATÓRIO: é ele que popula req.user.
 */
@Controller('client-workspace')
@UseGuards(JwtAuthGuard)
export class ClientWorkspaceController {
  constructor(private readonly prisma: PrismaService) {}

  /** Retorna o cliente + lista de serviceCodes ativados no plano. */
  @Get(':clientId')
  async workspace(@Request() req: any, @Param('clientId') clientId: string) {
    const companyId = req.user.companyId;

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) return { success: false, message: 'Cliente não encontrado.' };

    const delegate = (this.prisma as any).clientServiceActivation;
    const acts = delegate
      ? await delegate.findMany({ where: { companyId, clientId } })
      : [];

    return {
      success: true,
      data: { client, activeServices: acts.map((a: any) => a.serviceCode) },
    };
  }

  /** Ativa/desativa um serviço do catálogo no plano do cliente. */
  @Post(':clientId/toggle')
  async toggle(
    @Request() req: any,
    @Param('clientId') clientId: string,
    @Body() body: { serviceCode: string; active: boolean },
  ) {
    const companyId = req.user.companyId;

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });
    if (!client) return { success: false, message: 'Cliente não encontrado.' };

    const delegate = (this.prisma as any).clientServiceActivation;
    if (!delegate) {
      return {
        success: false,
        message:
          'Modelo ClientServiceActivation ainda não migrado (aplique a migração do Bloco 7).',
      };
    }

    if (body.active) {
      await delegate.upsert({
        where: {
          companyId_clientId_serviceCode: {
            companyId,
            clientId,
            serviceCode: body.serviceCode,
          },
        },
        update: {},
        create: {
          companyId,
          clientId,
          serviceCode: body.serviceCode,
          activatedBy: req.user.id,
        },
      });
    } else {
      await delegate.deleteMany({
        where: { companyId, clientId, serviceCode: body.serviceCode },
      });
    }

    return { success: true };
  }
}