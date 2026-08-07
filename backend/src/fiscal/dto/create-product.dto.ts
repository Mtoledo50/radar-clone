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
 * 📦 CreateProductDto — Validação de entrada de produtos
 * =================================================================
 * NCM e EAN aceitam pontuação ("0301.99.00") — a normalização
 * (somente dígitos) acontece no Service, mantendo o DTO limpo.
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
}