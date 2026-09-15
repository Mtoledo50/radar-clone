// ============================================================================
// SPRINT F18-B + F18-B.1 + F18-B.2 — PortalClienteController (ADR-121/122)
// ----------------------------------------------------------------------------
// PÚBLICOS (sem JWT — token age como credencial):
//   GET  /api/client-portal/validate/:token
//   GET  /api/client-portal/dashboard/:token
//   GET  /api/client-portal/documentos/:token/:envioId   (stream + BAIXADO)
// ADMIN (JWT + Roles):
//   GET   /api/client-portal/config/:clienteId           🆕 F18-B.2
//   PATCH /api/client-portal/config/:clienteId           🆕 F18-B.2
//   POST  /api/client-portal/regenerar/:clienteId
// ============================================================================
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { createReadStream } from 'fs';
import { PortalClienteService, UpdatePortalConfigDto } from './portal-cliente.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/client-portal')
export class PortalClienteController {
  constructor(private readonly service: PortalClienteService) {}

  @Get('validate/:token')
  async validar(@Param('token') token: string) {
    return this.service.validarToken(token);
  }

  @Get('dashboard/:token')
  async dashboard(@Param('token') token: string) {
    return this.service.carregarDashboard(token);
  }

  @Get('documentos/:token/:envioId')
  async baixarDocumento(
    @Param('token') token: string,
    @Param('envioId') envioId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.socket.remoteAddress ??
      null;
    const userAgent = req.headers['user-agent'] ?? null;

    const download = await this.service.prepararDownloadDocumento(
      token,
      envioId,
      ip,
      userAgent,
    );

    const stream = createReadStream(download.caminho);
    res.setHeader('Content-Type', download.mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(download.nomeArquivo)}"`,
    );
    stream.pipe(res);
  }

  /**
   * 🆕 F18-B.2 — Lê a config do portal de um cliente (Ficha do Cliente).
   */
  @Get('config/:clienteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async obterConfig(@Param('clienteId') clienteId: string) {
    return this.service.obterConfigPortal(clienteId);
  }

  /**
   * 🆕 F18-B.2 — Atualiza flags com automação:
   *   master ON  → token gerado automaticamente (retorna portalUrl)
   *   master OFF → tokens revogados na hora
   */
  @Patch('config/:clienteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async atualizarConfig(
    @Param('clienteId') clienteId: string,
    @Body() dto: UpdatePortalConfigDto,
  ) {
    return this.service.atualizarConfigPortal(clienteId, dto);
  }

  @Post('regenerar/:clienteId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async regenerarToken(
    @Param('clienteId') clienteId: string,
    @Req() req: any,
  ) {
    return this.service.regenerarToken(clienteId, req.user.id);
  }
}