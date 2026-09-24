// =================================================================
// 🎯 F17: CONTROLLER DE FILA E LOCKS DE CONVERSA
// =================================================================
import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

interface AssumirConversaDto {
  atendenteId: string;
  atendenteNome: string;
}

@Controller('fila')
export class FilaController {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // 🟢 BLOCO 1: POST /fila/assumir/:interacaoId
  // =========================================================================
  @Post('assumir/:interacaoId')
  @HttpCode(HttpStatus.OK)
  async assumirConversa(
    @Param('interacaoId') interacaoId: string,
    @Body() dto: AssumirConversaDto,
  ) {
    const lockExistente = await this.prisma.lockConversa.findUnique({
      where: { interacaoId },
    });

    if (lockExistente && lockExistente.status === 'ATIVO') {
      if (lockExistente.expiraEm > new Date()) {
        throw new BadRequestException({
          status: 'lock_ativo',
          message: `Esta conversa já está sendo atendida por ${lockExistente.atendenteNome}`,
        });
      }
    }

    const expiraEm = new Date(Date.now() + 30 * 60 * 1000);

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
      data: { lockId: lock.id, expiraEm: lock.expiraEm, minutosRestantes: 30 },
    };
  }

  // =========================================================================
  //  BLOCO 2: POST /fila/liberar/:interacaoId
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
  // =========================================================================
  @Get('status')
  async getStatusFila() {
    const locksAtivos = await this.prisma.lockConversa.findMany({
      where: { status: 'ATIVO', expiraEm: { gt: new Date() } },
      include: {
        interacao: {
          select: {
            id: true, conteudo: true, canal: true, criadoEm: true,
            contato: { select: { contatoId: true, telefone: true } },
          },
        },
      },
      orderBy: { bloqueadoEm: 'desc' },
    });

    const porAtendente = locksAtivos.reduce((acc: any, lock: any) => {
      const nome = lock.atendenteNome;
      if (!acc[nome]) acc[nome] = [];
      acc[nome].push({
        lockId: lock.id, interacaoId: lock.interacaoId,
        contato: lock.interacao.contato?.contatoId || 'Desconhecido',
        canal: lock.interacao.canal, bloqueadoEm: lock.bloqueadoEm,
        expiraEm: lock.expiraEm,
        minutosRestantes: Math.ceil((lock.expiraEm.getTime() - Date.now()) / 60000),
      });
      return acc;
    }, {});

    return { status: 'ok', data: { totalLocksAtivos: locksAtivos.length, porAtendente, locks: locksAtivos } };
  }

  // =========================================================================
  //  BLOCO 4: GET /fila/disponiveis
  // =========================================================================
  @Get('disponiveis')
  async getConversasDisponiveis() {
    const interacoes = await this.prisma.memoriaInteracao.findMany({
      take: 20, orderBy: { criadoEm: 'desc' },
      where: { lock: { is: null } },
      include: {
        contato: { select: { contatoId: true, telefone: true, documento: true } },
      },
    });

    return { status: 'ok', data: { total: interacoes.length, interacoes } };
  }

  // =========================================================================
  //  BLOCO 5: GET /fila/conversa/:interacaoId
  // ✅ CORREÇÃO: Retorna APENAS a conversa atual (a interação específica)
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Get('conversa/:interacaoId')
  async getConversaDetalhes(@Param('interacaoId') interacaoId: string) {
    // 1. Busca a interação específica (a conversa atual)
    const interacaoAtual = await this.prisma.memoriaInteracao.findUnique({
      where: { id: interacaoId },
      include: {
        contato: {
          select: {
            contatoId: true, nomeCliente: true, telefone: true, documento: true,
          },
        },
      },
    });

    if (!interacaoAtual) {
      throw new BadRequestException('Conversa não encontrada');
    }

    // 2. Busca APENAS as mensagens da mesma "sessão" (mesmo dia ou gap < 1 hora)
    // Para simplificar: retorna apenas a interação atual + mensagens do mesmo dia
    const inicioDoDia = new Date(interacaoAtual.criadoEm);
    inicioDoDia.setHours(0, 0, 0, 0);
    const fimDoDia = new Date(interacaoAtual.criadoEm);
    fimDoDia.setHours(23, 59, 59, 999);

    const mensagensDaSessao = await this.prisma.memoriaInteracao.findMany({
      where: {
        contatoId: interacaoAtual.contatoId,
        criadoEm: { gte: inicioDoDia, lte: fimDoDia },
      },
      orderBy: { criadoEm: 'asc' },
    });

    // 3. Formata as mensagens
    const mensagens = mensagensDaSessao.map((msg) => ({
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
          id: interacaoAtual.id,
          canal: interacaoAtual.canal,
          criadoEm: interacaoAtual.criadoEm,
          contato: interacaoAtual.contato,
        },
        mensagens,
      },
    };
  }

  // =========================================================================
  // 🟠 BLOCO 6: POST /fila/conversa/:interacaoId/mensagem
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Post('conversa/:interacaoId/mensagem')
  async enviarMensagem(
    @Request() req: any,
    @Param('interacaoId') interacaoId: string,
    @Body() body: { conteudo: string },
  ) {
    const usuario = req.user || { id: 'system', name: 'Sistema' };

    const interacaoOriginal = await this.prisma.memoriaInteracao.findUnique({
      where: { id: interacaoId },
      select: { contatoId: true, canal: true },
    });

    if (!interacaoOriginal) {
      throw new BadRequestException('Conversa não encontrada');
    }

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
          id: novaMensagem.id, conteudo: novaMensagem.conteudo,
          remetente: 'atendente', criadoEm: novaMensagem.criadoEm,
        },
      },
    };
  }

  // =========================================================================
  // 🟢 BLOCO 7: GET /fila/historico/:contatoId
  // ✅ CORREÇÃO: Retorna conversas anteriores agrupadas por dia
  // =========================================================================
  @UseGuards(JwtAuthGuard)
  @Get('historico/:contatoId')
  async getHistoricoCliente(@Param('contatoId') contatoId: string) {
    try {
      // Busca TODAS as interações do contato, ordenadas por data (mais recente primeiro)
      const todasInteracoes = await this.prisma.memoriaInteracao.findMany({
        where: { contatoId },
        orderBy: { criadoEm: 'desc' },
        include: {
          lock: { select: { status: true, atendenteNome: true } },
        },
      });

      // Agrupa por DIA (cada dia = uma "conversa" no histórico)
      const conversasPorDia: Record<string, any[]> = {};
      
      for (const interacao of todasInteracoes) {
        const dia = new Date(interacao.criadoEm).toLocaleDateString('pt-BR');
        if (!conversasPorDia[dia]) {
          conversasPorDia[dia] = [];
        }
        conversasPorDia[dia].push(interacao);
      }

      // Converte em array de conversas (uma por dia)
      const historico = Object.entries(conversasPorDia).map(([dia, interacoes]) => {
        const primeiraInteracao = interacoes[interacoes.length - 1]; // mais antiga do dia
        const ultimaInteracao = interacoes[0]; // mais recente do dia
        
        return {
          id: primeiraInteracao.id,
          assunto: (primeiraInteracao.metadata as any)?.assunto || 'Conversa',
          departamento: primeiraInteracao.canal,
          criadoEm: primeiraInteracao.criadoEm,
          ultimaMensagem: ultimaInteracao.conteudo,
          status: ultimaInteracao.lock?.status || 'CONCLUIDO',
          totalMensagens: interacoes.length,
          dia: dia,
        };
      });

      // Remove a conversa atual (o dia de hoje, se houver)
      const hoje = new Date().toLocaleDateString('pt-BR');
      const historicoFiltrado = historico.filter(h => h.dia !== hoje);

      return {
        status: 'ok',
        data: historicoFiltrado.slice(0, 5), // Últimas 5 conversas
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return { status: 'error', message: 'Erro ao buscar histórico', data: [] };
    }
  }
}