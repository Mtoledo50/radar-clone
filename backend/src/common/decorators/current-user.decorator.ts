// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export interface UserPayload {
  sub: string;       // userId
  companyId: string; // Essencial para SaaS (Multi-tenancy)
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // Isso evita o TypeError e retorna HTTP 401 automaticamente
      throw new UnauthorizedException('Token ausente ou inválido. Faça login novamente.');
    }

    return data ? user[data] : user;
  },
);