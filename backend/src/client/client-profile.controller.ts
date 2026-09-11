// =================================================================
// INÍCIO: backend/src/client/client-profile.controller.ts
// =================================================================
/**
 * 🆕 Sprint F12.5 — PUT /clients/:id/profile
 * Rota de 2 segmentos NÃO colide com o PUT /clients/:id existente.
 */
import { Body, Controller, Param, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientProfileService, UpdateProfileDto } from './client-profile.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientProfileController {
  constructor(private readonly profile: ClientProfileService) {}

  @Put(':id/profile')
  updateProfile(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profile.updateProfile(req.user.companyId, id, body);
  }
}
// =================================================================
// FIM: backend/src/client/client-profile.controller.ts
// =================================================================