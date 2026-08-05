import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o usuário autenticado do request de forma limpa.
 * Uso: @CurrentUser() user: UserPayload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Assume que o JwtAuthGuard já populou request.user
  },
);