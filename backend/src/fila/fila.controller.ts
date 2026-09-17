// =================================================================
// 🎯 F17: CONTROLLER DE FILA E LOCKS DE CONVERSA
// Gerencia a distribuição de conversas entre atendentes
// =================================================================
import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

// 🔵 DTO: Dados que o frontend envia ao assumir uma conversa
interface AssumirConversaDto {
  atendenteId: string;
  atendenteNome: string;
}

@Controller('fila')
export class FilaController {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // 🟢 BLOCO 1: POST /fila/assumir/:interacaoId
  // Quando o atendente clica em "Atender", ele assume o lock da conversa
  // =========================================================================
  @Post('assumir/:interacaoId')
  @HttpCode(HttpStatus.OK)
  async assumirConversa(
    @Param('interacaoId') interacaoId: string,
    @Body() dto: AssumirConversaDto,
  ) {
    // 1. Verifica se já existe um lock ATIVO para essa interação
    const lockExistente = await this.prisma.lockConversa.findUnique({
      where: { interacaoId },
    });

    // 2. Se existe e está ATIVO, verifica se não expirou
    if (lockExistente && lockExistente.status === 'ATIVO') {
      if (lockExistente.expiraEm > new Date()) {
        throw new BadRequestException({
          status: 'lock_ativo',
          message: `Esta conversa já está sendo atendida por ${lockExistente.atendenteNome}`,
          data: {
            atendente: lockExistente.atendenteNome,
            expiraEm: lockExistente.expiraEm,
          },
        });
      }
    }

    // 3. Calcula a expiração (30 minutos a partir de agora)
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000);

    // 4. Cria ou atualiza o lock
    const lock = await this.prisma.lockConversa.upsert({
      where: { interacaoId },
      update: {
        atendenteId: dto.atendenteId,
        atendenteNome: dto.atendenteNome,
        expiraEm,
        status: 'ATIVO',
        bloqueadoEm: new Date(),
      },
      create: {
        interacaoId,
        atendenteId: dto.atendenteId,
        atendenteNome: dto.atendenteNome,
        expiraEm,
        status: 'ATIVO',
        bloqueadoEm: new Date(),
      },
    });

