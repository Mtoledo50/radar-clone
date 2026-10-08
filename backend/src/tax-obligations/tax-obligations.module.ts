import { Module } from '@nestjs/common';
import { TaxObligationsService } from './tax-obligations.service';
import { TaxObligationsController } from './tax-obligations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ✅ IMPORTAÇÃO ADICIONADA

@Module({
  imports: [
    PrismaModule,
    AuthModule, // ✅ ADICIONADO AQUI para compartilhar JwtService e Guards
  ],
  controllers: [TaxObligationsController],
  providers: [TaxObligationsService],
})
export class TaxObligationsModule {}