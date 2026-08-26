# =================================================================
# RADAR FRONTEND — Next.js standalone (Sprint 32 + ADR-081)
# =================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# 🆕 ADR-081: variável de ambiente REAL vence o .env.local no build
ARG NEXT_PUBLIC_API_URL=https://radar-api.contacerta.com.br
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]