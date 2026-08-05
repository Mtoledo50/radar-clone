import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * DTO para onboard de novo cliente (empresa + usuário admin)
 */
export class OnboardClientDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  userName: string;

  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres.' })
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModules?: string[];
}