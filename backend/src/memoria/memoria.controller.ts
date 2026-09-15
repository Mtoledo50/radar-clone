// =================================================================
// F14/F16 - MEMÓRIA PERMANENTE & UNIFICAÇÃO MULTI-CANAL
// Controller para registrar interações, consultar histórico e unificar canais
// =================================================================

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('memoria')
export class MemoriaController {
  constructor(private prisma: PrismaService) {}

  /**
   * POST /memoria/interacao
   * Mantido para compatibilidade com testes anteriores (F14)
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
      if (assunto) {
        await this.prisma.memoriaContato.update({
          where: { id: contato.id },
          data: { ultimoAssunto: assunto },
        });
      }
    }

    // 2. Registra a interação na linha do tempo (com canal padrão para compatibilidade)
    const interacao = await this.prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id,
        tipo: tipo || 'mensagem',
        conteudo,
        canal: 'WHATSAPP', // Padrão F14
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
   * POST /memoria/unificar
   * 🆕 F16: Ponto de entrada único para sistemas externos (Komunic, API própria).
   * Unifica o histórico baseado no documento ou telefone, registrando o canal de origem.
   */
  @Post('unificar')
  @HttpCode(HttpStatus.CREATED)
  async unificarMensagem(@Body() payload: any) {
    // =========================================================================
    // 🟢 BLOCO 1: EXTRAÇÃO DE DADOS DO PAYLOAD
    // Aqui recebemos os dados que o sistema externo (ex: Komunic) enviou.
    // Você pode adicionar novos campos aqui no futuro sem quebrar o código.
    // =========================================================================
    const { 
      documento, 
      telefone, 
      canal, // Ex: 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK'
      canalExternoId, // Ex: ID da mensagem no Instagram ou WhatsApp
      conteudo, 
      tipo = 'mensagem',
      metadata 
    } = payload;

    // =========================================================================
    // 🔵 BLOCO 2: BUSCA DO CLIENTE EXISTENTE
    // Procuramos no banco se já existe alguém com esse documento OU telefone.
    // =========================================================================
    let contato = await this.prisma.memoriaContato.findFirst({
      where: {
        OR: [
          { documento: documento },
          { telefone: telefone }
        ]
      }
    });

    // =========================================================================
    // 🟡 BLOCO 3: CRIAÇÃO DE NOVO PERFIL (Se o cliente não for encontrado)
    // ⚠️ ATENÇÃO: A ordem abaixo define qual será o "ID Mestre" (contatoId).
    // Priorizamos o TELEFONE, depois o DOCUMENTO. Assim, buscar pelo telefone funciona.
    // =========================================================================
    if (!contato) {
      const novoContatoId = telefone || documento || `anonimo_${Date.now()}`;
      
      contato = await this.prisma.memoriaContato.create({
        data: {
          contatoId: novoContatoId, // O ID mestre de busca
          documento: documento || null,
          telefone: telefone || null,
          // Salva o ID específico do canal de origem, se for Instagram ou Facebook
          ...(canal === 'INSTAGRAM' && { instagramId: canalExternoId }),
          ...(canal === 'FACEBOOK' && { facebookId: canalExternoId }),
        }
      });
    } 
    // =========================================================================
    // 🟠 BLOCO 4: ATUALIZAÇÃO DE DADOS (Se o cliente JÁ existe)
    // Se ele já existe, apenas preenchemos os campos de canal que estiverem vazios.
    // =========================================================================
    else {
      const updateData: any = {};
      if (canal === 'INSTAGRAM' && !contato.instagramId) updateData.instagramId = canalExternoId;
      if (canal === 'FACEBOOK' && !contato.facebookId) updateData.facebookId = canalExternoId;
      if (telefone && !contato.telefone) updateData.telefone = telefone;

      // Só faz o update no banco se houver algo novo para salvar
      if (Object.keys(updateData).length > 0) {
        await this.prisma.memoriaContato.update({
          where: { id: contato.id },
          data: updateData
        });
      }
    }

    // =========================================================================
    // 🔴 BLOCO 5: REGISTRO DA INTERAÇÃO NA LINHA DO TEMPO
    // Aqui salvamos a mensagem em si, vinculada ao ID do contato (UUID interno).
    // =========================================================================
    const interacao = await this.prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id, // Vincula ao UUID interno do Prisma
        canal: canal ? canal.toUpperCase() : 'WHATSAPP', // Salva o canal em maiúsculo
        canalExternoId: canalExternoId || null,
        tipo,
        conteudo,
        metadata: metadata || null,
      }
    });

    // =========================================================================
    // 🟣 BLOCO 6: RESPOSTA FINAL PARA O SISTEMA EXTERNO
    // =========================================================================
    return { 
      status: 'ok', 
      message: 'Mensagem unificada com sucesso',
      data: { 
        contatoUnificado: contato.contatoId, // Este é o ID que você deve usar para buscar no frontend!
        interacaoId: interacao.id,
        canalRegistrado: canal 
      }
    };
  }

  /**
   * GET /memoria/:contatoId
   * Retorna o perfil completo do cliente com histórico de interações
   */
  @Get(':contatoId')
  async getHistorico(@Param('contatoId') contatoId: string) {
    const contato = await this.prisma.memoriaContato.findUnique({
      where: { contatoId },
      include: {
        interacoes: {
          orderBy: { criadoEm: 'desc' },
          take: 20,
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
          telefone: contato.telefone, // 🆕 F16
          instagramId: contato.instagramId, // 🆕 F16
          facebookId: contato.facebookId, // 🆕 F16
          ultimoAssunto: contato.ultimoAssunto,
          totalInteracoes: contato.interacoes.length,
        },
        historico: contato.interacoes,
      }
    };
  }
}