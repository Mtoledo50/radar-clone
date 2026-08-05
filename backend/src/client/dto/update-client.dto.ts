import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ClientStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

/**
 * =================================================================
 * 📦 DTO: UpdateClientDto (Enterprise Edition)
 * =================================================================
 * Herda todas as validações do CreateClientDto, mas torna todos 
 * os campos opcionais. Adiciona validações específicas para updates.
 * =================================================================
 */
export class UpdateClientDto extends PartialType(CreateClientDto) {
  
  @ApiPropertyOptional({ 
    description: 'Novo status do cliente (Ex: para marcar como CHURN)', 
    enum: ClientStatus 
  })
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @ApiPropertyOptional({ description: 'Nova data de início' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Nova data de fim' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}