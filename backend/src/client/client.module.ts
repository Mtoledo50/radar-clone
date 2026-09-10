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
@Module({
  controllers: [ClientController, S3dImportController],
  providers: [ClientService, S3dImportService],
  exports: [ClientService],
})
export class ClientModule {}
// =================================================================
// FIM: client.module.ts
// =================================================================