import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * =================================================================
 * 📦 DTO: UpdateCommercialPlanDto (Atualização Parcial)
 * =================================================================
 * Todos os campos são OPCIONAIS, permitindo:
 * - Editar apenas o nome/multiplicador
 * - Enviar SOMENTE itemIds (vinculação de serviços)
 * - Qualquer combinação parcial
 * =================================================================
 */
export class UpdateCommercialPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Multiplicador deve ser maior que zero' })
  multiplier?: number;

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

  // 🔗 IDs de serviços a vincular ao plano
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}