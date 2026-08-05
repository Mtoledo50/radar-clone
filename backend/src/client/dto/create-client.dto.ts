import { IsString, IsOptional, IsDateString, IsNumber, IsEnum, IsArray, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ServiceType, ClientStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * =================================================================
 * 📦 DTO: CreateClientDto (Enterprise Edition)
 * =================================================================
 * Responsável por validar e tipar os dados recebidos do Frontend 
 * na criação de um novo cliente.
 * 
 * 🚀 INTEGRAÇÃO COM CATÁLOGO:
 * Suporta a vinculação imediata a um Plano Comercial (Contrato) e 
 * a contratação de Serviços Avulsos (ex: IRPF, Abertura de MEI).
 * =================================================================
 */
export class CreateClientDto {
  @ApiProperty({ description: 'Razão Social ou Nome do Cliente', example: 'Tech Solutions LTDA' })
  @IsString()
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(150)
  companyName: string;

  @ApiPropertyOptional({ description: 'CNPJ ou CPF do cliente', example: '12.345.678/0001-99' })
  @IsString()
  @IsOptional()
  cnpj?: string;

  @ApiProperty({ 
    description: 'Tipo de serviço principal (Enum do Banco)', 
    enum: ServiceType,
    example: 'CONTABIL'
  })
  @IsEnum(ServiceType, { message: 'Tipo de serviço inválido.' })
  serviceType: ServiceType;

  @ApiProperty({ description: 'Honorário mensal base', example: 450.00 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O honorário deve ser um valor monetário válido.' })
  monthlyFee: number;

  @ApiPropertyOptional({ 
    description: 'Status do cliente', 
    enum: ClientStatus,
    example: 'ATIVO'
  })
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @ApiProperty({ description: 'Data de início do contrato (ISO 8601)', example: '2026-01-01' })
  @IsDateString({}, { message: 'Data de início inválida.' })
  startDate: string;

  @ApiPropertyOptional({ description: 'Data de fim do contrato (se houver)', example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Nome do contato principal' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Email do contato' })
  @IsEmail({}, { message: 'Email inválido.' })
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone do contato' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Observações internas sobre o cliente' })
  @IsString()
  @IsOptional()
  observations?: string;

  // =================================================================
  // 🚀 NOVOS CAMPOS: INTEGRAÇÃO COM CATÁLOGO DE SERVIÇOS
  // =================================================================
  
  @ApiPropertyOptional({ 
    description: 'ID do Plano Comercial contratado (Ex: START, PRIME, BLACK). Se fornecido, cria um ClientContract.',
    example: 'uuid-do-plano-comercial'
  })
  @IsString()
  @IsOptional()
  commercialPlanId?: string;

  @ApiPropertyOptional({ 
    description: 'Array de IDs de Serviços Avulsos (Ex: IRPF, MEI). Se fornecido, cria ClientServices.',
    type: [String],
    example: ['uuid-do-servico-irpf', 'uuid-do-servico-me']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  avulsoServiceIds?: string[];
}