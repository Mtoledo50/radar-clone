import { IsOptional, IsEnum, IsDateString, IsString, IsNumber, IsArray, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ClientStatus, ServiceType } from '@prisma/client';

/**
 * =================================================================
 * 📦 DTO: UpdateClientDto (Enterprise Edition)
 * =================================================================
 * DTO específico para updates parciais. Todos os campos são 
 * OPCIONAIS, permitindo atualizar apenas o que mudou.
 * 
 * ⚠️ NOTA: Não estende CreateClientDto porque TypeScript não permite
 * "des-obrigar" campos via herança. Mantemos validação independente.
 * =================================================================
 */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  monthlyFee?: number;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  // 🚀 INTEGRAÇÃO COM CATÁLOGO
  @IsOptional()
  @IsString()
  commercialPlanId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avulsoServiceIds?: string[];
}