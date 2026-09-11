// =================================================================
// INÍCIO: client.module.ts
// =================================================================
/**
 * ClientModule
 * Módulo responsável pela gestão da carteira de clientes.
 */
import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { S3dImportService } from './s3d-import.service';
import { S3dImportController } from './s3d-import.controller';
import { ClientProfileService } from './client-profile.service';
import { ClientProfileController } from './client-profile.controller';
@Module({
// providers: + ClientProfileService,
  controllers: [ClientController, S3dImportController, ClientProfileController],
  providers: [ClientService, S3dImportService, ClientProfileService],
  exports: [ClientService],
})
export class ClientModule {}
// =================================================================
// FIM: client.module.ts
// =================================================================