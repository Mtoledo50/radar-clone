import { Module } from '@nestjs/common';
import { CommercialPlansController } from './commercial-plans.controller';
import { CommercialPlansService } from './commercial-plans.service';

@Module({
  controllers: [CommercialPlansController],
  providers: [CommercialPlansService],
  exports: [CommercialPlansService],
})
export class CommercialPlansModule {}