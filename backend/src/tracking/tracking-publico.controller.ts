// =================================================================
// BLOCO 4 - TRACKING PÚBLICO (ADR-114)
// =================================================================
// Endpoints PÚBLICOS (sem autenticação) acessados pelos clientes
// quando interagem com os emails recebidos:
//   GET /track/open/:envioId            → pixel 1x1 transparente (abertura)
//   GET /track/download/:envioId/:token → download do documento
//
// IMPORTANTE: Este controller é SEPARADO do TrackingController
// existente (que cuida de webhooks do WhatsApp/Memória - F14).
// Os endpoints aqui são exclusivamente para o fluxo de EmailEnvio
// (Bloco 3 - emails com anexo + tracking).
// =================================================================
import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { FileMoverService } from '../comunicados/file-mover/file-mover.service';
import { TipoEventoEmail } from '@prisma/client';
import { createReadStream, existsSync } from 'fs';

// -----------------------------------------------------------------------------
// GIF 1x1 pixel transparente (padrão da indústria para tracking pixels)
// Imagem binária mínima válida em formato GIF89a, em base64.
// Usada quando o cliente abre o email e o cliente de email carrega imagens.
// -----------------------------------------------------------------------------
const TRANSPARENT_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@Controller('track')
export class TrackingPublicoController {
  private readonly logger = new Logger(TrackingPublicoController.name);

  constructor(
    private readonly prisma: PrismaService,
    // 🔧 FIX F15-4: FileMoverService para resolver o caminho REAL do arquivo
    // (o caminhoAbsoluto no banco pode estar desatualizado após o move)
    private readonly fileMover: FileMoverService,
  ) {}

  // --------------------------------------------------------------------------
  // GET /track/open/:envioId
  // --------------------------------------------------------------------------
  /**
   * Pixel de tracking (1x1 transparente). Chamado automaticamente quando o
   * cliente abre o email e o cliente de email carrega as imagens.
   *
   * Comportamento defensivo:
   * - SEMPRE retorna o pixel (mesmo se ID inválido) → não revela existência
   *   do envio (evita enumeração por atacantes)
   * - Registra evento ABERTO apenas se for a primeira abertura (dedupe)
   * - Atualiza primeiraAberturaEm no EmailEnvio
   */
  @Get('open/:envioId')
  async registrarAbertura(
    @Param('envioId') envioId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Helper: SEMPRE responde pixel, independente do resultado
    const responderPixel = () => {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', TRANSPARENT_PIXEL_GIF.length.toString());
      // Cache-Control agressivo: força o cliente a sempre chamar de novo
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(HttpStatus.OK).send(TRANSPARENT_PIXEL_GIF);
    };

    try {
      const envio = await this.prisma.emailEnvio.findUnique({
        where: { id: envioId },
      });

      // Se não existir, responde pixel sem registrar nada (evita enumeração)
      if (!envio) {
        this.logger.warn(`Pixel open: envioId nao encontrado ${envioId}`);
        return responderPixel();
      }

      // Só registra ABERTO uma vez (dedupe) — evita poluição da timeline
      if (!envio.primeiraAberturaEm) {
        await this.prisma.emailEnvio.update({
          where: { id: envioId },
          data: { primeiraAberturaEm: new Date() },
        });

        await this.prisma.emailEvento.create({
          data: {
            envioId,
            tipo: TipoEventoEmail.ABERTO,
            ip: this.extrairIp(req),
            userAgent: req.headers['user-agent'] ?? null,
            metadata: {
              referer: req.headers['referer'] ?? null,
            } as any,
          },
        });

        this.logger.log(`📬 ABERTO: ${envioId} (${envio.emailDestinatario})`);
      } else {
        this.logger.debug(`Abertura duplicada ignorada: ${envioId}`);
      }
    } catch (err) {
      this.logger.error(`Erro ao registrar abertura: ${err}`);
    }

    // SEMPRE retorna o pixel (comportamento defensivo)
    return responderPixel();
  }

