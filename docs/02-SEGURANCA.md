# 🔐 Segurança — Checklist de Blindagem

## P0 — Já existe (manter)
- [x] JWT + refresh token; senha com bcrypt
- [x] ForcePasswordChange no 1º acesso
- [x] Multi-tenant por `companyId` em todas as queries
- [x] Roles (ADMIN/USER) + `allowedModules` por usuário
- [x] Sentry (SentryExceptionFilter)

## P1 — Fazer agora (hardening)
- [ ] `helmet` + CORS com allowlist fixa (não `*`)
- [ ] `@nestjs/throttler` (rate limit) em auth e uploads
- [ ] DTOs com class-validator em **100%** dos endpoints
- [ ] Uploads: limite de tamanho + whitelist de extensões + MIME check
- [ ] `.env` fora do git + rotação do `JWT_SECRET`

## P2 — Evolução
- [ ] Auditoria de operações sensíveis (delete, export, conciliação)
- [ ] Row-Level Security (RLS) no Postgres como 2ª barreira de tenant
- [ ] 2FA para ADMIN
- [ ] Scan de dependências (npm audit) no CI

## Checklist de segurança para NOVO endpoint
- [ ] Autenticado (Guard JWT)?
- [ ] Filtra `companyId` do usuário logado (nunca da URL/body)?
- [ ] Valida body/params com DTO?
- [ ] Retorna 401/403/404 corretos (sem 500 vazar stack)?