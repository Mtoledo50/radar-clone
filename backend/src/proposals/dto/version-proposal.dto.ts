// =================================================================
// INÍCIO: backend/src/proposals/dto/version-proposal.dto.ts
// =================================================================
/**
 * VersionProposalDto — DTO para criar uma nova versão de proposta
 * =================================================================
 * Regra de negócio (ADR-028):
 * - A versão original é IMUTÁVEL após ser versionada.
 * - A nova versão herda todos os campos da original, exceto:
 *   - version (incrementado)
 *   - isCurrent (true na nova, false nas anteriores)
 *   - status (volta para DRAFT, pois é uma nova negociação)
 *   - sentAt/closedAt (zerados, pois ainda não foi enviada)
 * =================================================================
 */
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class VersionProposalDto {
  @IsOptional()
  @IsString()
  reason?: string; // Motivo da nova versão (ex: "Cliente pediu desconto de 10%")

  @IsOptional()
  @IsString()
  clientName?: string; // Permite ajustar o nome do cliente na nova versão

  @IsOptional()
  @IsString()
  clientCnpj?: string;

  @IsOptional()
  @IsNumber()
  monthlyRevenue?: number;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @IsOptional()
  @IsNumber()
  basePrice?: number;
}

export class CompareVersionsDto {
  @IsString()
  versionAId: string;

  @IsString()
  versionBId: string;
}
// =================================================================
// FIM: backend/src/proposals/dto/version-proposal.dto.ts
// =================================================================