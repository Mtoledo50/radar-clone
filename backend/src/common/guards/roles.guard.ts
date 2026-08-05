import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * =================================================================
 * 🛡️ RolesGuard — Autorização por Roles (RBAC)
 * =================================================================
 * Valida se o usuário autenticado possui a role necessária para
 * acessar a rota. Deve ser usado SEMPRE após o JwtAuthGuard.
 * 
 * Ordem correta:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 * 
 * Se a rota não tiver @Roles(), o guard permite a passagem
 * (a autenticação já foi garantida pelo JwtAuthGuard).
 * =================================================================
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lê as roles necessárias do metadata (@Roles)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Se não há @Roles(), permite (rota autenticada comum)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Obtém o usuário do request (populado pelo JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Acesso negado: não autenticado.');
    }

    // 4. Verifica se o usuário possui alguma das roles exigidas
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Acesso negado: você não tem permissão para esta operação.',
      );
    }

    return true;
  }
}