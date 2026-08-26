/**
 * =================================================================
 * DTO — Criar/Atualizar Régua de Cobrança
 * =================================================================
 * Define um passo da régua: "após X dias, envie mensagem Y via Z".
 *
 * ADR-084: Aprovação humana por padrão (requerAprovacao=true).
 * =================================================================
 */

import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class CreateCobrancaRegraDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsInt()
  @Min(0)
  @Max(365)
  diasAposVencimento: number;

  @IsString()
  @IsIn(['EMAIL', 'WHATSAPP', 'SMS'])
  canal: 'EMAIL' | 'WHATSAPP' | 'SMS';

  @IsString()
  @IsNotEmpty()
  templateMensagem: string;

  @IsBoolean()
  @IsOptional()
  requerAprovacao?: boolean;

  @IsInt()
  @IsOptional()
  ordem?: number;
}