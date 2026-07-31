import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateCompanyProfileDto {
  @IsString()
  @IsOptional()
  razaoSocial?: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsBoolean()
  @IsOptional()
  softwareConsultoria?: boolean;

  @IsBoolean()
  @IsOptional()
  softwareContabil?: boolean;

  @IsBoolean()
  @IsOptional()
  softwareFiscal?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  clientesHoje?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  clientesAno?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  funcionariosHoje?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  funcionariosAno?: number;

  @IsString()
  @IsOptional()
  visaoEmpresa?: string;

  @IsString()
  @IsOptional()
  maiorDesafio?: string;

  @IsString()
  @IsOptional()
  compromisso?: string;
}