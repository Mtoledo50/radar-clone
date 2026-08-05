import { SetMetadata } from '@nestjs/common';

/**
 * Chave usada pelo RolesGuard para ler as roles necessárias
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator para marcar rotas que exigem roles específicas.
 * 
 * Uso:
 *   @Roles('ADMIN')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 * 
 * @param roles - Lista de roles permitidas (ex: 'ADMIN', 'MANAGER')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);