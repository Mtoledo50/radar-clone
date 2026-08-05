import { IsString, IsOptional, IsArray } from 'class-validator';

/**
 * DTO para atualizar empresa (plano e módulos permitidos)
 */
export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[];
}