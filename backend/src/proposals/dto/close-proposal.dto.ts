// =================================================================
// INÍCIO: backend/src/proposals/dto/close-proposal.dto.ts
// =================================================================
/**
 * CloseProposalDto — DTO para fechamento de proposta com ganho
 * =================================================================
 * Regras (ADR-029):
 * - discountPercent: 0-100 (desconto praticado sobre o preço ideal)
 * - currentMonthly: valor que o cliente paga hoje (opcional, p/ comparação)
 * - closedPlanId: ID do plano escolhido (opcional)
 * - notes: observações do fechamento (opcional)
 * =================================================================
 */
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CloseProposalDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;

  @IsOptional()
  @IsNumber()
  currentMonthly?: number;

  @IsOptional()
  @IsString()
  closedPlanId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
// =================================================================
// FIM: backend/src/proposals/dto/close-proposal.dto.ts
// =================================================================