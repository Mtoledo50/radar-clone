// =================================================================
// F15 - ANÁLISE E CLASSIFICAÇÃO DE CONVERSAS
// =================================================================

import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, InternalServerErrorException, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analise')
export class AnaliseController {
  constructor(private prisma: PrismaService) {}
  /**
   * GET /analise/conversas
   * Lista conversas com filtros (usada pelo frontend de análise)
   */
  @Get('conversas')
  async getConversas(@Query('status') status?: string) {
    const where: any = {};
    
    if (status === 'pendente') {
      where.analise = { is: null }; // Sem análise = pendente
    } else if (status === 'classificado') {
      where.analise = { isNot: null }; // Tem análise = classificado
    }

    const interacoes = await this.prisma.memoriaInteracao.findMany({
      where,
      include: {
        contato: {
          select: {
            contatoId: true,
            nomeCliente: true,
            telefone: true,
          },
        },
        analise: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
      take: 50,
    });

    return { status: 'ok', data: interacoes };
  }
  /**
   * GET /analise/estatisticas
   * Retorna dados agregados para o dashboard (top tipos, gargalos, métricas)
   */
  @Get('estatisticas')
  async getEstatisticas() {
    try {
      // 1. Total de análises classificadas
      const totalClassificadas = await this.prisma.analiseConversa.count({
        where: { status: 'classificado' }
      });

      // 2. Total de pendentes (interações sem registro na tabela AnaliseConversa)
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
    } catch (error) {
      console.error('Erro ao buscar estatísticas de análise:', error);
      throw new InternalServerErrorException('Erro ao processar estatísticas.');
    }
  }

  /**
   * GET /analise/pendentes
   * Lista as últimas 50 interações que ainda não foram classificadas pelo humano.
   */
  @Get('pendentes')
  async getPendentes() {
    try {
      const interacoes = await this.prisma.memoriaInteracao.findMany({
        where: {
          analise: null, // Só traz as que ainda não têm registro na tabela AnaliseConversa
        },
        include: {
          contato: { 
            select: { 
              contatoId: true, 
              nomeCliente: true, // Adicionado para exibir o nome na tela
              ultimoAssunto: true 
            } 
          },
        },
        orderBy: { criadoEm: 'desc' },
        take: 50,
      });

      return { status: 'ok', data: interacoes };
    } catch (error) {
      console.error('Erro ao buscar interações pendentes:', error);
      throw new InternalServerErrorException('Erro ao listar pendentes.');
    }
  }

  /**
   * POST /analise/classificar/:interacaoId
   * Salva a classificação manual feita pelo usuário no Radar.
   */
  @UseGuards(JwtAuthGuard) // 🔒 Protege a rota
  @Post('classificar/:interacaoId')
  @HttpCode(HttpStatus.CREATED)
  async classificar(
    @Request() req,
    @Param('interacaoId') interacaoId: string,
    @Body() body: { tipo: string; complexidade: number; tempoGastoMin: number; observacao?: string }
  ) {
    const usuario = req.user; // { id, name, email, role, companyId }

    try {
      const analise = await this.prisma.analiseConversa.create({
        data: {
          interacaoId,
          tipo: body.tipo,
          complexidade: body.complexidade,
          tempoGastoMin: body.tempoGastoMin,
          observacao: body.observacao || null,
          status: 'classificado',
          analisadoPor: usuario.id, // ✅ USUÁRIO REAL DO JWT (não mais 'user_001')
        },
      });

      return { status: 'ok', message: 'Conversa classificada com sucesso!', data: analise };
    } catch (error) {
      console.error('Erro ao classificar conversa:', error);
      if (error.code === 'P2002') {
        return { status: 'error', message: 'Esta conversa já foi classificada anteriormente.' };
      }
      throw new InternalServerErrorException('Erro ao salvar classificação.');
    }
  }
}