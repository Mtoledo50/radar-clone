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

@Module({
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
// =================================================================
// FIM: client.module.ts
// =================================================================