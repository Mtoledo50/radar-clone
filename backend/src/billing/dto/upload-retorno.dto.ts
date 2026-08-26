/**
 * =================================================================
 * DTO — Upload de Retorno CNAB (metadata do arquivo)
 * =================================================================
 * Como o arquivo vem como multipart, este DTO é usado no @Body
 * para os campos form-data (não o arquivo em si).
 *
 * ADR-011: Zero dependências opcionais.
 * ADR-084: Validação rigorosa com class-validator.
 * =================================================================
 */

import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumberString } from 'class-validator';

export class UploadRetornoDto {
  @IsString()
  @IsIn(['CNAB_240', 'CNAB_400'])
  formato: 'CNAB_240' | 'CNAB_400';

  @IsString()
  @IsIn(['bb', 'itau', 'bradesco', 'santander', 'caixa'])
  banco: 'bb' | 'itau' | 'bradesco' | 'santander' | 'caixa';

  @IsOptional()
  @IsNumberString()
  sequencial?: string;
}