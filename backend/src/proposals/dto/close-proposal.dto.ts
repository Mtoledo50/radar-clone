// =================================================================
// INÍCIO: backend/src/proposals/dto/close-proposal.dto.ts
// =================================================================
// Sprint A4 — Fechamento com Ganho
// Body do POST /proposals/:id/close
// =================================================================
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CloseProposalDto {
  /** Desconto aplicado sobre o preço cheio (0–50%) */
  @IsNumber()
  @Min(0)
  @Max(50)
  discountPercent: number;

  /** Plano comercial escolhido (opcional) */
  @IsOptional()
  @IsString()
  closedPlanId?: string;

  /** O que o cliente paga HOJE (opcional — habilita o "ganho vs hoje") */
  @IsOptional()
  @IsNumber()
  currentMonthly?: number;

  /** Observações do fechamento (opcional) */
  @IsOptional()
  @IsString()
  notes?: string;
}
// =================================================================
// FIM: close-proposal.dto.ts
// =================================================================