// ============================================================================
// SPRINT F13/F15 — EmailEnvioService (ADR-030, ADR-114, ADR-117, ADR-119)
// MARCADOR F15-3: ASSUNTO_RENDERIZADO
// MARCADOR F15-2: CAMINHO_REAL
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
  StatusArquivoFila,
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

  async processarAprovacao(
    arquivoFilaId: string,
    dto: AprovarArquivoDto,
    usuarioId: string,
  ) {
    // 1. Valida o ArquivoFila
    const fila = await this.prisma.arquivoFila.findUnique({
      where: { id: arquivoFilaId },
    });
    if (!fila) throw new NotFoundException('Arquivo nao encontrado na fila');

    if (fila.status !== StatusArquivoFila.AGUARDANDO_APROVACAO) {
      throw new ConflictException(
        `Arquivo nao esta apto para envio (status: ${fila.status})`,
      );
    }

    // 2. Carrega cliente e empresa
    const cliente = fila.clienteId
      ? await this.prisma.client.findUnique({ where: { id: fila.clienteId } })
      : null;
    const company = await this.prisma.company.findUnique({
      where: { id: fila.companyId },
    });
    if (!company) throw new NotFoundException('Empresa nao encontrada');

    // 3. Resolve destinatario
    const destinatario = dto.emailDestinatario ?? fila.clienteEmail;
    if (!destinatario) {
      throw new ConflictException(
        'Destinatario nao definido. Informe emailDestinatario.',
      );
    }

    // 4. Resolve template
    const template = await this.resolverTemplate(
      fila.companyId,
      fila.tipoDocumento,
    );

    // 5. Cria o EmailEnvio (AGENDADO) — assunto entra cru aqui
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
        anexos: [
          {
            nomeOriginal: fila.nomeOriginal,
            tamanhoBytes: fila.tamanhoBytes,
            mime: fila.mime,
          },
        ] as any,
        setor: dto.setor ?? 'Fiscal',
        status: StatusEnvio.AGENDADO,
        aprovadoPor: usuarioId,
        aprovadoEm: new Date(),
      },
    });
    this.logger.log(`EmailEnvio criado: ${envio.id} (AGENDADO)`);

    // 6. Expiracao do link de download
    const linkExpiraEm = new Date();
    linkExpiraEm.setDate(linkExpiraEm.getDate() + this.docLinkTtlDays);

    // 7. Contexto unico para assunto + corpo
    const urlDownload = this.templateService.montarUrlDownload(
      envio.id,
      envio.tokenDownload,
    );
    const contexto = {
      cliente: {
        nome: cliente?.companyName ?? fila.nomeOriginal,
        cnpj: fila.cnpjDetectado ?? '',
        id: fila.clienteId ?? '',
      },
      documento: {
        tipo: fila.tipoDocumento ?? 'GENERICO',
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
    };

    // MARCADOR F15-3: ASSUNTO_RENDERIZADO — o assunto tambem e Handlebars
    const assuntoRenderizado = this.templateService.renderizar(
      envio.assunto,
      contexto,
    );
    const htmlRenderizado = this.templateService.renderizar(
      envio.corpoHtml,
      contexto,
    );

    // 8. Injeta pixel e persiste corpo + assunto renderizado
    const htmlFinal = this.templateService.injetarPixelTracking(
      htmlRenderizado,
      envio.id,
    );
    await this.prisma.emailEnvio.update({
      where: { id: envio.id },
      data: {
        corpoHtml: htmlFinal,
        assunto: assuntoRenderizado,
        linkExpiraEm,
      },
    });

    // 9. MARCADOR F15-2: CAMINHO_REAL — localiza o arquivo no disco
    let caminhoFinal: string | null = null;
    try {
      const caminhoReal = await this.fileMover.resolverCaminhoAtual(
        fila.caminhoAbsoluto,
        fila.nomeOriginal,
      );
      if (caminhoReal !== fila.caminhoAbsoluto) {
        await this.prisma.arquivoFila.update({
          where: { id: fila.id },
          data: { caminhoAbsoluto: caminhoReal },
        });
      }
      caminhoFinal = await this.fileMover.moverParaEnviados(
        caminhoReal,
        fila.competencia,
      );
      this.logger.log(`Arquivo movido para: ${caminhoFinal}`);
    } catch (err: any) {
      this.logger.error(`Falha ao mover arquivo: ${err.message}`);
      caminhoFinal = fila.caminhoAbsoluto;
    }

    // 10. Envia via provider com assunto renderizado
    const provider = this.providerFactory.getProvider();
    this.logger.log(`Enviando via provider: ${provider.nome}`);
    const resultado = await provider.enviar({
      para: destinatario,
      assunto: assuntoRenderizado,
      corpoHtml: htmlFinal,
      anexos: [
        { nome: fila.nomeOriginal, caminho: caminhoFinal ?? fila.caminhoAbsoluto },
      ],
      metadata: { envioId: envio.id, companyId: fila.companyId },
    });

    // 11. Evento + status final
    if (resultado.sucesso) {
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
      await this.prisma.emailEnvio.update({
        where: { id: envio.id },
        data: {
          status: StatusEnvio.ENVIADO,
          enviadoPor: usuarioId,
          enviadoEm: new Date(),
          tentativas: 1,
        },
      });
      await this.prisma.arquivoFila.update({
        where: { id: arquivoFilaId },
        data: {
          status: StatusArquivoFila.ENVIADO,
          envioId: envio.id,
        },
      });
      this.logger.log(`Email enviado com sucesso: ${envio.id}`);
      return {
        ok: true,
        envioId: envio.id,
        status: 'ENVIADO',
        providerMessageId: resultado.providerMessageId,
        destinatario,
        linkExpiraEm,
      };
    } else {
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
      await this.prisma.emailEnvio.update({
        where: { id: envio.id },
        data: {
          status: StatusEnvio.FALHOU,
          ultimoErro: resultado.erro,
          tentativas: 1,
        },
      });
      await this.prisma.arquivoFila.update({
        where: { id: arquivoFilaId },
        data: {
          status: StatusArquivoFila.ERRO,
          erro: `Falha no envio: ${resultado.erro}`,
        },
      });
      this.logger.error(`Falha no envio: ${resultado.erro}`);
      return { ok: false, envioId: envio.id, status: 'FALHOU', erro: resultado.erro };
    }
  }

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
    return this.prisma.emailTemplate.findFirst({
      where: {
        companyId,
        tipoDocumento: TipoDocumentoComunicado.GENERICO,
        ativo: true,
      },
    });
  }
}