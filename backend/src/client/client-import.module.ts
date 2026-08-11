import { Module } from '@nestjs/common';
import { ClientImportController } from './client-import.controller';
import { ClientImportService } from './client-import.service';

@Module({
  controllers: [ClientImportController],
  providers: [ClientImportService],
})
export class ClientImportModule {}