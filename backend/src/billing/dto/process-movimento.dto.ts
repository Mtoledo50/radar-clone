/**
 * =================================================================
 * DTO — Processar Movimento CNAB (Baixa Automática)
 * =================================================================
 * Payload para aplicar baixa automática de um movimento CNAB.
 *
 * ADR-084: Aprovação humana obrigatória antes de aplicar.
 * =================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ProcessMovimentoDto {
  @IsUUID()
  @IsNotEmpty()
  movimentoId: string;

  @IsString()
  @IsOptional()
  observacao?: string;

  /**
   * Se informado, vincula o movimento a uma BankTransaction existente
   * (conciliação bancária automática).
   */
  @IsUUID()
  @IsOptional()
  bankTransactionId?: string;

  /**
   * Se informado, vincula o movimento a um Client existente
   * (identificação automática pelo número do documento).
   */
  @IsUUID()
  @IsOptional()
  clientId?: string;
}