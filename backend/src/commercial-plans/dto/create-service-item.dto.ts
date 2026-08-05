import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, MaxLength, Min } from 'class-validator';
import { Recurrence } from '@prisma/client';

/**
 * DTO para criar/atualizar item de serviço
 * Inclui escopo detalhado para evitar scope creep
 */
export class CreateServiceItemDto {
  @IsString()
  categoryId: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  outOfScope?: string;

  @IsOptional()
  @IsString()
  requiredDocs?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  slaDays?: number;

  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}