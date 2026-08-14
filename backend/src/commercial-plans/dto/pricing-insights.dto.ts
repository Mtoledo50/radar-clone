/**
 * =================================================================
 * 📄 Pricing Insights DTO — Contrato para Cálculo de "Dinheiro na Mesa"
 * =================================================================
 */
import { ResolvedPlanDto } from './resolved-plan.dto';

export class CalculatePricingInsightsDto {
  /** Valor de referência base (ex: custo base ou valor base do serviço) */
  baseValue: number;
  
  /** (Opcional) Quanto o cliente paga hoje. Se informado, calcula a perda. */
  currentMonthly?: number;
}

export interface MoneyOnTableDto {
  hasLoss: boolean;      // true → está deixando dinheiro na mesa
  monthlyLoss: number;   // ideal - atual (R$/mês)
  annualLoss: number;    // monthlyLoss × 12
}

/**
 * Estende o plano resolvido com os dados matemáticos de precificação.
 */
export class PlanWithInsightsDto extends ResolvedPlanDto {
  calculatedPrice: number;       // baseValue * multiplier (arredondado)
  percentVsBase: number;         // % de variação em relação ao plano base (1.0)
  moneyOnTable?: MoneyOnTableDto; // Preenchido apenas se currentMonthly for passado
}