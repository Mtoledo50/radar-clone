/**
 * CommercialPlansModule
 * Módulo responsável pela gestão dos planos comerciais da empresa.
 */
import { Module } from '@nestjs/common';
import { CommercialPlansController } from './commercial-plans.controller';
import { CommercialPlansService } from './commercial-plans.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommercialPlansController],
  providers: [CommercialPlansService],
  exports: [CommercialPlansService],
})
export class CommercialPlansModule {}