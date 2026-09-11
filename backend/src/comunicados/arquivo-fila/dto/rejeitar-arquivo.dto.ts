import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejeitarArquivoDto {
  @ApiProperty({
    description: 'Motivo da rejeição (obrigatório por ADR-030)',
    example: 'Documento duplicado / enviado anteriormente',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;
}