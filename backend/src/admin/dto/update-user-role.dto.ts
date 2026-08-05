import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

/**
 * DTO para atualizar role de usuário
 */
export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'Role inválida.' })
  role: UserRole;
}