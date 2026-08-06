import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}