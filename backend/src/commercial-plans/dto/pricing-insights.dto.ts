import { IsNumber, IsOptional, Min } from 'class-validator';


// Re-exporta o tipo do domínio para uso no Controller
// *Nota: Certifique-se de que o arquivo pricing-insights.ts exporta essa interface, ou declare-a aqui.
export class CalculatePricingInsightsDto {
  @IsNumber()
  baseValue: number;
  
  @IsOptional()
  @IsNumber()
  currentMonthly?: number;
}

export interface MoneyOnTableDto {
  hasLoss: boolean;
  monthlyLoss: number;
  annualLoss: number;
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