# ============================================================================
# RADAR CONTA CERTA — Backend (NestJS 10)
# Sprint 31 — Multi-stage build: imagem leve e reproduzível
# ============================================================================

# ---------- ESTÁGIO 1: builder (compila tudo) ----------
FROM node:20-alpine AS builder
WORKDIR /app

# 1) Só os manifests primeiro → aproveita o cache do Docker
#    (não reinstala deps a cada mudança de código)
COPY package*.json ./
COPY prisma ./prisma

# 2) Instala TUDO (inclui dev: typescript + prisma CLI)
RUN npm ci

# 3) Código fonte + Prisma Client + build de produção
COPY . .
RUN npx prisma generate
RUN npm run build

# ---------- ESTÁGIO 2: runner (só o que roda) ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# node_modules vai junto porque precisamos do Prisma CLI
# para rodar `prisma migrate deploy` no boot (decisão Sprint 31)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Boot: aplica migrações pendentes → sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]