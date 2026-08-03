/**
 * PricingCalculatorModule
 * Módulo responsável pela calculadora de preço de honorários contábeis.
 */
import { Module } from '@nestjs/common';
import { PricingCalculatorController } from './pricing-calculator.controller';
import { PricingCalculatorService } from './pricing-calculator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PricingCalculatorController],
  providers: [PricingCalculatorService],
  exports: [PricingCalculatorService],
})
export class PricingCalculatorModule {}