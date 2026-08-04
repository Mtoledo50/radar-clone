import { Module } from '@nestjs/common';
import { PricingCalculatorController } from './pricing-calculator.controller';
import { PricingCalculatorService } from './pricing-calculator.service';

@Module({
  controllers: [PricingCalculatorController],
  providers: [PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingCalculatorModule {}