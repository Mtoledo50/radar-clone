import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientImportService } from './client-import.service';

/**
 * 📥 POST /clients/import — importa carteira (CSV parseado no frontend)
 * Rota em controller separado (mesmo prefixo 'clients', sem conflito).
 */
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientImportController {
  constructor(private readonly clientImportService: ClientImportService) {}

  @Post('import')
  import(@Request() req, @Body() body: any) {
    return this.clientImportService.importClients(
      req.user.companyId,
      req.user.id,
      body.items || [],
    );
  }
}