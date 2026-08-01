import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Decorator para definir qual módulo é necessário para acessar a rota
export const REQUIRED_MODULE = 'required_module';
export const RequireModule = (module: string) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRED_MODULE, module, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Preenchido pelo JwtAuthGuard

    // 1. Se for ADMIN (dono do SaaS), tem acesso a TUDO
    if (user?.role === 'ADMIN') {
      return true;
    }

    // 2. Pega o módulo necessário definido no Controller
    const requiredModule = this.reflector.get<string>(
      REQUIRED_MODULE,
      context.getHandler(),
    );

    // Se não exigir módulo específico, libera (ex: rotas de perfil)
    if (!requiredModule) {
      return true;
    }

    // 3. Verifica se o módulo está na lista de permitidos do usuário
    const allowedModules = user?.allowedModules || [];
    const hasAccess = allowedModules.includes(requiredModule);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Seu plano atual não inclui acesso ao módulo '${requiredModule}'. Entre em contato com o suporte para upgrade.`
      );
    }

    return true;
  }
}