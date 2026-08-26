/**
 * =================================================================
 * DTO — Aprovar/Rejeitar Evento de Cobrança
 * =================================================================
 * ADR-084: Nenhuma cobrança sai sem revisão humana.
 * =================================================================
 */

import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class AprovarEventoDto {
  @IsBoolean()
  aprovado: boolean;

  @IsString()
  @IsOptional()
  motivoRejeicao?: string;
}

/**
 * Validação customizada: se aprovado=false, motivo é obrigatório
 * (implementada no service, não no DTO).
 */
export function validarAprovacao(dto: AprovarEventoDto): void {
  if (!dto.aprovado && (!dto.motivoRejeicao || !dto.motivoRejeicao.trim())) {
    throw new Error('Motivo da rejeição é obrigatório');
  }
  if (dto.aprovado && !dto.motivoRejeicao) {
    dto.motivoRejeicao = undefined; // limpa campo irrelevante
  }
}