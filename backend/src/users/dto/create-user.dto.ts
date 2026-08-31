// =================================================================
// ARQUIVO: backend/src/users/dto/create-user.dto.ts
// DTOs do Módulo de Usuários (Validação de entrada com class-validator)
// =================================================================
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

// -----------------------------------------------------------------
// Criação de usuário (POST /users)
// -----------------------------------------------------------------
export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  password?: string; // Se não enviado, o backend gera senha provisória
}

// -----------------------------------------------------------------
// Atualização de usuário (PATCH /users/:id)
// -----------------------------------------------------------------
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// -----------------------------------------------------------------
// 🆕 Alteração de senha (PATCH /users/me/password)
// -----------------------------------------------------------------
export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  currentPassword?: string; // Obrigatória apenas fora do modo de troca forçada

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  newPassword: string;
}