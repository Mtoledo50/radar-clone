import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ObligationType, ObligationStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTaxObligationDto {
  @IsString()
  clientId: string;

  @IsEnum(ObligationType)
  type: ObligationType;

  @IsString()
  competence: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsEnum(ObligationStatus)
  @IsOptional()
  status?: ObligationStatus;

  @IsString()
  @IsOptional()
  obs?: string;
}