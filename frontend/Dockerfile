# =================================================================
# 🐳 FRONTEND — Next.js 16 (standalone output) — CORRIGIDO Sprint 31
# =================================================================

# ---------------- Stage 1: Builder ----------------
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------------- Stage 2: Runner ----------------
FROM node:20-alpine AS runner

# 1) Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 2) Criar /app com permissão para nextjs
RUN mkdir -p /app && chown nextjs:nodejs /app

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 3) Troca de usuário
USER nextjs

# 4) Copia artefatos do standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]