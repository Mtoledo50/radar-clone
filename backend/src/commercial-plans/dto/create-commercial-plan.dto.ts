import { IsString, IsNumber, IsOptional, IsBoolean, Min, MaxLength, IsArray } from 'class-validator';

/**
 * DTO para criar/atualizar plano comercial
 * Valida multiplicador, nome e itens vinculados
 */
export class CreateCommercialPlanDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Multiplicador deve ser maior que zero' })
  multiplier: number;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isIndependent?: boolean;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[]; // IDs de ServiceItems a vincular
}