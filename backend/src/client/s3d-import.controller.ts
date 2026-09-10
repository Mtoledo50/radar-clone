// =================================================================
// INÍCIO: backend/src/client/s3d-import.controller.ts
// =================================================================
/**
 * 🆕 Sprint F12 — Endpoint de importação S3D.
 * Controller SEPARADO de propósito: não toca no ClientController
 * existente (risco zero de regressão nas rotas atuais).
 */
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { S3dImportService, S3dCompany } from './s3d-import.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class S3dImportController {
  constructor(private readonly s3d: S3dImportService) {}

  /**
   * POST /clients/import-s3d
   * Body: { companies: S3dCompany[] } (já agrupado pelo parser frontend)
   */
  @Post('import-s3d')
  importS3d(@Request() req, @Body() body: { companies: S3dCompany[] }) {
    return this.s3d.importS3d(req.user.companyId, req.user.id, body.companies);
  }
}
// =================================================================
// FIM: backend/src/client/s3d-import.controller.ts
// =================================================================