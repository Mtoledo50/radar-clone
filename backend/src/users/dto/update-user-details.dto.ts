import { IsString, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

// =================================================================
// DTO para atualizar dados básicos do User (Login/RBAC)
// =================================================================
export class UpdateUserDetailsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// =================================================================
// DTO para atualizar dados do Colaborador (RH)
// =================================================================
export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;
}

// =================================================================
// DTO para atualizar Permissões (Bitmask)
// =================================================================
export class UpdateUserPermissionsDto {
  @IsOptional()
  @IsString() // Recebe como string do frontend para evitar perda de precisão do BigInt
  permissions?: string;
}