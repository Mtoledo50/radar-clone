import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountingImportController } from './import.controller'; // 🔥 IMPORTANTE
import { AccountingImportService } from './import.service';       // 🔥 IMPORTANTE
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads', // Pasta temporária para uploads
    }),
  ],
  controllers: [
    AccountingController, 
    AccountingImportController // 🔥 ADICIONADO AQUI
  ],
  providers: [
    AccountingService, 
    AccountingImportService // 🔥 ADICIONADO AQUI
  ],
  exports: [AccountingService, AccountingImportService],
})
export class AccountingModule {}