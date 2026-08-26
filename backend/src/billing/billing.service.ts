// =================================================================
// INÍCIO: backend/src/billing/billing.service.ts
// =================================================================
/**
 * 💰 BillingService — FD-5 (régua de cobrança + CNAB 240/400)
 *
 * Arquitetura híbrida:
 * - BillingInstruction: fonte de verdade das cobranças (compatível frontend)
 * - CnabArquivo: registro de arquivos CNAB gerados (remessa) e recebidos (retorno)
 * - CnabMovimento: linhas de detalhe do retorno CNAB
 * - CobrancaRegra: configuração da régua (dias → canal → template)
 * - CobrancaEvento: execução da régua com aprovação humana
 *
 * Régua BillingInstruction: PENDENTE → GERADA (remessa) → ENVIADA → PAGA.
 * VENCIDA é derivada na leitura (dueDate < hoje && !PAGA/ENVIADA).
 *
 * 🧠 ADR-061: v1 com entradas explícitas; integração Client = v2.
 * 🧠 ADR-084: domínio puro isolado + validação rigorosa + multi-tenant.
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateCnab240 } from './domain/cnab240';
import { parseCnab240 } from './domain/cnab240-parser';
import { parseCnab400 } from './domain/cnab400-parser';
import { CnabFormato, CnabTipoArquivo, CnabStatus, CobrancaStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════
  // BILLING INSTRUCTION (compatibilidade com o frontend atual)
  // ═══════════════════════════════════════════════════════════════

  /** Lista cobranças com status efetivo (deriva VENCIDA na leitura). */
  async list(companyId: string) {
    const items = await this.prisma.billingInstruction.findMany({
      where: { companyId },
      orderBy: { dueDate: 'asc' },
    });
    const today = new Date();
    return items.map((i) => ({
      ...i,
      effectiveStatus:
        i.status === 'PENDENTE' && i.dueDate < today ? 'VENCIDA' : i.status,
    }));
  }

  /** Cria cobrança com nosso número sequencial (11 dígitos). */
  async create(
    companyId: string,
    dto: { clientName: string; document?: string; amount: number; dueDate: string },
  ) {
    if (!dto.clientName?.trim()) throw new BadRequestException('Cliente obrigatório');
    if (!dto.amount || dto.amount <= 0) throw new BadRequestException('Valor inválido');
    if (!dto.dueDate) throw new BadRequestException('Vencimento obrigatório');

    const count = await this.prisma.billingInstruction.count({ where: { companyId } });
    return this.prisma.billingInstruction.create({
      data: {
        companyId,
        clientName: dto.clientName.trim(),
        document: dto.document?.trim() || null,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        ourNumber: String(count + 1).padStart(11, '0'),
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

  /** Gera remessa CNAB das PENDENTES, registra CnabArquivo e marca GERADA. */
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

    // Build do arquivo (domínio puro)
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

    // 🆕 Registra o arquivo de remessa no histórico (CnabArquivo)
    const sequencial =
      (await this.prisma.cnabArquivo.count({
        where: { companyId, tipo: CnabTipoArquivo.REMESSA },
      })) + 1;

    await this.prisma.cnabArquivo.create({
      data: {
        companyId,
        tipo: CnabTipoArquivo.REMESSA,
        formato: CnabFormato.CNAB_240,
        banco: 'bb', // TODO: tornar configurável por empresa
        sequencial,
        status: CnabStatus.GERADA,
        nomeArquivo: `remessa_${sequencial}.rem`,
        tamanhoBytes: txt.length,
      },
    });

    // Transição da régua: PENDENTE → GERADA
    await this.prisma.billingInstruction.updateMany({
      where: { id: { in: pend.map((p) => p.id) } },
      data: { status: 'GERADA' },
    });

    return { txt, count: pend.length };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🆕 RETORNO CNAB — upload, parse e processamento de movimentos
  // ═══════════════════════════════════════════════════════════════

  /**
   * Upload + parse de arquivo CNAB de retorno.
   * Cria 1 CnabArquivo (RETORNO/PROCESSADA) + 1 CnabMovimento por detalhe.
   */
  async uploadRetorno(
    companyId: string,
    fileContent: string,
    formato: CnabFormato,
    banco: string,
  ) {
    // 1) Parse no domínio puro (240 ou 400)
    let retorno;
    try {
      retorno =
        formato === CnabFormato.CNAB_240
          ? parseCnab240(fileContent)
          : parseCnab400(fileContent);
    } catch (error) {
      throw new BadRequestException(`Erro ao processar arquivo CNAB: ${error.message}`);
    }

    // 2) Registro do arquivo de retorno
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

    // 3) Movimentos (1 por linha de detalhe), pendentes de aplicação
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
            valorTitulo: mov.valorPago, // TODO: extrair do Segmento P quando disponível
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

  /** Lista arquivos CNAB da empresa (remessas + retornos). */
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
   * Se liquidação (06/09), dá PAGA na BillingInstruction pelo ourNumber.
   */
  async processMovimento(
    companyId: string,
    movimentoId: string,
    observacao?: string,
    bankTransactionId?: string,
    clientId?: string,
  ) {
    // 1) Busca o movimento (só da própria empresa)
    const movimento = await this.prisma.cnabMovimento.findFirst({
      where: { id: movimentoId, companyId },
    });
    if (!movimento) {
      throw new NotFoundException(`Movimento ${movimentoId} não encontrado`);
    }
    if (movimento.aplicado) {
      throw new BadRequestException('Movimento já foi processado');
    }

    // 2) Marca como aplicado + grava vínculos opcionais
    const atualizado = await this.prisma.cnabMovimento.update({
      where: { id: movimentoId },
      data: {
        aplicado: true,
        observacao: observacao ?? null,
        bankTransactionId: bankTransactionId ?? null,
        clientId: clientId ?? null,
      },
    });

    // 3) Liquidação → baixa na cobrança correspondente
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
  // 🆕 RÉGUA DE COBRANÇA — regras + eventos + execução
  // ═══════════════════════════════════════════════════════════════

  /** Lista regras de cobrança da empresa, ordenadas por ordem. */
  async listCobrancaRegras(companyId: string) {
    return this.prisma.cobrancaRegra.findMany({
      where: { companyId },
      orderBy: { ordem: 'asc' },
    });
  }

  /** Cria uma regra de cobrança (aprovação humana por padrão). */
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
    if (!dto.templateMensagem?.trim()) {
      throw new BadRequestException('Template de mensagem obrigatório');
    }

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

    return this.prisma.cobrancaRegra.update({
      where: { id },
      data: { ativa: !regra.ativa },
    });
  }

  /** Lista eventos de cobrança AGUARDANDO_APROVACAO. */
  async listCobrancaEventosPendentes(companyId: string) {
    return this.prisma.cobrancaEvento.findMany({
      where: { companyId, status: CobrancaStatus.AGUARDANDO_APROVACAO },
      include: { regra: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Aprova ou rejeita um evento (aprovação humana — ADR-084).
   * Rejeição exige motivo.
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

  /** Dispara evento APROVADO (marca ENVIADO; provider externo = TODO). */
  async enviarEvento(companyId: string, eventoId: string) {
    const evento = await this.prisma.cobrancaEvento.findFirst({
      where: { id: eventoId, companyId },
    });
    if (!evento) throw new NotFoundException(`Evento ${eventoId} não encontrado`);
    if (evento.status !== CobrancaStatus.APROVADO) {
      throw new BadRequestException('Evento deve estar APROVADO para envio');
    }

    // TODO: integrar provider real (email/WhatsApp) aqui
    return this.prisma.cobrancaEvento.update({
      where: { id: eventoId },
      data: { status: CobrancaStatus.ENVIADO, dataEnvio: new Date() },
    });
  }

  /**
   * Executa a régua: para cada cobrança PENDENTE vencida, aplica a regra
   * mais avançada cabível (maior diasAposVencimento <= dias de atraso)
   * e cria o CobrancaEvento (AGUARDANDO_APROVACAO ou APROVADO).
   * Idempotente: não duplica evento ativo p/ mesma fatura+regra.
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

      await this.prisma.cobrancaEvento.create({
        data: {
          companyId,
          regraId: regraAplicavel.id,
          clientId: null, // sem vínculo automático (ADR-061 v1 — entrada explícita)
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
}
// =================================================================
// FIM: backend/src/billing/billing.service.ts
// =================================================================