import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

/**
 * DTO para criar/atualizar categoria de serviço
 */
export class CreateServiceCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsString()
  description?: string;
}