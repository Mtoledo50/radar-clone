// =================================================================
// INÍCIO: backend/src/billing/billing.service.ts
// =================================================================
/**
 * 💰 BillingService — FD-5 + Fase 5 (notificações) + Fase 6 (vínculo Client)
 *
 * Arquitetura híbrida:
 * - BillingInstruction: fonte de verdade das cobranças
 * - CnabArquivo: registro de arquivos CNAB (remessa/retorno)
 * - CnabMovimento: linhas de detalhe do retorno CNAB
 * - CobrancaRegra: configuração da régua (dias → canal → template)
 * - CobrancaEvento: execução da régua com aprovação humana
 *
 * 🧠 ADR-084: domínio puro isolado + aprovação humana obrigatória.
 * 🧠 ADR-086: notificações plugáveis via dispatcher (SendGrid/Twilio/Log).
 * 🧠 ADR-087: vínculo Client↔cobrança/evento (auto-match + seleção manual).
 *
 * 📌 Campos do model Client usados aqui (prisma/schema.prisma):
 *   - companyName  (razão social — usado p/ auto-match)
 *   - contactEmail (e-mail de contato — destinatário EMAIL)
 *   - contactPhone (telefone de contato — destinatário WHATSAPP/SMS)
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationDispatcherService } from './notifications/notification-dispatcher.service';
import { generateCnab240 } from './domain/cnab240';
import { parseCnab240 } from './domain/cnab240-parser';
import { parseCnab400 } from './domain/cnab400-parser';
import { matchClientByName } from './domain/client-matcher';
import { CnabFormato, CnabTipoArquivo, CnabStatus, CobrancaStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private dispatcher: NotificationDispatcherService, // 🆕 Fase 5 (ADR-086)
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // BILLING INSTRUCTION (compatibilidade com o frontend atual)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Lista cobranças com status efetivo.
   * Deriva VENCIDA na leitura (dueDate < hoje && status PENDENTE).
   * 🆕 Fase 6: inclui o client vinculado (companyName) p/ exibição na tela.
   */
  async list(companyId: string) {
    const items = await this.prisma.billingInstruction.findMany({
      where: { companyId },
      orderBy: { dueDate: 'asc' },
      include: { client: { select: { id: true, companyName: true } } },
    });
    const today = new Date();
    return items.map((i) => ({
      ...i,
      effectiveStatus:
        i.status === 'PENDENTE' && i.dueDate < today ? 'VENCIDA' : i.status,
    }));
  }

  /**
   * Cria cobrança com nosso número sequencial (11 dígitos).
   * 🆕 Fase 6 (ADR-087): vínculo explícito (clientId no DTO) OU
   * auto-match por companyName normalizado (domínio puro).
   */
  async create(
    companyId: string,
    dto: {
      clientName: string;
      document?: string;
      amount: number;
      dueDate: string;
      clientId?: string | null;
    },
  ) {
    if (!dto.clientName?.trim()) throw new BadRequestException('Cliente obrigatório');
    if (!dto.amount || dto.amount <= 0) throw new BadRequestException('Valor inválido');
    if (!dto.dueDate) throw new BadRequestException('Vencimento obrigatório');

    // 🆕 Fase 6: vínculo explícito ou auto-match por nome (ADR-087)
    let clientId = dto.clientId ?? null;
    if (!clientId) {
      const clients = (
        await this.prisma.client.findMany({
          where: { companyId },
          select: { id: true, companyName: true },
        })
      ).map((c) => ({ id: c.id, name: c.companyName }));
      clientId = matchClientByName(clients, dto.clientName)?.id ?? null;
    }

    const count = await this.prisma.billingInstruction.count({ where: { companyId } });
    return this.prisma.billingInstruction.create({
      data: {
        companyId,
        clientName: dto.clientName.trim(),
        document: dto.document?.trim() || null,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        ourNumber: String(count + 1).padStart(11, '0'),
        clientId,
      },
    });
  }

  /** Remove cobrança — só PENDENTES podem ser excluídas. */
  async remove(companyId: string, id: string) {
    const item = await this.prisma.billingInstruction.findFirst({ where: { id, companyId } });
    if (!item) throw new BadRequestException('Cobrança não encontrada');
    if (item.status !== 'PENDENTE') {
      throw new BadRequestException('Só cobranças PENDENTES podem ser excluídas');
    }
    return this.prisma.billingInstruction.delete({ where: { id } });
  }

  /** Transição de status da régua (ENVIADA/PAGA). */
  async setStatus(companyId: string, id: string, status: 'ENVIADA' | 'PAGA') {
    const item = await this.prisma.billingInstruction.findFirst({ where: { id, companyId } });
    if (!item) throw new BadRequestException('Cobrança não encontrada');
    return this.prisma.billingInstruction.update({ where: { id }, data: { status } });
  }

  /**
   * Gera remessa CNAB 240 das cobranças PENDENTES.
   * - Registra CnabArquivo (REMESSA/GERADA) no histórico
   * - Transiciona todas as PENDENTES para GERADA
   * - Retorna o texto do arquivo + contagem p/ download no frontend
   */
  async generateCnab(companyId: string) {
    const pend = await this.prisma.billingInstruction.findMany({
      where: { companyId, status: 'PENDENTE' },
      orderBy: { dueDate: 'asc' },
    });
    if (pend.length === 0) {
      throw new BadRequestException('Nenhuma cobrança PENDENTE p/ gerar remessa');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, cnpj: true },
    });

    const txt = generateCnab240(
      company?.name || 'ESCRITORIO',
      company?.cnpj || '',
      pend.map((p) => ({
        clientName: p.clientName,
        document: p.document,
        amount: Number(p.amount),
        dueDate: p.dueDate,
        ourNumber: p.ourNumber,
      })),
    );

    const sequencial =
      (await this.prisma.cnabArquivo.count({
        where: { companyId, tipo: CnabTipoArquivo.REMESSA },
      })) + 1;

    await this.prisma.cnabArquivo.create({
      data: {
        companyId,
        tipo: CnabTipoArquivo.REMESSA,
        formato: CnabFormato.CNAB_240,
        banco: 'bb',
        sequencial,
        status: CnabStatus.GERADA,
        nomeArquivo: `remessa_${sequencial}.rem`,
        tamanhoBytes: txt.length,
      },
    });

    await this.prisma.billingInstruction.updateMany({
      where: { id: { in: pend.map((p) => p.id) } },
      data: { status: 'GERADA' },
    });

    return { txt, count: pend.length };
  }

  // ═══════════════════════════════════════════════════════════════
  // RETORNO CNAB — upload, parse e processamento de movimentos
  // ═══════════════════════════════════════════════════════════════

  /**
   * Upload + parse de arquivo CNAB de retorno (240 ou 400).
   * - Cria 1 CnabArquivo (RETORNO/PROCESSADA)
   * - Cria 1 CnabMovimento por linha de detalhe (pendentes de aplicação)
   */
  async uploadRetorno(
    companyId: string,
    fileContent: string,
    formato: CnabFormato,
    banco: string,
  ) {
    let retorno;
    try {
      retorno =
        formato === CnabFormato.CNAB_240
          ? parseCnab240(fileContent)
          : parseCnab400(fileContent);
    } catch (error: any) {
      throw new BadRequestException(`Erro ao processar arquivo CNAB: ${error.message}`);
    }

    const sequencial =
      (await this.prisma.cnabArquivo.count({
        where: { companyId, tipo: CnabTipoArquivo.RETORNO },
      })) + 1;

    const arquivo = await this.prisma.cnabArquivo.create({
      data: {
        companyId,
        tipo: CnabTipoArquivo.RETORNO,
        formato,
        banco,
        sequencial,
        status: CnabStatus.PROCESSADA,
        dataProcessamento: new Date(),
        nomeArquivo: `retorno_${banco}_${sequencial}.txt`,
        tamanhoBytes: fileContent.length,
      },
    });

    const movimentos = await Promise.all(
      retorno.movimentos.map((mov) =>
        this.prisma.cnabMovimento.create({
          data: {
            companyId,
            arquivoId: arquivo.id,
            nossoNumero: mov.nossoNumero,
            numeroDocumento: mov.numeroDocumento,
            dataOcorrencia: mov.dataOcorrencia,
            codigoMovimento: mov.codigoMovimento,
            descricaoMovimento: mov.descricaoMovimento,
            valorTitulo: mov.valorPago,
            valorPago: mov.valorPago,
            tarifa: mov.tarifa,
            dataCredito: mov.dataCredito,
            aplicado: false,
          },
        }),
      ),
    );

    return { arquivo, movimentos, totalMovimentos: movimentos.length };
  }

  /** Lista arquivos CNAB da empresa (remessas + retornos) c/ contagem de movimentos. */
  async listArquivos(companyId: string) {
    return this.prisma.cnabArquivo.findMany({
      where: { companyId },
      orderBy: { dataGeracao: 'desc' },
      include: { _count: { select: { movimentos: true } } },
    });
  }

  /** Lista movimentos de um arquivo específico (multi-tenant). */
  async listMovimentos(companyId: string, arquivoId: string) {
    const arquivo = await this.prisma.cnabArquivo.findFirst({
      where: { id: arquivoId, companyId },
    });
    if (!arquivo) throw new NotFoundException('Arquivo não encontrado');

    return this.prisma.cnabMovimento.findMany({
      where: { arquivoId },
      orderBy: { dataOcorrencia: 'desc' },
    });
  }

  /**
   * Processa um movimento CNAB (aplica baixa automática).
   * Se liquidação (código 06 ou 09), marca PAGA na BillingInstruction pelo ourNumber.
   */
  async processMovimento(
    companyId: string,
    movimentoId: string,
    observacao?: string,
    bankTransactionId?: string,
    clientId?: string,
  ) {
    const movimento = await this.prisma.cnabMovimento.findFirst({
      where: { id: movimentoId, companyId },
    });
    if (!movimento) throw new NotFoundException(`Movimento ${movimentoId} não encontrado`);
    if (movimento.aplicado) throw new BadRequestException('Movimento já foi processado');

    const atualizado = await this.prisma.cnabMovimento.update({
      where: { id: movimentoId },
      data: {
        aplicado: true,
        observacao: observacao ?? null,
        bankTransactionId: bankTransactionId ?? null,
        clientId: clientId ?? null,
      },
    });

    // Liquidação → baixa automática na cobrança correspondente
    if (movimento.codigoMovimento === '06' || movimento.codigoMovimento === '09') {
      const instrucao = await this.prisma.billingInstruction.findFirst({
        where: {
          companyId,
          ourNumber: movimento.nossoNumero,
          status: { in: ['PENDENTE', 'GERADA', 'ENVIADA'] },
        },
      });
      if (instrucao) {
        await this.prisma.billingInstruction.update({
          where: { id: instrucao.id },
          data: { status: 'PAGA' },
        });
      }
    }

    return atualizado;
  }

  // ═══════════════════════════════════════════════════════════════
  // RÉGUA DE COBRANÇA — regras + eventos + execução
  // ═══════════════════════════════════════════════════════════════

  /** Lista regras de cobrança da empresa, ordenadas por ordem. */
  async listCobrancaRegras(companyId: string) {
    return this.prisma.cobrancaRegra.findMany({
      where: { companyId },
      orderBy: { ordem: 'asc' },
    });
  }

  /** Cria uma regra de cobrança (aprovação humana por padrão — ADR-084). */
  async createCobrancaRegra(
    companyId: string,
    dto: {
      nome: string;
      diasAposVencimento: number;
      canal: 'EMAIL' | 'WHATSAPP' | 'SMS';
      templateMensagem: string;
      requerAprovacao?: boolean;
      ordem?: number;
    },
  ) {
    if (!dto.nome?.trim()) throw new BadRequestException('Nome obrigatório');
    if (!dto.templateMensagem?.trim()) throw new BadRequestException('Template de mensagem obrigatório');

    return this.prisma.cobrancaRegra.create({
      data: {
        companyId,
        nome: dto.nome.trim(),
        diasAposVencimento: dto.diasAposVencimento,
        canal: dto.canal,
        templateMensagem: dto.templateMensagem,
        requerAprovacao: dto.requerAprovacao ?? true,
        ordem: dto.ordem ?? 0,
        ativa: true,
      },
    });
  }

  /** Atualiza uma regra existente (somente campos informados). */
  async updateCobrancaRegra(
    companyId: string,
    id: string,
    dto: {
      nome?: string;
      diasAposVencimento?: number;
      canal?: 'EMAIL' | 'WHATSAPP' | 'SMS';
      templateMensagem?: string;
      requerAprovacao?: boolean;
      ordem?: number;
    },
  ) {
    const regra = await this.prisma.cobrancaRegra.findFirst({ where: { id, companyId } });
    if (!regra) throw new NotFoundException('Regra não encontrada');

    return this.prisma.cobrancaRegra.update({
      where: { id },
      data: {
        nome: dto.nome,
        diasAposVencimento: dto.diasAposVencimento,
        canal: dto.canal,
        templateMensagem: dto.templateMensagem,
        requerAprovacao: dto.requerAprovacao,
        ordem: dto.ordem,
      },
    });
  }

  /** Ativa/desativa uma regra (toggle). */
  async toggleCobrancaRegra(companyId: string, id: string) {
    const regra = await this.prisma.cobrancaRegra.findFirst({ where: { id, companyId } });
    if (!regra) throw new NotFoundException('Regra não encontrada');
    return this.prisma.cobrancaRegra.update({ where: { id }, data: { ativa: !regra.ativa } });
  }

  /** Lista eventos de cobrança AGUARDANDO_APROVACAO (fila de aprovação humana). */
  async listCobrancaEventosPendentes(companyId: string) {
    return this.prisma.cobrancaEvento.findMany({
      where: { companyId, status: CobrancaStatus.AGUARDANDO_APROVACAO },
      include: { regra: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lista últimos 50 eventos (todos os status) p/ auditoria.
   * 🆕 Fase 6: inclui client p/ exibir contato (email/phone) na aba Régua.
   */
  async listCobrancaEventos(companyId: string) {
    return this.prisma.cobrancaEvento.findMany({
      where: { companyId },
      include: {
        regra: true,
        client: { select: { companyName: true, contactEmail: true, contactPhone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Aprova ou rejeita um evento (aprovação humana — ADR-084).
   * Rejeição exige motivo obrigatório (auditoria).
   */
  async aprovarEvento(
    companyId: string,
    eventoId: string,
    aprovado: boolean,
    aprovadoPorId: string,
    motivoRejeicao?: string,
  ) {
    const evento = await this.prisma.cobrancaEvento.findFirst({
      where: { id: eventoId, companyId },
    });
    if (!evento) throw new NotFoundException(`Evento ${eventoId} não encontrado`);
    if (evento.status !== CobrancaStatus.AGUARDANDO_APROVACAO) {
      throw new BadRequestException('Evento já foi processado');
    }
    if (!aprovado && !motivoRejeicao?.trim()) {
      throw new BadRequestException('Motivo da rejeição é obrigatório');
    }

    return this.prisma.cobrancaEvento.update({
      where: { id: eventoId },
      data: {
        status: aprovado ? CobrancaStatus.APROVADO : CobrancaStatus.REJEITADO,
        aprovadoPorId,
        dataAprovacao: new Date(),
        motivoRejeicao: motivoRejeicao ?? null,
      },
    });
  }

  /**
   * 🆕 Fase 5: dispara evento APROVADO via dispatcher (ADR-086).
   *
   * Fluxo:
   * 1) Resolve destinatário: override humano > contato do client > vazio
   * 2) Envia via dispatcher (roteia p/ sendgrid/twilio/log)
   * 3) Sucesso → ENVIADO + auditoria (provider/externalId/destinatario)
   * 4) Falha real → FALHOU + BadRequestException (toast no frontend)
   *
   * 🆕 Fase 6 (ADR-087): destinatário vem do contactEmail/contactPhone
   * do Client vinculado (se existir).
   */
  async enviarEvento(companyId: string, eventoId: string) {
    const evento = await this.prisma.cobrancaEvento.findFirst({
      where: { id: eventoId, companyId },
      include: { client: true, regra: true },
    });
    if (!evento) throw new NotFoundException(`Evento ${eventoId} não encontrado`);
    if (evento.status !== CobrancaStatus.APROVADO) {
      throw new BadRequestException('Evento deve estar APROVADO para envio');
    }

    // 🆕 Fase 6: override humano > contato do client > modo log (ADR-087)
    const destinatario =
      evento.destinatario ??
      (evento.canal === 'EMAIL'
        ? evento.client?.contactEmail ?? null
        : evento.client?.contactPhone ?? null);

    const resultado = await this.dispatcher.dispatch({
      channel: evento.canal as 'EMAIL' | 'WHATSAPP' | 'SMS',
      to: destinatario ?? '',
      subject: `Conta Certa — ${evento.regra?.nome ?? 'Cobrança'}`,
      body: evento.mensagemEnviada,
      meta: { eventoId, companyId },
    });

    // Falha de provider real → FALHOU (auditoria) + erro p/ frontend
    if (!resultado.ok) {
      await this.prisma.cobrancaEvento.update({
        where: { id: eventoId },
        data: {
          status: CobrancaStatus.FALHOU,
          provider: resultado.provider,
          destinatario,
        },
      });
      throw new BadRequestException(
        `Falha no envio (${resultado.provider}): ${resultado.error}`,
      );
    }

    return this.prisma.cobrancaEvento.update({
      where: { id: eventoId },
      data: {
        status: CobrancaStatus.ENVIADO,
        dataEnvio: new Date(),
        provider: resultado.provider,
        externalId: resultado.externalId ?? null,
        destinatario,
      },
    });
  }

  /**
   * Executa a régua: para cada cobrança PENDENTE vencida, aplica a regra
   * mais avançada cabível (maior diasAposVencimento <= dias de atraso)
   * e cria o CobrancaEvento (AGUARDANDO_APROVACAO ou APROVADO).
   *
   * Idempotente: não duplica evento ativo p/ mesma fatura+regra.
   *
   * 🆕 Fase 6 (ADR-087): cache de clientes p/ auto-match + vínculo do
   * evento ao Client (explícito OU por nome normalizado).
   */
  async executarRegua(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1) Cobranças PENDENTES vencidas
    const vencidas = await this.prisma.billingInstruction.findMany({
      where: { companyId, status: 'PENDENTE', dueDate: { lt: today } },
    });

    // 2) Regras ativas ordenadas
    const regras = await this.prisma.cobrancaRegra.findMany({
      where: { companyId, ativa: true },
      orderBy: { ordem: 'asc' },
    });
    if (regras.length === 0) {
      return { message: 'Nenhuma regra de cobrança configurada', eventosCriados: 0 };
    }

    // 🆕 Fase 6: cache de clientes p/ auto-match (1 query só — ADR-087)
    const clientsCache = (
      await this.prisma.client.findMany({
        where: { companyId },
        select: { id: true, companyName: true },
      })
    ).map((c) => ({ id: c.id, name: c.companyName }));

    let eventosCriados = 0;

    for (const instrucao of vencidas) {
      const diasAtraso = Math.floor(
        (today.getTime() - instrucao.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Regra aplicável: maior diasAposVencimento que cabe no atraso
      const regraAplicavel = regras
        .filter((r) => r.diasAposVencimento <= diasAtraso)
        .sort((a, b) => b.diasAposVencimento - a.diasAposVencimento)[0];
      if (!regraAplicavel) continue;

      // Idempotência: já existe evento ativo p/ esta fatura+regra?
      const existente = await this.prisma.cobrancaEvento.findFirst({
        where: {
          companyId,
          regraId: regraAplicavel.id,
          faturaIdentificador: instrucao.id,
          status: { notIn: [CobrancaStatus.REJEITADO, CobrancaStatus.FALHOU] },
        },
      });
      if (existente) continue;

      // Substitui placeholders do template
      const mensagem = regraAplicavel.templateMensagem
        .replace('{nome}', instrucao.clientName)
        .replace('{valor}', `R$ ${Number(instrucao.amount).toFixed(2)}`)
        .replace('{vencimento}', instrucao.dueDate.toLocaleDateString('pt-BR'));

      // 🆕 Fase 6: vínculo do evento ao client (explícito OU auto-match)
      const eventoClientId =
        instrucao.clientId ??
        matchClientByName(clientsCache, instrucao.clientName)?.id ??
        null;

      await this.prisma.cobrancaEvento.create({
        data: {
          companyId,
          regraId: regraAplicavel.id,
          clientId: eventoClientId,
          faturaIdentificador: instrucao.id,
          valorDevido: Number(instrucao.amount),
          dataVencimento: instrucao.dueDate,
          canal: regraAplicavel.canal,
          mensagemEnviada: mensagem,
          status: regraAplicavel.requerAprovacao
            ? CobrancaStatus.AGUARDANDO_APROVACAO
            : CobrancaStatus.APROVADO,
        },
      });
      eventosCriados++;
    }

    return { eventosCriados };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 FASE 6 — vínculo manual Client↔Cobrança e override de destinatário
  // ═══════════════════════════════════════════════════════════════

  /**
   * 🆕 Fase 6: vincula/desvincula client numa cobrança (multi-tenant).
   * - clientId null = remove vínculo
   * - clientId válido = valida pertencimento à mesma empresa
   */
  async linkClient(companyId: string, billingId: string, clientId: string | null) {
    const item = await this.prisma.billingInstruction.findFirst({
      where: { id: billingId, companyId },
    });
    if (!item) throw new NotFoundException('Cobrança não encontrada');
    if (clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: clientId, companyId },
      });
      if (!client) throw new NotFoundException('Cliente não encontrado');
    }
    return this.prisma.billingInstruction.update({
      where: { id: billingId },
      data: { clientId },
    });
  }

  /**
   * 🆕 Fase 6: override humano do destinatário de um evento (ADR-087).
   * Usado quando o contato do client está desatualizado ou o operador
   * quer enviar p/ outro email/telefone.
   */
  async setEventoDestinatario(companyId: string, eventoId: string, destinatario: string) {
    const evento = await this.prisma.cobrancaEvento.findFirst({
      where: { id: eventoId, companyId },
    });
    if (!evento) throw new NotFoundException(`Evento ${eventoId} não encontrado`);
    if (!destinatario?.trim()) throw new BadRequestException('Destinatário inválido');
    return this.prisma.cobrancaEvento.update({
      where: { id: eventoId },
      data: { destinatario: destinatario.trim() },
    });
  }
}
// =================================================================
// FIM: backend/src/billing/billing.service.ts
// =================================================================