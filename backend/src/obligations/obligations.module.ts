import { Module } from '@nestjs/common';
import { ObligationsController } from './obligations.controller';
import { ObligationsService } from './obligations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ✅ ESSENCIAL: Fornece o JwtService para o Guard

@Module({
  imports: [
    PrismaModule,
    AuthModule, // ✅ Resolve o erro: "Nest can't resolve dependencies of the JwtAuthGuard"
  ],
  controllers: [ObligationsController],
  providers: [ObligationsService],
  exports: [ObligationsService], // Permite que outros módulos usem este serviço se necessário
})
export class ObligationsModule {}