    return {
      status: 'ok',
      message: `Conversa assumida por ${dto.atendenteNome}`,
      data: {
        lockId: lock.id,
        expiraEm: lock.expiraEm,
        minutosRestantes: 30,
      },
    };
  }

  // =========================================================================
  // 🟡 BLOCO 2: POST /fila/liberar/:interacaoId
  // Atendente termina o atendimento e libera a conversa
  // =========================================================================
  @Post('liberar/:interacaoId')
  @HttpCode(HttpStatus.OK)
  async liberarConversa(@Param('interacaoId') interacaoId: string) {
    await this.prisma.lockConversa.update({
      where: { interacaoId },
      data: { status: 'LIBERADO' },
    });

    return { status: 'ok', message: 'Conversa liberada com sucesso' };
  }

  // =========================================================================
  // 🔵 BLOCO 3: GET /fila/status
  // Lista todas as conversas travadas no momento (visão do gestor)
  // =========================================================================
  @Get('status')
  async getStatusFila() {
    const locksAtivos = await this.prisma.lockConversa.findMany({
      where: {
        status: 'ATIVO',
        expiraEm: { gt: new Date() },
      },
      include: {
        interacao: {
          select: {
            id: true,
            conteudo: true,
            canal: true,
            criadoEm: true,
            contato: {
              select: {
                contatoId: true,
                telefone: true,
              },
            },
          },
        },
      },
      orderBy: { bloqueadoEm: 'desc' },
    });

    const porAtendente = locksAtivos.reduce((acc: any, lock: any) => {
      const nome = lock.atendenteNome;
      if (!acc[nome]) acc[nome] = [];
      acc[nome].push({
        lockId: lock.id,
        interacaoId: lock.interacaoId,
        contato: lock.interacao.contato?.contatoId || 'Desconhecido',
        canal: lock.interacao.canal,
        bloqueadoEm: lock.bloqueadoEm,
        expiraEm: lock.expiraEm,
        minutosRestantes: Math.ceil((lock.expiraEm.getTime() - Date.now()) / 60000),
      });
      return acc;
    }, {});

    return {
      status: 'ok',
      data: {
        totalLocksAtivos: locksAtivos.length,
        porAtendente,
        locks: locksAtivos,
      },
    };
  }

  // =========================================================================
  // 🟣 BLOCO 4: GET /fila/disponiveis
  // Lista conversas que ainda NÃO estão travadas (para distribuição)
  // =========================================================================
  @Get('disponiveis')
  async getConversasDisponiveis() {
    const interacoes = await this.prisma.memoriaInteracao.findMany({
      take: 20,
      orderBy: { criadoEm: 'desc' },
      where: {
        lock: {
          is: null,
        },
      },
      include: {
        contato: {
          select: {
            contatoId: true,
            telefone: true,
            documento: true,
          },
        },
      },
    });

    return {
      status: 'ok',
      data: {
        total: interacoes.length,
        interacoes,
      },
    };
  }

  // =========================================================================
  //  BLOCO 5: GET /fila/conversa/:interacaoId
  // Busca detalhes completos de uma conversa (histórico + contato)
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Get('conversa/:interacaoId')
  async getConversaDetalhes(@Param('interacaoId') interacaoId: string) {
    // 1. Busca a interação inicial para pegar os dados do contato
    const interacao = await this.prisma.memoriaInteracao.findUnique({
      where: { id: interacaoId },
      include: {
        contato: {
          select: {
            contatoId: true,
            nomeCliente: true,
            telefone: true,
            documento: true,
          },
        },
      },
    });

    if (!interacao) {
      throw new BadRequestException('Conversa não encontrada');
    }

    // 2. Busca TODAS as mensagens desse contato (histórico completo em ordem cronológica)
    const mensagensDoContato = await this.prisma.memoriaInteracao.findMany({
      where: { contatoId: interacao.contatoId },
      orderBy: { criadoEm: 'asc' },
    });

    // 3. Formata as mensagens para o frontend
    const mensagens = mensagensDoContato.map((msg) => ({
      id: msg.id,
      conteudo: msg.conteudo,
      remetente: (msg.metadata as any)?.remetente === 'atendente' ? 'atendente' : 'cliente',
      criadoEm: msg.criadoEm,
      canal: msg.canal,
    }));

    return {
      status: 'ok',
      data: {
        interacao: {
          id: interacao.id,
          canal: interacao.canal,
          criadoEm: interacao.criadoEm,
          contato: interacao.contato,
        },
        mensagens,
      },
    };
  }

  // =========================================================================
  // 🟠 BLOCO 6: POST /fila/conversa/:interacaoId/mensagem
  // Envia uma mensagem do atendente para o cliente
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Post('conversa/:interacaoId/mensagem')
  async enviarMensagem(
    @Request() req: any,
    @Param('interacaoId') interacaoId: string,
    @Body() body: { conteudo: string },
  ) {
    // Fallback seguro caso o JWT não tenha populado o req.user
    const usuario = req.user || { id: 'system', name: 'Sistema' };

    // Busca o contato para criar nova interação
    const interacaoOriginal = await this.prisma.memoriaInteracao.findUnique({
      where: { id: interacaoId },
      select: { contatoId: true, canal: true },
    });

    if (!interacaoOriginal) {
      throw new BadRequestException('Conversa não encontrada');
    }

    // Cria nova mensagem (resposta do atendente)
    const novaMensagem = await this.prisma.memoriaInteracao.create({
      data: {
        contatoId: interacaoOriginal.contatoId,
        tipo: 'mensagem',
        conteudo: body.conteudo,
        canal: interacaoOriginal.canal,
        metadata: {
          remetente: 'atendente',
          atendenteId: usuario.id,
          atendenteNome: usuario.name,
        },
      },
    });

    return {
      status: 'ok',
      data: {
        mensagem: {
          id: novaMensagem.id,
          conteudo: novaMensagem.conteudo,
          remetente: 'atendente',
          criadoEm: novaMensagem.criadoEm,
        },
      },
    };
  }

  // =========================================================================
  // 🟢 BLOCO 7: GET /fila/historico/:contatoId
  // Busca histórico de conversas do cliente (excluindo a atual)
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Get('historico/:contatoId')
  async getHistoricoCliente(@Param('contatoId') contatoId: string) {
    try {
      // Busca todas as interações do contato, ordenadas por data (mais recente primeiro)
      const interacoes = await this.prisma.memoriaInteracao.findMany({
        where: { 
          contatoId: contatoId,
        },
        orderBy: { criadoEm: 'desc' },
        take: 10, // Limita às 10 mais recentes
        include: {
          lock: {
            select: {
              status: true,
              atendenteNome: true,
            },
          },
        },
      });

      // Agrupa conversas por "sessão" (baseado em gaps de tempo > 1 hora)
      const conversasAgrupadas = interacoes.reduce((acc: any[], interacao) => {
        const ultimaConversa = acc[acc.length - 1];
        const gapHoras = ultimaConversa 
          ? (new Date(ultimaConversa.criadoEm).getTime() - new Date(interacao.criadoEm).getTime()) / (1000 * 60 * 60)
          : 999;

        if (gapHoras > 1) {
          // Nova conversa (gap > 1 hora)
          acc.push({
            id: interacao.id,
            criadoEm: interacao.criadoEm,
            ultimaMensagem: interacao.conteudo,
            departamento: interacao.canal,
            status: interacao.lock?.status || 'CONCLUIDO',
            totalMensagens: 1,
          });
        } else {
          // Mesma conversa - atualiza a última mensagem
          if (ultimaConversa) {
            ultimaConversa.ultimaMensagem = interacao.conteudo;
            ultimaConversa.totalMensagens++;
          }
        }

        return acc;
      }, []);

      return {
        status: 'ok',
        data: conversasAgrupadas.slice(0, 5), // Retorna as 5 conversas mais recentes
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        status: 'error',
        message: 'Erro ao buscar histórico do cliente',
        data: [],
      };
    }
  }
}