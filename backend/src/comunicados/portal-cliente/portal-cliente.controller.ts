// ============================================================================
// SPRINT F18-B — PortalClienteController (ADR-121)
// ----------------------------------------------------------------------------
// Endpoints públicos (SEM JWT) do Portal do Cliente:
//   GET  /api/client-portal/validate/:token    → valida token + dados básicos
//   GET  /api/client-portal/dashboard/:token   → dashboard completo
//
// Endpoint ADMIN (protegido):
//   POST /api/client-portal/regenerar/:clienteId  → regenera token do cliente
// ============================================================================
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PortalClienteService } from './portal-cliente.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/client-portal')
export class PortalClienteController {
  constructor(private readonly service: PortalClienteService) {}

  /**
   * GET /api/client-portal/validate/:token
   * Valida token e retorna dados básicos do cliente + expiração.
   * PÚBLICO — sem autenticação.
   */
  @Get('validate/:token')
  async validar(@Param('token') token: string) {
    return this.service.validarToken(token);
  }

  /**
   * GET /api/client-portal/dashboard/:token
   * Retorna dashboard completo (KPIs, DRE, Propostas, Documentos).
   * PÚBLICO — sem autenticação.
   */
  @Get('dashboard/:token')
  async dashboard(@Param('token') token: string) {
    return this.service.carregarDashboard(token);
  }

  /**
   * POST /api/client-portal/regenerar/:clienteId
   * ADMIN: regenera o token do portal (revoga todos os anteriores).
   * Útil em caso de vazamento ou troca de responsável.
   */
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