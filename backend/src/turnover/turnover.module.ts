// =================================================================
// INÍCIO: turnover.module.ts
// =================================================================
/**
 * TurnoverModule
 * Módulo responsável pela gestão de turnover, setores, cargos,
 * motivos de desligamento e rescisões.
 */
import { Module } from '@nestjs/common';
import { TurnoverController } from './turnover.controller';
import { TurnoverService } from './turnover.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TurnoverController],
  providers: [TurnoverService],
  exports: [TurnoverService],
})
export class TurnoverModule {}
// =================================================================
// FIM: turnover.module.ts
// =================================================================