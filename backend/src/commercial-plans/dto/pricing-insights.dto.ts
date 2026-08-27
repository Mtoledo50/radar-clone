import { IsNumber, IsOptional, Min } from 'class-validator';
import { ResolvedPlanDto } from './resolved-plan.dto';


// Re-exporta o tipo do domínio para uso no Controller
// *Nota: Certifique-se de que o arquivo pricing-insights.ts exporta essa interface, ou declare-a aqui.
export class MoneyOnTableDto {
  monthlyGain: number;
  monthlyConcession: number;
  monthlyBalance: number;
  yearlyGain: number;
  yearlyConcession: number;
  yearlyBalance: number;
  discountPercent: number;
}
export class CalculatePricingInsightsDto {
  @IsNumber()
  baseValue: number;
  
  @IsOptional()
  @IsNumber()
  currentMonthly?: number;
}

export class PlanWithInsightsDto {
  id: string;
  name: string;
  multiplier: number;
  isIndependent: boolean;
  order: number;
  badge?: string;
  color?: string;
  description?: string;
  ownItems: any[];
  inheritedItems: any[];
  allItems: any[];
  calculatedPrice: number;
  percentVsBase: number;
  moneyOnTable?: MoneyOnTableDto;
}