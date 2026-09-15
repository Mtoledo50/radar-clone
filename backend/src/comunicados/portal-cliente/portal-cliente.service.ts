// ============================================================================
// SPRINT F18-B + F18-B.1 + F18-B.2 — PortalClienteService (ADR-121/122)
// ----------------------------------------------------------------------------
// 🆕 F18-B.2: Portal OPT-IN por cliente:
//   - client.portalAtivo=false  → token não valida ("Portal não liberado")
//   - Ligar o master na ficha   → token gerado AUTOMATICAMENTE
//   - Desligar o master         → tokens ativos revogados NA HORA
//   - portalMostrarTarefas/Propostas=false → seção vira teaser "em breve"
// ============================================================================
import { Injectable, Logger, NotFoundException, GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdatePortalConfigDto {
  portalAtivo?: boolean;
  portalMostrarTarefas?: boolean;
  portalMostrarPropostas?: boolean;
}

@Injectable()
export class PortalClienteService {
  private readonly logger = new Logger(PortalClienteService.name);
  private readonly tokenTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.tokenTtlDays = parseInt(
      this.config.get<string>('PORTAL_TOKEN_TTL_DAYS', '90'),
      10,
    );
  }

  // --------------------------------------------------------------------------
  // 🆕 F18-B.2: CONFIG DO PORTAL (usado pela Ficha do Cliente — ADMIN)
  // --------------------------------------------------------------------------
  async obterConfigPortal(clienteId: string) {
    const cliente = await this.prisma.client.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        companyName: true,
        portalAtivo: true,
        portalMostrarTarefas: true,
        portalMostrarPropostas: true,
      },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    const tokenAtivo = await this.prisma.clientPortalToken.findFirst({
      where: { clientId: clienteId, revokedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...cliente,
      portalToken: tokenAtivo?.token ?? null,
      portalUrl: tokenAtivo ? `/portal/${tokenAtivo.token}` : null,
    };
  }

  /**
   * 🆕 F18-B.2: Atualiza as 3 flags com efeitos colaterais automáticos:
   *   - portalAtivo=true  → garante token ativo (cria se não existir)
   *   - portalAtivo=false → revoga TODOS os tokens ativos na hora
   */
  async atualizarConfigPortal(clienteId: string, dto: UpdatePortalConfigDto) {
    const cliente = await this.prisma.client.findUnique({
      where: { id: clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');

    const data: any = {};
    if (dto.portalAtivo !== undefined) data.portalAtivo = dto.portalAtivo;
    if (dto.portalMostrarTarefas !== undefined)
      data.portalMostrarTarefas = dto.portalMostrarTarefas;
    if (dto.portalMostrarPropostas !== undefined)
      data.portalMostrarPropostas = dto.portalMostrarPropostas;

    const atualizado = await this.prisma.client.update({
      where: { id: clienteId },
      data,
    });

    const portalAtivo = atualizado.portalAtivo;
    let tokenAtivo = null;

    if (portalAtivo) {
      tokenAtivo = await this.prisma.clientPortalToken.findFirst({
        where: { clientId: clienteId, revokedAt: null, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!tokenAtivo) {
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + this.tokenTtlDays);
        tokenAtivo = await this.prisma.clientPortalToken.create({
          data: {
            clientId: clienteId,
            token: crypto.randomUUID(),
            expiresAt: expiraEm,
          },
        });
        this.logger.log(
          `🌐 Portal ATIVADO p/ ${cliente.companyName}: token gerado automaticamente`,
        );
      }
    } else {
      const revogados = await this.prisma.clientPortalToken.updateMany({
        where: { clientId: clienteId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revogados.count > 0) {
        this.logger.warn(
          `🔒 Portal DESATIVADO p/ ${cliente.companyName}: ${revogados.count} token(s) revogado(s)`,
        );
      }
    }

    return {
      portalAtivo: atualizado.portalAtivo,
      portalMostrarTarefas: atualizado.portalMostrarTarefas,
      portalMostrarPropostas: atualizado.portalMostrarPropostas,
      portalToken: tokenAtivo?.token ?? null,
      portalUrl: tokenAtivo ? `/portal/${tokenAtivo.token}` : null,
    };
  }

  // --------------------------------------------------------------------------
  // VALIDAÇÃO DE TOKEN (público)
  // --------------------------------------------------------------------------
  async validarToken(token: string) {
    const portalToken = await this.prisma.clientPortalToken.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gte: new Date() },
        client: { deletedAt: null },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            cnpj: true,
            monthlyFee: true,
            status: true,
            startDate: true,
            portalAtivo: true, // 🆕 F18-B.2
          },
        },
      },
    });

    if (!portalToken) {
      throw new NotFoundException('Token inválido ou expirado.');
    }
    // 🆕 F18-B.2: master desligado → portal bloqueado mesmo com token válido
    if (!portalToken.client.portalAtivo) {
      throw new NotFoundException(
        'Portal não liberado para este cliente. Fale com seu contador.',
      );
    }

    return {
      client: portalToken.client,
      expiresAt: portalToken.expiresAt,
    };
  }

  // --------------------------------------------------------------------------
  // DASHBOARD COMPLETO (público)
  // --------------------------------------------------------------------------
  async carregarDashboard(token: string) {
    const portalToken = await this.prisma.clientPortalToken.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gte: new Date() },
        client: { deletedAt: null },
      },
      include: { client: true },
    });

    if (!portalToken) {
      throw new NotFoundException('Token inválido ou expirado.');
    }
    const client = portalToken.client;

    // 🆕 F18-B.2: master desligado → bloqueia
    if (!client.portalAtivo) {
      throw new NotFoundException(
        'Portal não liberado para este cliente. Fale com seu contador.',
      );
    }

    // 🆕 F18-B.2: flags das seções (OFF = teaser no frontend, não busca dados)
    const mostrarTarefas = client.portalMostrarTarefas === true;
    const mostrarPropostas = client.portalMostrarPropostas === true;

    const agora = new Date();

    // Tarefas (somente se a flag estiver ON)
    const tasks = mostrarTarefas
      ? await this.prisma.task.findMany({
          where: {
            clientId: client.id,
            companyId: client.companyId,
            status: { notIn: ['DONE', 'BLOCKED'] },
            deletedAt: null,
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
          take: 10,
        })
      : [];

    // Relatórios mensais (Aurora FD-2) — sempre visíveis com master ON
    const monthlyReports = await this.prisma.monthlyReport.findMany({
      where: {
        clientId: client.id,
        companyId: client.companyId,
        status: 'READY',
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    // Propostas (somente se a flag estiver ON)
    const proposals =
      mostrarPropostas && client.cnpj
        ? await this.prisma.proposal.findMany({
            where: {
              clientCnpj: client.cnpj,
              companyId: client.companyId,
              status: { in: ['SENT', 'VIEWED', 'CLOSED_WON', 'CLOSED_LOST'] },
            },
            orderBy: { sentAt: 'desc' },
            take: 10,
          })
        : [];

    // DRE do mês — sempre visível com master ON
    const dreSummary = await this.calcularDRE(client.id, client.companyId);

    // F18-B.1: guias/documentos enviados (EmailEnvio ENVIADO, 24 meses)
    const limiteHistorico = new Date();
    limiteHistorico.setFullYear(limiteHistorico.getFullYear() - 2);

    const emailEnvios = await this.prisma.emailEnvio.findMany({
      where: {
        clienteId: client.id,
        companyId: client.companyId,
        status: 'ENVIADO',
        enviadoEm: { gte: limiteHistorico },
      },
      orderBy: { enviadoEm: 'desc' },
      select: {
        id: true,
        assunto: true,
        enviadoEm: true,
        linkExpiraEm: true,
        setor: true,
        anexos: true,
        primeiraAberturaEm: true,
        primeiroDownloadEm: true,
      },
    });

    const documentosEnviados = emailEnvios.map((envio) => {
      const anexos = (envio.anexos as any[]) || [];
      const primeiroAnexo = anexos[0];
      return {
        id: envio.id,
        tipo: 'EMAIL_ENVIO' as const,
        assunto: envio.assunto,
        enviadoEm: envio.enviadoEm,
        linkExpiraEm: envio.linkExpiraEm,
        nomeArquivo: primeiroAnexo?.nomeOriginal ?? 'documento.pdf',
        tamanhoBytes: primeiroAnexo?.tamanhoBytes ?? 0,
        mime: primeiroAnexo?.mime ?? 'application/pdf',
        setor: envio.setor ?? 'Fiscal',
        aberto: !!envio.primeiraAberturaEm,
        baixado: !!envio.primeiroDownloadEm,
        expirado: envio.linkExpiraEm ? envio.linkExpiraEm < agora : false,
      };
    });

    return {
      client: {
        id: client.id,
        companyName: client.companyName,
        cnpj: client.cnpj,
        monthlyFee: client.monthlyFee,
        status: client.status,
        startDate: client.startDate,
      },
      tasks,
      monthlyReports,
      proposals,
      dreSummary,
      documentosEnviados,
      // 🆕 F18-B.2: frontend usa estas flags p/ renderizar teasers
      mostrarTarefas,
      mostrarPropostas,
    };
  }

  // --------------------------------------------------------------------------
  // DOWNLOAD DE DOCUMENTO (público, com tracking BAIXADO)
  // --------------------------------------------------------------------------
  async prepararDownloadDocumento(
    token: string,
    envioId: string,
    ip?: string,
    userAgent?: string,
  ) {
    const portalToken = await this.prisma.clientPortalToken.findFirst({
      where: { token, revokedAt: null, expiresAt: { gte: new Date() } },
      include: { client: true },
    });
    if (!portalToken) {
      throw new NotFoundException('Portal inválido ou expirado.');
    }
    const cliente = portalToken.client;

    // 🆕 F18-B.2: master desligado → bloqueia download também
    if (!cliente.portalAtivo) {
      throw new NotFoundException('Portal não liberado para este cliente.');
    }

    const envio = await this.prisma.emailEnvio.findFirst({
      where: {
        id: envioId,
        clienteId: cliente.id,
        companyId: cliente.companyId,
        status: 'ENVIADO',
      },
      include: {
        eventos: { where: { tipo: 'BAIXADO' }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!envio) {
      throw new NotFoundException('Documento não encontrado ou sem permissão.');
    }

    if (envio.linkExpiraEm && envio.linkExpiraEm < new Date()) {
      throw new GoneException(
        'Link expirado. Solicite ao escritório o reenvio do documento.',
      );
    }

    const anexos = (envio.anexos as any[]) || [];
    const primeiroAnexo = anexos[0];
    if (!primeiroAnexo) {
      throw new NotFoundException('Anexo não localizado no envio.');
    }

    const fila = await this.prisma.arquivoFila.findFirst({
      where: { envioId: envio.id },
    });
    const caminhoAbsoluto = fila?.caminhoAbsoluto ?? null;
    if (!caminhoAbsoluto) {
      throw new NotFoundException('Caminho do arquivo não registrado.');
    }

    const { existsSync } = await import('fs');
    if (!existsSync(caminhoAbsoluto)) {
      this.logger.error(
        `❌ Arquivo físico não encontrado: ${caminhoAbsoluto} (envio: ${envio.id})`,
      );
      throw new NotFoundException('Arquivo físico não encontrado no servidor.');
    }

    if (envio.eventos.length === 0) {
      await this.prisma.emailEvento.create({
        data: {
          envioId: envio.id,
          tipo: 'BAIXADO',
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          metadata: {
            origem: 'PORTAL_CLIENTE',
            portalToken: token.substring(0, 8) + '...',
          } as any,
        },
      });
      await this.prisma.emailEnvio.update({
        where: { id: envio.id },
        data: { primeiroDownloadEm: new Date() },
      });
      this.logger.log(
        `📥 Download via portal: envio ${envio.id} (${envio.assunto}) → cliente ${cliente.companyName}`,
      );
    }

    return {
      caminho: caminhoAbsoluto,
      nomeArquivo: primeiroAnexo.nomeOriginal ?? 'documento.pdf',
      mime: primeiroAnexo.mime ?? 'application/pdf',
    };
  }

  // --------------------------------------------------------------------------
  // DRE DO MÊS
  // --------------------------------------------------------------------------
  private async calcularDRE(clientId: string, companyId: string) {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(
      agora.getFullYear(),
      agora.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const periodLabel = agora.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    const lancamentos = await this.prisma.accountingEntry.findMany({
      where: {
        clientId,
        companyId,
        entryDate: { gte: inicioMes, lte: fimMes },
        status: 'CONCILIATED',
      },
      select: {
        debitValue: true,
        creditValue: true,
        debitAccount: { select: { type: true } },
        creditAccount: { select: { type: true } },
      },
    });

    const receitas = lancamentos
      .filter((l) => l.creditAccount?.type === 'RECEITA')
      .reduce((sum, l) => sum + Number(l.creditValue ?? 0), 0);

    const despesas = lancamentos
      .filter((l) => l.debitAccount?.type === 'DESPESA')
      .reduce((sum, l) => sum + Number(l.debitValue ?? 0), 0);

    const resultado = receitas - despesas;
    const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;

    return {
      period: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`,
      periodLabel,
      receitas,
      despesas,
      resultado,
      margem,
    };
  }

  // --------------------------------------------------------------------------
  // REGENERAÇÃO MANUAL (ADMIN)
  // --------------------------------------------------------------------------
  async regenerarToken(clienteId: string, usuarioId: string) {
    await this.prisma.clientPortalToken.updateMany({
      where: { clientId: clienteId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const novoToken = crypto.randomUUID();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + this.tokenTtlDays);

    const portalToken = await this.prisma.clientPortalToken.create({
      data: {
        token: novoToken,
        clientId: clienteId,
        expiresAt: expiraEm,
      },
    });

    return {
      token: portalToken.token,
      expiresAt: portalToken.expiresAt,
      url: `/portal/${portalToken.token}`,
    };
  }
}