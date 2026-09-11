import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class VincularClienteDto {
  @ApiProperty({ description: 'ID do cliente a vincular' })
  @IsUUID()
  clienteId: string;

  @ApiPropertyOptional({
    description: 'Override do email (se cliente cadastrado não tiver email)',
  })
  @IsOptional()
  @IsEmail()
  emailDestinatario?: string;
}