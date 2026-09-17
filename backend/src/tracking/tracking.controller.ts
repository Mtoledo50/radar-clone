// =================================================================
// F13/F14 - TRACKING DE COMUNICAÇÕES E MEMÓRIA DO CLIENTE
// Controller responsável por:
// 1. Receber webhooks do sistema de envio (tracking)
// 2. Receber mensagens inbound do WhatsApp (memória do cliente)
// 3. Fornecer dados para o dashboard do Radar
// =================================================================

import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tracking')
export class TrackingController {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // 🟢 PARTE 1: CÓDIGO EXISTENTE (F13) - NÃO ALTERADO
  // Recebe eventos do sistema de envio (enviado, visualizado, respondido)
  // =========================================================================

  /**
   * POST /tracking/webhook
   * Recebe eventos do sistema de envio.
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
          canal: canal || 'WHATSAPP',
          contatoId: contatoId || null,
          conteudo: detalhes || 'Conteúdo não informado',
          status: tipoEvento,
        },
      });
    } else {
      // 3. Se já existe, apenas atualiza o status principal
      await this.prisma.comunicacaoEnvio.update({
        where: { id: envio.id },
        data: { status: tipoEvento },
      });
    }

    // 4. Registra o evento específico na linha do tempo
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
    const envios = await this.prisma.comunicacaoEnvio.findMany({
      include: {
        eventos: true, 
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return { 
      status: 'ok', 
      data: envios 
    };
  }

  // =========================================================================
  // 🔵 PARTE 2: NOVO CÓDIGO (F14) - RECEBIMENTO DE MENSAGENS WHATSAPP
  // Gerencia a memória do cliente quando uma mensagem chega
  // =========================================================================

  /**
   * POST /tracking/whatsapp-inbound
   * Recebe mensagens do cliente via WhatsApp (Evolution API ou similar).
   * Consulta a memória do cliente e gera resposta contextual.
   * 
   * Payload esperado (Evolution API):
   * {
   *   key: { remoteJid: "5511999999999@s.whatsapp.net" },
   *   message: { conversation: "Oi" }
   * }
   */
  /**
   * POST /tracking/whatsapp-inbound
   * Gerencia o fluxo de identificação e saudação do cliente.
   */
  @Post('whatsapp-inbound')
  @HttpCode(HttpStatus.OK)
  async handleInboundWhatsApp(@Body() payload: any) {
    const rawPhone = payload.key?.remoteJid || payload.phone;
    const telefone = rawPhone ? rawPhone.replace(/\D/g, '') : null;
    const mensagemRecebida = payload.message?.conversation || payload.message?.extendedTextMessage?.text || '';

    if (!telefone || !mensagemRecebida) {
      return { status: 'ignored', message: 'Payload inválido' };
    }

    // 1. Busca o contato pelo telefone
    let contato = await this.prisma.memoriaContato.findFirst({ where: { telefone } });
    let respostaBot = '';

    // 2. Máquina de Estados do Fluxo de Identificação
    if (!contato) {
      // CENÁRIO A: Cliente totalmente novo. Cria o registro e pede o nome.
      contato = await this.prisma.memoriaContato.create({
        data: {
          contatoId: telefone,
          telefone: telefone,
          statusFluxo: 'AGUARDANDO_NOME'
        }
      });
      respostaBot = `Olá! Bem-vindo à Conta Certa! 👋\n\nPara eu te identificar e te atender melhor, por favor, me informe seu *nome completo*.`;
    } 
    else if (contato.statusFluxo === 'AGUARDANDO_NOME') {
      // CENÁRIO B: Cliente mandou o nome. Salva e pede o CPF/CNPJ.
      await this.prisma.memoriaContato.update({
        where: { id: contato.id },
        data: {
          nomeCliente: mensagemRecebida,
          statusFluxo: 'AGUARDANDO_CPF'
        }
      });
      respostaBot = `Obrigado, ${mensagemRecebida}! 😊\n\nAgora, por favor, me informe seu *CPF ou CNPJ* (apenas números).`;
    } 
    else if (contato.statusFluxo === 'AGUARDANDO_CPF') {
      // CENÁRIO C: Cliente mandou o CPF/CNPJ. Finaliza o cadastro e mostra o menu.
      await this.prisma.memoriaContato.update({
        where: { id: contato.id },
        data: {
          documento: mensagemRecebida.replace(/\D/g, ''), // Salva apenas números
          statusFluxo: 'ATIVO'
        }
      });
      respostaBot = `Cadastro realizado com sucesso! ✅\n\nComo posso te ajudar hoje?\n\n1️⃣ Atendimento\n2️⃣ Nota Fiscal\n3️⃣ Financeiro\n4️⃣ Contábil/Fiscal\n5️ Pessoal/RH\n6️⃣ Legalização\n7️⃣ Solicitar documento`;
    } 
    else if (contato.statusFluxo === 'ATIVO') {
      // CENÁRIO D: Cliente recorrente (já está cadastrado).
      const nome = contato.nomeCliente || 'Cliente';
      const ultimoAssunto = contato.ultimoAssunto || 'atendimento';
      
      respostaBot = `Olá, ${nome}! Bem-vindo de volta à Conta Certa. 👋\n\nVi que sua última conversa foi sobre *${ultimoAssunto}*.\n\nComo posso te ajudar hoje?\n\n1️⃣ Atendimento\n2️⃣ Nota Fiscal\n3️⃣ Financeiro\n4️⃣ Contábil/Fiscal\n5️⃣ Pessoal/RH\n6️⃣ Legalização\n7️⃣ Solicitar documento`;
    }

    // 3. Salva a interação do cliente na Memória (Histórico)
    await this.prisma.memoriaInteracao.create({
      data: {
        contatoId: contato.id,
        tipo: 'mensagem',
        conteudo: mensagemRecebida,
        canal: 'WHATSAPP',
        metadata: {
          remetente: 'cliente',
          timestamp: new Date().toISOString()
        }
      }
    });
    // Busca o estado atualizado para retornar no JSON
    const contatoAtualizado = await this.prisma.memoriaContato.findUnique({
      where: { id: contato.id }
    });

    return {
      status: 'ok',
      contatoId: contato.id,
      statusFluxo: contatoAtualizado?.statusFluxo || 'ATIVO', // Agora retorna o estado real do banco
      respostaGerada: respostaBot
    };
  }
}