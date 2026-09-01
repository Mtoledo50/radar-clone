import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly service: ClientPortalService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Request() req, @Body() body: { clientId: string }) {
    return this.service.generateToken(req.user.companyId, body.clientId);
  }

  @Get('tokens/:clientId')
  @UseGuards(JwtAuthGuard)
  async listTokens(@Request() req, @Param('clientId') clientId: string) {
    return this.service.listTokens(req.user.companyId, clientId);
  }

  @Post('revoke/:tokenId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revoke(@Request() req, @Param('tokenId') tokenId: string) {
    return this.service.revokeToken(req.user.companyId, tokenId);
  }

  @Get('validate/:token')
  async validate(@Param('token') token: string) {
    const portalToken = await this.service.validateToken(token);
    return {
      client: portalToken.client,
      expiresAt: portalToken.expiresAt,
    };
  }

  @Get('dashboard/:token')
  async dashboard(@Param('token') token: string) {
    const portalToken = await this.service.validateToken(token);
    return this.service.getDashboard(portalToken.clientId);
  }
}