Status: ✅ Implementada
Data: 09/10/2026
Contexto:
Sistema rodava apenas em localhost. Necessário expor à internet de forma segura, sem abrir portas no roteador.
Decisão:
Usar Cloudflare Tunnel (cloudflared) instalado como serviço do Windows.
Rotas configuradas:

Domínio
Porta Local
Serviço
www.contacerta.com.br
5173
Site Conta Certa (Vite)
api.contacerta.com.br
4000
Backend Site (Node)
radar.contacerta.com.br
3000
Frontend Radar (Next.js)
radar-api.contacerta.com.br
3001
Backend Radar (NestJS)
extrator.contacerta.com.br
5174
Frontend Extrator (Vite)

Configuração Backend (backend/.env):

EMAIL_PROVIDER=smtp
PUBLIC_BASE_URL=https://radar-api.contacerta.com.br
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=atendimento@contacerta.com.br
SMTP_PASS=<senha_de_app_16_caracteres>
SMTP_FROM=atendimento@contacerta.com.br

Configuração Frontend Radar (frontend/.env.local):

NEXT_PUBLIC_API_URL=https://radar-api.contacerta.com.br

CORS (backend/src/main.ts):
Já configurado para aceitar múltiplas origens (localhost + domínios Cloudflare).

