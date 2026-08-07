import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';

/**
 * =================================================================
 * 📦 CreateProductDto — Validação de entrada de produtos fiscais
 * =================================================================
 * Sprint 8: Adicionado clientId opcional para vincular o produto 
 * a um cliente específico do escritório. Se omitido, o produto 
 * fica como "genérico" (clientId = null).
 * =================================================================
 */
export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Código do produto é obrigatório.' })
  @MaxLength(60)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição do produto é obrigatória.' })
  @MaxLength(200)
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'NCM é obrigatório.' })
  @MaxLength(14)
  ncm: string;

  @IsString()
  @IsNotEmpty({ message: 'Unidade de medida é obrigatória.' })
  @MaxLength(10)
  unit: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ean?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  // 🆕 Sprint 8: Vínculo opcional com o cliente
  @IsOptional()
  @IsString()
  clientId?: string;
}