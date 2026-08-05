import { IsString, IsOptional, IsDateString, IsNumber, IsEnum, IsArray, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ServiceType, ClientStatus } from '@prisma/client';

/**
 * =================================================================
 * 📦 DTO: CreateClientDto (Enterprise Edition - Sem Swagger)
 * =================================================================
 * Valida e tipa os dados recebidos do Frontend na criação de cliente.
 * 
 * 🚀 INTEGRAÇÃO COM CATÁLOGO:
 * - commercialPlanId: vincula a um Plano Comercial (gera ClientContract)
 * - avulsoServiceIds: vincula a Serviços Avulsos (gera ClientServices)
 * =================================================================
 */
export class CreateClientDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(150)
  companyName: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsEnum(ServiceType, { message: 'Tipo de serviço inválido.' })
  serviceType: ServiceType;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O honorário deve ser um valor monetário válido.' })
  monthlyFee: number;

  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @IsDateString({}, { message: 'Data de início inválida.' })
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsEmail({}, { message: 'Email inválido.' })
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  observations?: string;

  // 🚀 INTEGRAÇÃO COM CATÁLOGO DE SERVIÇOS
  @IsString()
  @IsOptional()
  commercialPlanId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  avulsoServiceIds?: string[];
}