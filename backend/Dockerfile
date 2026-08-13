# =================================================================
# 🐳 BACKEND — NestJS (multi-stage build) — CORRIGIDO Sprint 31
# =================================================================

# ---------------- Stage 1: Builder (compila como root, tudo bem) ----------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ---------------- Stage 2: Runner (produção, usuário não-root) ----------------
FROM node:20-alpine AS runner

# 1) Criar usuário não-root PRIMEIRO
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 2) Criar /app e dar permissão ao nestjs (ANTES do WORKDIR)
RUN mkdir -p /app && chown nestjs:nodejs /app

# 3) WORKDIR herda o dono do diretório (nestjs)
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# 4) Agora SIM troca de usuário — todos os comandos a seguir rodam como nestjs
USER nestjs

# 5) Copia package*.json (dono já é nestjs pelo WORKDIR)
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 6) Instala deps de produção (AGORA funciona — /app pertence ao nestjs)
RUN npm ci --omit=dev --no-audit --no-fund

# 7) Copia artefatos compilados
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001

CMD ["node", "dist/main.js"]