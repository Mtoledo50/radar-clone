import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority, TaskCategory } from '@prisma/client';

export class QueryTaskDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}