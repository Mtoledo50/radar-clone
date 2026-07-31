import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

/**
 * DTO para criar/atualizar planejamento (metas e objetivos)
 * Valida os dados recebidos do frontend
 */
export class CreatePlanningDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  targetDate: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  progress?: number;
}