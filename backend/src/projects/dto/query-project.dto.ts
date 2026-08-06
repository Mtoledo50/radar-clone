import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ProjectStatus, TaskPriority } from '@prisma/client';

export class QueryProjectDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}