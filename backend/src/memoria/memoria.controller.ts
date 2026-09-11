// =================================================================
// F14 - MEMÓRIA PERMANENTE DO CLIENTE
// Controller para registrar interações e consultar histórico
// =================================================================

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('memoria')
export class MemoriaController {
  constructor(private prisma: PrismaService) {}

  /**
   * POST /memoria/interacao
   * Registra uma nova interação (mensagem, evento, classificação)
   * Cria o perfil do cliente automaticamente se não existir
   */
  @Post('interacao')
  @HttpCode(HttpStatus.CREATED)
  async registrarInteracao(@Body() payload: any) {
    const { contatoId, documento, tipo, conteudo, metadata, assunto } = payload;

    // 1. Busca ou cria o perfil unificado do contato
    let contato = await this.prisma.memoriaContato.findUnique({
      where: { contatoId },
    });

    if (!contato) {
      contato = await this.prisma.memoriaContato.create({
        data: {
          contatoId,
          documento: documento || null,
          ultimoAssunto: assunto || null,
        },
      });
    } else {
      // Atualiza o último assunto se informado
      if (assunto) {
        await this.prisma.memoriaContato.update({
          where: { id: contato.id },
          data: { ultimoAssunto: assunto },
        });
      }
    }

    // 2. Registra a interação na linha do tempo
    const interacao = await this.prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id,
        tipo: tipo || 'mensagem',
        conteudo,
        metadata: metadata || null,
      },
    });

    return { 
      status: 'ok', 
      message: 'Interação registrada com sucesso',
      data: { contato: contato.contatoId, interacaoId: interacao.id }
    };
  }

  /**
   * GET /memoria/:contatoId
   * Retorna o perfil completo do cliente com histórico de interações
   * Usado pelo Bot para consultar contexto antes de responder
   */
  @Get(':contatoId')
  async getHistorico(@Param('contatoId') contatoId: string) {
    const contato = await this.prisma.memoriaContato.findUnique({
      where: { contatoId },
      include: {
        interacoes: {
          orderBy: { criadoEm: 'desc' },
          take: 20, // Últimas 20 interações
        },
      },
    });

    if (!contato) {
      return { status: 'not_found', message: 'Cliente não encontrado na memória' };
    }

    return { 
      status: 'ok', 
      data: {
        perfil: {
          contatoId: contato.contatoId,
          documento: contato.documento,
          ultimoAssunto: contato.ultimoAssunto,
          totalInteracoes: contato.interacoes.length,
        },
        historico: contato.interacoes,
      }
    };
  }
}