  // --------------------------------------------------------------------------
  // GET /track/download/:envioId/:token
  // --------------------------------------------------------------------------
  /**
   * Endpoint de download do documento anexo. Valida em 4 camadas:
   *   1. Existência do EmailEnvio
   *   2. Token (UUID) batendo com o gravado no banco
   *   3. Expiração (linkExpiraEm > now)
   *   4. Existência do arquivo físico no disco (usando resolverCaminhoAtual)
   *
   * Se tudo OK: faz stream do arquivo e registra evento BAIXADO (dedupe).
   */
  @Get('download/:envioId/:token')
  async baixarDocumento(
    @Param('envioId') envioId: string,
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // ── 1. Busca o envio ────────────────────────────────────────────────
    const envio = await this.prisma.emailEnvio.findUnique({
      where: { id: envioId },
    });
    if (!envio) {
      throw new NotFoundException('Link de download invalido.');
    }

    // ── 2. Valida token (ADR-114) ───────────────────────────────────────
    if (envio.tokenDownload !== token) {
      this.logger.warn(`Token invalido para envio ${envioId}`);
      throw new ForbiddenException('Token de download invalido.');
    }

    // ── 3. Valida expiracao ─────────────────────────────────────────────
    if (envio.linkExpiraEm && new Date() > envio.linkExpiraEm) {
      this.logger.warn(`Link expirado para envio ${envioId}`);
      throw new GoneException(
        'Link de download expirado. Solicite novo envio.',
      );
    }

    // ── 4. Busca o arquivo fisico via ArquivoFila vinculado ─────────────
    const arquivoFila = await this.prisma.arquivoFila.findFirst({
      where: { envioId: envioId },
    });

    if (!arquivoFila) {
      this.logger.error(`ArquivoFila nao encontrado para envio ${envioId}`);
      throw new NotFoundException(
        'Arquivo nao encontrado. Entre em contato conosco.',
      );
    }

    // 🔧 FIX F15-4: usa resolverCaminhoAtual para localizar o arquivo REAL
    // O caminhoAbsoluto no banco pode estar desatualizado (o arquivo foi
    // movido para enviados/YYYY-MM/ após a aprovação)
    const caminhoReal = await this.fileMover.resolverCaminhoAtual(
      arquivoFila.caminhoAbsoluto,
      arquivoFila.nomeOriginal,
    );

    if (!existsSync(caminhoReal)) {
      this.logger.error(`Arquivo nao encontrado no disco: ${caminhoReal}`);
      throw new NotFoundException(
        'Arquivo nao encontrado. Entre em contato conosco.',
      );
    }

    // ── 5. Registra evento BAIXADO (apenas na primeira vez - dedupe) ────
    if (!envio.primeiroDownloadEm) {
      await this.prisma.emailEnvio.update({
        where: { id: envioId },
        data: { primeiroDownloadEm: new Date() },
      });

      await this.prisma.emailEvento.create({
        data: {
          envioId,
          tipo: TipoEventoEmail.BAIXADO,
          ip: this.extrairIp(req),
          userAgent: req.headers['user-agent'] ?? null,
          metadata: {
            arquivo: arquivoFila.nomeOriginal,
          } as any,
        },
      });

      this.logger.log(`📥 BAIXADO: ${envioId} (${envio.emailDestinatario})`);
    }

    // ── 6. Stream do arquivo para o cliente ─────────────────────────────
    const nomeOriginal = arquivoFila.nomeOriginal ?? 'documento.pdf';
    const mime = arquivoFila.mime ?? 'application/octet-stream';

    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(nomeOriginal)}"`,
    );
    res.setHeader('Cache-Control', 'no-store');

    const stream = createReadStream(caminhoReal);
    stream.pipe(res);

    stream.on('error', (err) => {
      this.logger.error(`Erro no stream do arquivo: ${err.message}`);
      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Erro ao baixar arquivo.');
      }
    });
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------
  /**
   * Extrai o IP do cliente considerando proxies (X-Forwarded-For).
   * Em producao com Load Balancer / Nginx, o IP real vem no header.
   */
  private extrairIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return first?.trim() ?? null;
    }
    return req.ip ?? req.socket?.remoteAddress ?? null;
  }
}