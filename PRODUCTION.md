# 🚀 Guia de Deploy em Produção

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