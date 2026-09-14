# 🚀 Guia de Deploy em Produção — Radar Conta Certa

## Variáveis de Ambiente Obrigatórias

### Backend (`.env`)

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@host:5432/radar_db?schema=public"

# JWT
JWT_SECRET="chave-super-segura-com-64-caracteres-minimo"
JWT_EXPIRATION="7d"

# Sentry (Monitoramento) - Opcional
SENTRY_DSN="https://seu-dsn@sentry.io/projeto"

# Aplicação
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://radar.contacerta.com.br"

# 🆕 Watch Folder (Módulo de Comunicados)
WATCH_FOLDER_PATH="/var/radar/documentos/enviar"
WATCH_FOLDER_ENABLED=true

# 🆕 Email Provider (Módulo de Comunicados)
EMAIL_PROVIDER=smtp  # opções: "smtp", "log", "sendgrid"

# 🆕 SMTP (Gmail/Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@contacerta.com.br
SMTP_PASS=senha-de-app-16-caracteres  # Gmail: gerar em "Senhas de App"
SMTP_FROM="Conta Certa <seu-email@contacerta.com.br>"

# 🆕 Token de Download (Módulo de Comunicados)
DOC_LINK_TTL_DAYS=7  # expiração do link de download em dias

# 🆕 Retry Automático (Módulo de Comunicados)
EMAIL_RETRY_MAX_ATTEMPTS=3
EMAIL_RETRY_BACKOFF_MIN=1,5,25  # minutos entre tentativas (backoff exponencial)

# 🚀 Guia de Deploy em Produção — Radar Conta Certa

## Variáveis de Ambiente Obrigatórias

### Backend (`.env`)

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@host:5432/radar_db?schema=public"

# JWT
JWT_SECRET="chave-super-segura-com-64-caracteres-minimo"
JWT_EXPIRATION="7d"

# Sentry (Monitoramento) - Opcional
SENTRY_DSN="https://seu-dsn@sentry.io/projeto"

# Aplicação
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://radar.contacerta.com.br"

# 🆕 Watch Folder (Módulo de Comunicados)
WATCH_FOLDER_PATH="/var/radar/documentos/enviar"
WATCH_FOLDER_ENABLED=true

# 🆕 Email Provider (Módulo de Comunicados)
EMAIL_PROVIDER=smtp  # opções: "smtp", "log", "sendgrid"

# 🆕 SMTP (Gmail/Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@contacerta.com.br
SMTP_PASS=senha-de-app-16-caracteres  # Gmail: gerar em "Senhas de App"
SMTP_FROM="Conta Certa <seu-email@contacerta.com.br>"

# 🆕 Token de Download (Módulo de Comunicados)
DOC_LINK_TTL_DAYS=7  # expiração do link de download em dias

# 🆕 Retry Automático (Módulo de Comunicados)
EMAIL_RETRY_MAX_ATTEMPTS=3
EMAIL_RETRY_BACKOFF_MIN=1,5,25  # minutos entre tentativas (backoff exponencial)

🏗️ Infraestrutura de Produção
1. Servidor de Aplicação
Node.js 20 LTS
PostgreSQL 15+
PM2 ou Docker para gerenciamento de processos
Nginx como reverse proxy (SSL termination, caching, load balancing)
2. Domínios e SSL
radar.contacerta.com.br → Frontend (Next.js)
radar-api.contacerta.com.br → Backend (NestJS)
extrator.contacerta.com.br → Extrator Bancário (FastAPI)
SSL: Let's Encrypt (Certbot) ou Cloudflare (túnel)
3. Banco de Dados
PostgreSQL 15+ em servidor dedicado ou gerenciado (AWS RDS, Supabase, Neon)
Backups automáticos diários (pg_dump + upload para S3)
Conexões: max_connections = 100 (ajustar conforme carga)
Índices: criar índices compostos para queries frequentes (ver schema.prisma)
4. Watch Folder (Produção)
Caminho: /var/radar/documentos/enviar (ou volume Docker)
Permissões: usuário do Node.js deve ter read/write
Estrutura de pastas:

  /var/radar/documentos/enviar/
  ├── pendentes/
  ├── enviados/
  │

  Backup: incluir no script de backup diário
5. SMTP (Produção)
Recomendado: SendGrid, Mailgun, ou AWS SES (mais confiável que Gmail)
Gmail/Workspace: usar "Senhas de App" (não senha normal), limite de 500 emails/dia
Monitoramento: logs de falha SMTP → alertas via Sentry
6. Monitoring e Logging
Sentry: erros de aplicação (frontend + backend)
Logs estruturados: Winston ou Pino (JSON) → ELK Stack ou CloudWatch
Health checks: endpoint /health para load balancer

🚀 Deploy com Docker Compose
docker-compose.prod.yml

