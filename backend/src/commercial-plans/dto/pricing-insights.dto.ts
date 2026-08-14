import { IsNumber, IsOptional } from 'class-validator';

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