// ============================================================================
// SPRINT F13 — EmailEnvioService (ADR-030, ADR-114, ADR-117, ADR-119)
//
// Orquestrador do envio de email. Chamado pelo ArquivoFilaService quando
// o humano aprova um arquivo. Fluxo:
//   1. Cria EmailEnvio (status AGENDADO)
//   2. Resolve template (tipoDocumento → GENERICO → fallback)
//   3. Renderiza HTML com Handlebars
//   4. Injeta pixel de tracking
//   5. Gera token de download + expiração
//   6. Move arquivo para enviados/YYYY-MM/
//   7. Envia via provider (LOG/SMTP/SendGrid)
//   8. Grava evento ENVIADO ou FALHA
//   9. Atualiza status do EmailEnvio e ArquivoFila
// ============================================================================
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StatusEnvio,
  TipoEventoEmail,
  TipoDocumentoComunicado,
} from '@prisma/client';
import { EmailProviderFactory } from '../email-provider/email-provider.factory';
import { EmailTemplateService } from '../email-template/email-template.service';
import { FileMoverService } from '../file-mover/file-mover.service';
import { AprovarArquivoDto } from '../arquivo-fila/dto/aprovar-arquivo.dto';

@Injectable()
export class EmailEnvioService {
  private readonly logger = new Logger(EmailEnvioService.name);
  private readonly docLinkTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly providerFactory: EmailProviderFactory,
    private readonly templateService: EmailTemplateService,
    private readonly fileMover: FileMoverService,
  ) {
    this.docLinkTtlDays = parseInt(
      this.config.get<string>('DOC_LINK_TTL_DAYS', '7'),
      10,
    );
  }

  /**
   * Chamado pelo ArquivoFilaService.aprovar() quando o humano aprova um arquivo.
   * Executa o pipeline completo de envio.
   *
   * @returns O EmailEnvio criado, com status final (ENVIADO ou FALHOU)
   */
  async processarAprovacao(
    arquivoFilaId: string,
    dto: AprovarArquivoDto,
    usuarioId: string,
  ) {
    // ── 1. Carrega o ArquivoFila ───────────────────────────────────────────
    const fila = await this.prisma.arquivoFila.findUnique({
      where: { id: arquivoFilaId },
    });
    if (!fila) throw new NotFoundException('Arquivo não encontrado na fila');

    if (fila.status !== 'AGUARDANDO_APROVACAO') {
      throw new ConflictException(
        `Arquivo não está apto para envio (status: ${fila.status})`,
      );
    }

    // ── 2. Carrega dados do cliente e da empresa ───────────────────────────
    const cliente = fila.clienteId
      ? await this.prisma.client.findUnique({ where: { id: fila.clienteId } })
      : null;
    const company = await this.prisma.company.findUnique({
      where: { id: fila.companyId },
    });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // ── 3. Resolve destinatário (override do DTO ou email do cliente) ─────
    const destinatario = dto.emailDestinatario ?? fila.clienteEmail;
    if (!destinatario) {
      throw new ConflictException(
        'Destinatário não definido. Informe emailDestinatario.',
      );
    }

    // ── 4. Resolve template (tipo exato → GENERICO → fallback hardcode) ───
    const template = await this.resolverTemplate(
      fila.companyId,
      fila.tipoDocumento,
    );

    // ── 5. Cria o EmailEnvio (status AGENDADO) ────────────────────────────
    const envio = await this.prisma.emailEnvio.create({
      data: {
        companyId: fila.companyId,
        clienteId: fila.clienteId,
        clienteNome: cliente?.companyName ?? fila.nomeOriginal,
        clienteCnpj: fila.cnpjDetectado,
        emailDestinatario: destinatario,
        assunto: template?.assunto ?? `Documento ${fila.nomeOriginal}`,
        corpoHtml: template?.corpoHtml ?? `<p>Anexo: ${fila.nomeOriginal}</p>`,
        templateId: template?.id,
        anexos: [{
          nomeOriginal: fila.nomeOriginal,
          tamanhoBytes: fila.tamanhoBytes,
          mime: fila.mime,
        }] as any,
        setor: dto.setor ?? 'Fiscal',
        status: StatusEnvio.AGENDADO,
        aprovadoPor: usuarioId,
        aprovadoEm: new Date(),
      },
    });

    this.logger.log(`📝 EmailEnvio criado: ${envio.id} (AGENDADO)`);

    // ── 6. Calcula expiração do link de download ──────────────────────────
    const linkExpiraEm = new Date();
    linkExpiraEm.setDate(linkExpiraEm.getDate() + this.docLinkTtlDays);

    // ── 7. Renderiza o HTML com contexto completo ─────────────────────────
    const urlDownload = this.templateService.montarUrlDownload(
      envio.id,
      envio.tokenDownload,
    );

    const htmlRenderizado = this.templateService.renderizar(envio.corpoHtml, {
      cliente: {
        nome: cliente?.companyName ?? fila.nomeOriginal,
        cnpj: fila.cnpjDetectado ?? '',
        id: fila.clienteId ?? '',
      },
      documento: {
        tipo: fila.tipoDocumento ?? 'GENÉRICO',
        competencia: fila.competencia ?? '',
        nome: fila.nomeOriginal,
        tamanhoBytes: fila.tamanhoBytes,
      },
      link: {
        download: urlDownload,
        expiraEm: linkExpiraEm.toLocaleDateString('pt-BR'),
      },
      empresa: {
        nome: company.name,
        id: company.id,
      },
      setor: {
        nome: dto.setor ?? 'Fiscal',
      },
    });

    // ── 8. Injeta pixel de tracking (ADR-114) ─────────────────────────────
    const htmlFinal = this.templateService.injetarPixelTracking(
      htmlRenderizado,
      envio.id,
    );

    // Atualiza o corpo renderizado no banco
    await this.prisma.emailEnvio.update({
      where: { id: envio.id },
      data: {
        corpoHtml: htmlFinal,
        linkExpiraEm,
      },
    });

    // ── 9. Move o arquivo para enviados/YYYY-MM/ (ADR-119) ────────────────
    let caminhoFinal: string | null = null;
    try {
      caminhoFinal = await this.fileMover.moverParaEnviados(
        fila.caminhoAbsoluto,
        fila.competencia,
      );
      this.logger.log(`📁 Arquivo movido para: ${caminhoFinal}`);
    } catch (err: any) {
      this.logger.error(`❌ Falha ao mover arquivo: ${err.message}`);
      // Continua o envio mesmo que o move falhe — o anexo pode ser enviado
      // do caminho original
      caminhoFinal = fila.caminhoAbsoluto;
    }

    // ── 10. Envia via provider escolhido ───────────────────────────────────
    const provider = this.providerFactory.getProvider();
    this.logger.log(`📤 Enviando via provider: ${provider.nome}`);

    const resultado = await provider.enviar({
      para: destinatario,
      assunto: envio.assunto,
      corpoHtml: htmlFinal,
      anexos: [
        {
          nome: fila.nomeOriginal,
          caminho: caminhoFinal ?? fila.caminhoAbsoluto,
        },
      ],
      metadata: {
        envioId: envio.id,
        companyId: fila.companyId,
      },
    });

    // ── 11. Grava evento e atualiza status ─────────────────────────────────
    if (resultado.sucesso) {
      // Evento ENVIADO
      await this.prisma.emailEvento.create({
        data: {
          envioId: envio.id,
          tipo: TipoEventoEmail.ENVIADO,
          metadata: {
            provider: provider.nome,
            providerMessageId: resultado.providerMessageId,
            tentativa: 1,
          } as any,
        },
      });

      // Atualiza EmailEnvio → ENVIADO
      await this.prisma.emailEnvio.update({
        where: { id: envio.id },
        data: {
          status: StatusEnvio.ENVIADO,
          enviadoPor: usuarioId,
          enviadoEm: new Date(),
          tentativas: 1,
        },
      });

      // Atualiza ArquivoFila → ENVIADO + vínculo
      await this.prisma.arquivoFila.update({
        where: { id: arquivoFilaId },
        data: {
          status: 'ENVIADO',
          envioId: envio.id,
        },
      });

      this.logger.log(`✅ Email enviado com sucesso: ${envio.id}`);

      return {
        ok: true,
        envioId: envio.id,
        status: 'ENVIADO',
        providerMessageId: resultado.providerMessageId,
        destinatario,
        linkExpiraEm,
      };
    } else {
      // Evento FALHA
      await this.prisma.emailEvento.create({
        data: {
          envioId: envio.id,
          tipo: TipoEventoEmail.FALHA,
          metadata: {
            provider: provider.nome,
            erro: resultado.erro,
            tentativa: 1,
          } as any,
        },
      });

      // Atualiza EmailEnvio → FALHOU
      await this.prisma.emailEnvio.update({
        where: { id: envio.id },
        data: {
          status: StatusEnvio.FALHOU,
          ultimoErro: resultado.erro,
          tentativas: 1,
        },
      });

      // ArquivoFila volta para ERRO (pode ser reprocessado)
      await this.prisma.arquivoFila.update({
        where: { id: arquivoFilaId },
        data: {
          status: 'ERRO',
          erro: `Falha no envio: ${resultado.erro}`,
        },
      });

      this.logger.error(`❌ Falha no envio: ${resultado.erro}`);

      return {
        ok: false,
        envioId: envio.id,
        status: 'FALHOU',
        erro: resultado.erro,
      };
    }
  }

  /**
   * Resolve o template a usar, em cascata:
   *   1. Template específico do tipoDocumento (ativo)
   *   2. Template GENERICO ativo
   *   3. null (fallback para HTML hardcoded)
   */
  private async resolverTemplate(
    companyId: string,
    tipoDocumento: TipoDocumentoComunicado | null,
  ) {
    if (tipoDocumento) {
      const especifico = await this.prisma.emailTemplate.findFirst({
        where: { companyId, tipoDocumento, ativo: true },
      });
      if (especifico) return especifico;
    }

    // Fallback: GENERICO
    return this.prisma.emailTemplate.findFirst({
      where: {
        companyId,
        tipoDocumento: TipoDocumentoComunicado.GENERICO,
        ativo: true,
      },
    });
  }
}