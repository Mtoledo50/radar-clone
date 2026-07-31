import { IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';

/**
 * DTO para criar/atualizar colaborador
 * Valida os dados recebidos do frontend
 */
export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  position: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsDateString()
  admissionDate: string;

  @IsDateString()
  @IsOptional()
  dismissalDate?: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  status?: string;
}