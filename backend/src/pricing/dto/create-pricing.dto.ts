import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

/**
 * DTO para criar/atualizar precificação
 * Valida os dados recebidos do frontend
 */
export class CreatePricingDto {
  @IsString()
  title: string;

  @IsString()
  @IsEnum(['CONTABIL', 'FISCAL', 'PESSOAL', 'COMPLETO'])
  serviceType: string;

  @IsString()
  @IsEnum(['BAIXA', 'MEDIA', 'ALTA'])
  complexity: string;

  @IsNumber()
  estimatedHours: number;

  @IsNumber()
  hourlyRate: number;

  @IsNumber()
  @IsOptional()
  softwareCost?: number;

  @IsNumber()
  @IsOptional()
  profitMargin?: number;

  @IsNumber()
  finalValue: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}