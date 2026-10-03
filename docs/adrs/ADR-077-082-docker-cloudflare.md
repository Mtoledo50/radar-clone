
---

### 📂 `docs/adrs/ADR-077-082-docker-cloudflare.md`

```markdown
# ADR-077 a ADR-082: Docker, Cloudflare e Produção Local

**Data:** 2026-09  
**Status:** ✅ Aceitas  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O projeto precisa ser containerizado (Docker) e exposto via túnel Cloudflare para acesso remoto.

## 🎯 Decisões Consolidadas

### ADR-077: Postgres Real via `host.docker.internal`
- Container Docker do backend acessa Postgres local (5432) via `host.docker.internal`
- Permite que o Radar use o mesmo banco do Site Conta Certa

### ADR-078: `ignoreBuildErrors` no Build Docker
- Next.js build no Docker ignora erros de TypeScript (temporariamente)
- Motivo: Erros legados bloqueavam o build de produção
- Plano: Corrigir todos os erros e remover essa flag (Sprint 33)

### ADR-079: Túnel Único Site + Radar
- Um único túnel Cloudflare expõe ambos: `radar.contacerta.com.br` e `radar-api.contacerta.com.br`
- Reduz complexidade de configuração

### ADR-080: `migrate resolve --applied`
- Para migrations cujo DDL já existe no banco, usar `migrate resolve` em vez de `migrate deploy`
- Evita erro P3009 (migration já aplicada)

### ADR-081: Env de Build > `.env.local`
- Variáveis de ambiente passadas no `docker build` (via `ARG`/`ENV`) sobrescrevem `.env.local`
- Garante que o build de produção use URLs reais (`https://radar-api.contacerta.com.br`)

### ADR-082: Scroll Suave Nativo
- Substituir `<Link to="/#secao">` (react-router) por `<a href="#secao">` + `scrollIntoView({ behavior: 'smooth' })`
- Motivo: react-router não faz scroll em âncoras

---

## 💡 Implementação

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: radar
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@host.docker.internal:5432/radar
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: https://radar-api.contacerta.com.br
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://radar-api.contacerta.com.br

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}

volumes:
  pgdata:

Dockerfile Backend

# backend/Dockerfile
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/main.js"]

Dockerfile Frontend
# frontend/Dockerfile
FROM node:20-slim AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim

WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

CMD ["node", "server.js"]

✅ Consequências

Positivas

✅ Containerização: Ambiente consistente entre dev e produção
✅ Acesso Remoto: Túnel Cloudflare permite acesso de qualquer lugar
✅ Build Otimizado: Multi-stage reduz tamanho da imagem final

Negativas

❌ Complexidade: Exige conhecimento de Docker e Cloudflare
❌ ignoreBuildErrors: Mascara erros de TypeScript (deve ser removido)

📚 Referências

Arquivos que usam estas ADRs:

docker-compose.yml
backend/Dockerfile
frontend/Dockerfile
frontend/next.config.mjs

ADRs relacionadas:

ADR-031 (Containerização)
ADR-032 (Produção local)

🔄 Histórico de Revisões

Data                    Autor               Mudança
2026-09                 Marcos Toledo       Criação inicial (ADRs 077-082 consolidadas)