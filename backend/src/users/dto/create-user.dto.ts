import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  password?: string; // Se não enviado, o backend gera uma provisória
  
}

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsString()
  currentPassword?: string; // Obrigatória apenas se NÃO estiver em modo de troca forçada

  @IsString()
  newPassword: string;
}