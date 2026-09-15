// =================================================================
// 🎯 F17: CONTROLLER DE FILA E LOCKS DE CONVERSA
// Gerencia a distribuição de conversas entre atendentes
// =================================================================

import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
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
}