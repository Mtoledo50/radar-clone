// =================================================================
// F15 - ANÁLISE E CLASSIFICAÇÃO DE CONVERSAS
// =================================================================

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analise')
export class AnaliseController {
  constructor(private prisma: PrismaService) {}
  /**
   * GET /analise/estatisticas
   * Retorna dados agregados para o dashboard (top tipos, gargalos, métricas)
   */
  @Get('estatisticas')
  async getEstatisticas() {
    // 1. Total de análises classificadas
    const totalClassificadas = await this.prisma.analiseConversa.count({
      where: { status: 'classificado' }
    });

    // 2. Total de pendentes
    const totalPendentes = await this.prisma.memoriaInteracao.count({
      where: { analise: null }
    });

    // 3. Top tipos de pedidos (agrupados)
    const topTipos = await this.prisma.analiseConversa.groupBy({
      by: ['tipo'],
      _count: { tipo: true },
      _avg: { tempoGastoMin: true },
      orderBy: { _count: { tipo: 'desc' } },
      take: 10,
      where: { status: 'classificado' }
    });

    // 4. Calcula porcentagens e formata
    const tiposFormatados = topTipos.map(item => ({
      tipo: item.tipo,
      quantidade: item._count.tipo,
      porcentagem: totalClassificadas > 0 
        ? Math.round((item._count.tipo / totalClassificadas) * 100) 
        : 0,
      tempoMedioMin: Math.round(item._avg.tempoGastoMin || 0)
    }));

    return {
      status: 'ok',
      data: {
        totalClassificadas,
        totalPendentes,
        topTipos: tiposFormatados,
        gargalos: tiposFormatados
          .filter(t => t.tempoMedioMin > 20) // Gargalos = tempo médio > 20 min
          .sort((a, b) => b.tempoMedioMin - a.tempoMedioMin)
      }
    };
  }
  /**
   * GET /analise/pendentes
   * Lista as últimas 50 interações que ainda não foram classificadas pelo humano.
   */
  @Get('pendentes')
  async getPendentes() {
    const interacoes = await this.prisma.memoriaInteracao.findMany({
      where: {
        analise: null, // Só traz as que ainda não têm registro na tabela AnaliseConversa
      },
      include: {
        contato: { select: { contatoId: true, ultimoAssunto: true } },
      },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });

    return { status: 'ok', data: interacoes };
  }

  /**
   * POST /analise/classificar/:interacaoId
   * Salva a classificação manual feita pelo usuário no Radar.
   */
  @Post('classificar/:interacaoId')
  @HttpCode(HttpStatus.CREATED)
  async classificar(
    @Param('interacaoId') interacaoId: string,
    @Body() body: { tipo: string; complexidade: number; tempoGastoMin: number; observacao?: string }
  ) {
    const analise = await this.prisma.analiseConversa.create({
      data: {
        interacaoId,
        tipo: body.tipo,
        complexidade: body.complexidade,
        tempoGastoMin: body.tempoGastoMin,
        observacao: body.observacao || null,
        status: 'classificado',
      },
    });

    return { status: 'ok', message: 'Conversa classificada com sucesso!', data: analise };
  }
}