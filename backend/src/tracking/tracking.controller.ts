import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tracking')
export class TrackingController {
  constructor(private prisma: PrismaService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleTrackingEvent(@Body() payload: any) {
    // Payload esperado: { protocolo, canal, contatoId, tipoEvento, detalhes }
    // tipoEvento: 'enviado' | 'visualizado' | 'respondido' | 'concluido'

    const { protocolo, canal, contatoId, tipoEvento, detalhes } = payload;

    // 1. Busca ou cria o registro de envio
    let envio = await this.prisma.comunicacaoEnvio.findUnique({
      where: { protocolo },
    });

    if (!envio) {
      envio = await this.prisma.comunicacaoEnvio.create({
        data: {
          protocolo,
          canal: canal || 'whatsapp',
          contatoId: contatoId || null,
          conteudo: detalhes || 'Conteúdo não informado',
          status: tipoEvento,
        },
      });
    } else {
      // Atualiza o status do envio principal
      await this.prisma.comunicacaoEnvio.update({
        where: { id: envio.id },
        data: { status: tipoEvento },
      });
    }

    // 2. Registra o evento específico na linha do tempo
    await this.prisma.comunicacaoEvento.create({
      data: {
        envioId: envio.id,
        tipo: tipoEvento,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
      },
    });

    return { status: 'ok', message: 'Evento de tracking registrado com sucesso' };
  }
}