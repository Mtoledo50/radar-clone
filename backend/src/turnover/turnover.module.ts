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