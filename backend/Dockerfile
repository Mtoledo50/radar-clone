# =================================================================
# 🐳 Dockerfile Backend — Radar Conta Certa (Sprint 31)
# =================================================================
# DECISÃO TÉCNICA (ADR-style):
# Trocamos de Alpine para Debian-slim porque o Prisma 5.x tem
# incompatibilidade conhecida com musl libc (Alpine). Os binários
# do query-engine/schema-engine exigem glibc + OpenSSL específico.
# =================================================================

# ================================================================
# 🏗️ Estágio 1: Builder (compila TypeScript + gera cliente Prisma)
# ================================================================
FROM node:20-slim AS builder

WORKDIR /app

# 📦 Instala dependências do sistema (OpenSSL para o Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 📥 Copia arquivos de dependências e instala (cache do Docker)
COPY package*.json ./
RUN npm ci

# 📋 Copia schema do Prisma e gera o client (necessário para build)
COPY prisma ./prisma
RUN npx prisma generate

# 📝 Copia resto do código e compila TypeScript
COPY . .
RUN npm run build

# ================================================================
# 🚀 Estágio 2: Runner (imagem de produção enxuta)
# ================================================================
FROM node:20-slim AS runner

WORKDIR /app

# 🔒 Variáveis de ambiente de produção
ENV NODE_ENV=production

# 📦 Instala OpenSSL no runtime (Prisma precisa para conectar ao Postgres)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 📥 Copia artefatos do estágio builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# 🌐 Expõe porta do NestJS
EXPOSE 3001

# 🚀 Comando de inicialização:
# 1. Aplica migrações pendentes no banco (self-healing)
# Comando de inicialização: aplicar schema + rodar servidor
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/main.js"]
