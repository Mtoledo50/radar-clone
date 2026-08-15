// =================================================================
// INÍCIO: backend/src/digital-employee/digital-employee.dto.ts
// =================================================================
// DTOs (Data Transfer Objects) da Sprint FD-1 — Funcionário Digital Aurora.
// Cada DTO valida a ENTRADA da API usando class-validator.
// Se um campo vier errado, o NestJS devolve 400 antes de tocar no service.
// =================================================================
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApprovalDecision } from '@prisma/client';

// -----------------------------------------------------------------
// DTO: atualizar a Aurora (ex.: pausar/retomar)
// -----------------------------------------------------------------
export class UpdateWorkerDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED'], { message: 'Status deve ser ACTIVE ou PAUSED' })
  status?: 'ACTIVE' | 'PAUSED';

  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}

// -----------------------------------------------------------------
// DTO: atualizar uma skill (ligar/desligar + cron)
// -----------------------------------------------------------------
export class UpdateSkillDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  cronExpr?: string; // Ex.: "0 2 * * *" (todo dia 02:00)
}

// -----------------------------------------------------------------
// DTO: resolver uma pendência da fila de revisão (aprovar/rejeitar)
// -----------------------------------------------------------------
export class ResolvePendingDto {
  @IsEnum(ApprovalDecision, { message: 'decision deve ser APPROVED ou REJECTED' })
  decision: ApprovalDecision;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
// =================================================================
// FIM: backend/src/digital-employee/digital-employee.dto.ts
// =================================================================