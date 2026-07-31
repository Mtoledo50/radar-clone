import { IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';

/**
 * DTO para criar/atualizar cliente
 * Valida os dados recebidos do frontend
 * 
 * CAMPOS OBRIGATÓRIOS:
 * - companyName: Razão Social do cliente
 * - serviceType: Tipo de serviço (CONTABIL, FISCAL, PESSOAL, COMPLETO)
 * - monthlyFee: Valor do honorário mensal
 * - startDate: Data de início do atendimento
 */
export class CreateClientDto {
  @IsString()
  companyName: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsEnum(['CONTABIL', 'FISCAL', 'PESSOAL', 'COMPLETO'])
  serviceType: string;

  @IsNumber()
  monthlyFee: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  observations?: string;
}