import { Module } from '@nestjs/common';
import { ObligationSchedulerService } from './obligation-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [ObligationSchedulerService, PrismaService],
  exports: [ObligationSchedulerService],
})
export class ObligationsModule {}