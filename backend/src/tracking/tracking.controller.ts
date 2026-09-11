// =================================================================
// F13 - TRACKING DE COMUNICAÇÕES
// Controller responsável por receber webhooks do sistema de envio
// e fornecer dados para o dashboard do Radar.
// =================================================================

import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tracking')
export class TrackingController {
  constructor(private prisma: PrismaService) {}

  /**
   * POST /tracking/webhook
   * Recebe eventos do sistema de envio (ex: enviado, visualizado, respondido).
   * Payload esperado: { protocolo, canal, contatoId, tipoEvento, detalhes }
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleTrackingEvent(@Body() payload: any) {
    const { protocolo, canal, contatoId, tipoEvento, detalhes } = payload;

    // 1. Lógica de "Upsert": Busca o registro de envio pelo protocolo único
    let envio = await this.prisma.comunicacaoEnvio.findUnique({
      where: { protocolo },
    });

    // 2. Se não existir, cria o registro inicial do envio
    if (!envio) {
      envio = await this.prisma.comunicacaoEnvio.create({
        data: {
          protocolo,
          canal: canal || 'whatsapp', // Fallback padrão
          contatoId: contatoId || null,
          conteudo: detalhes || 'Conteúdo não informado',
          status: tipoEvento,
        },
      });
    } else {
      // 3. Se já existe, apenas atualiza o status principal (ex: de 'enviado' para 'visualizado')
      await this.prisma.comunicacaoEnvio.update({
        where: { id: envio.id },
        data: { status: tipoEvento },
      });
    }

    // 4. Registra o evento específico na linha do tempo (histórico completo)
    await this.prisma.comunicacaoEvento.create({
      data: {
        envioId: envio.id,
        tipo: tipoEvento,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
      },
    });

    return { 
      status: 'ok', 
      message: 'Evento de tracking registrado com sucesso' 
    };
  }

  /**
   * GET /tracking/envios
   * Retorna a lista de todos os envios com seus respectivos eventos.
   * Usado pelo Frontend do Radar para montar o funil de comunicações.
   */
  @Get('envios')
  async getAllEnvios() {
    // Busca todos os envios, trazendo junto o array de 'eventos' de cada um
    const envios = await this.prisma.comunicacaoEnvio.findMany({
      include: {
        eventos: true, 
      },
      orderBy: {
        criadoEm: 'desc', // Mais recentes primeiro
      },
    });

    return { 
      status: 'ok', 
      data: envios 
    };
  }
}