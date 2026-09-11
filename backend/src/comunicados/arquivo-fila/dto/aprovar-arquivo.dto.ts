import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class AprovarArquivoDto {
  @ApiPropertyOptional({
    description: 'Override do destinatário (default: email cadastrado do cliente)',
    example: 'financeiro@exemplo.com.br',
  })
  @IsOptional()
  @IsEmail()
  emailDestinatario?: string;

  @ApiPropertyOptional({
    description: 'ID do template a usar (default: resolução por tipoDocumento)',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Setor responsável (default: setor do cliente)',
    example: 'Fiscal',
  })
  @IsOptional()
  @IsString()
  setor?: string;
}