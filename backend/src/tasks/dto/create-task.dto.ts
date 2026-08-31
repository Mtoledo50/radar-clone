import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsDateString,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @MaxLength(160, { message: 'O título deve ter no máximo 160 caracteres' })
  title: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  @MaxLength(2000, { message: 'A descrição é muito longa' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status inválido' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Prioridade inválida' })
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory, { message: 'Categoria inválida' })
  category?: TaskCategory;

  @IsOptional()
  @IsUUID('4', { message: 'ID de projeto inválido' })
  projectId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID de cliente inválido' })
  clientId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID de responsável inválido' })
  assigneeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de início inválida' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de prazo inválida' })
  dueDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Horas estimadas deve ser um número' })
  @Min(0, { message: 'Horas estimadas não pode ser negativo' })
  estimatedHours?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Horas reais deve ser um número' })
  @Min(0, { message: 'Horas reais não pode ser negativo' })
  actualHours?: number;
}