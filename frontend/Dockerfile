# ============================================================================
# RADAR CONTA CERTA — Frontend (Next.js 16)
# Sprint 31 — Standalone Output (padrão Enterprise p/ Docker)
# ============================================================================

# ---------- ESTÁGIO 1: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# ⚠️ NEXT_PUBLIC_* é "assado" NO BUILD (o browser usa essa URL).
# Como o browser roda FORA do Docker, apontamos para localhost:3001.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_NAME="Radar Conta Certa"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

RUN npm run build

# ---------- ESTÁGIO 2: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Standalone = servidor Next autossuficiente (sem node_modules gigante)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]