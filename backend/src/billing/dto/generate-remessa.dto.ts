/**
 * =================================================================
 * DTO — Gerar Remessa CNAB
 * =================================================================
 * Payload para gerar arquivo de remessa (boletos p/ banco).
 *
 * ADR-011: Zero dependências opcionais.
 * ADR-084: Validação rigorosa com class-validator.
 * =================================================================
 */

import { IsString, IsNotEmpty, IsArray, ValidateNested, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Boleto individual na remessa
 */
export class BoletoDto {
  @IsString()
  @IsNotEmpty()
  nossoNumero: string;

  @IsString()
  @IsNotEmpty()
  numeroDocumento: string;

  @IsDateString()
  vencimento: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsString()
  @IsNotEmpty()
  sacadoNome: string;

  @IsString()
  @IsNotEmpty()
  sacadoDocumento: string;

  @IsString()
  @IsNotEmpty()
  sacadoEndereco: string;

  @IsString()
  @IsNotEmpty()
  sacadoCidade: string;

  @IsString()
  @IsNotEmpty()
  sacadoUF: string;

  @IsString()
  @IsNotEmpty()
  sacadoCEP: string;

  @IsArray()
  @IsString({ each: true })
  instrucoes?: string[];
}

/**
 * Configuração do cedente (dados do escritório)
 */
export class CedenteConfigDto {
  @IsString()
  @IsNotEmpty()
  banco: 'bb' | 'itau' | 'bradesco' | 'santander' | 'caixa';

  @IsString()
  @IsNotEmpty()
  cedenteNome: string;

  @IsString()
  @IsNotEmpty()
  cedenteDocumento: string;

  @IsString()
  @IsNotEmpty()
  cedenteAgencia: string;

  @IsString()
  @IsNotEmpty()
  cedenteConta: string;

  @IsString()
  @IsNotEmpty()
  cedenteCarteira: string;
}

/**
 * Payload completo para gerar remessa
 */
export class GenerateRemessaDto {
  @ValidateNested()
  @Type(() => CedenteConfigDto)
  config: CedenteConfigDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoletoDto)
  boletos: BoletoDto[];

  @IsNumber()
  @Min(1)
  sequencialArquivo: number;
}