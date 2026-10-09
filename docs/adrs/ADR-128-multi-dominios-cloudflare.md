
---

##  `docs/ADR-121-multi-dominios-cloudflare.md`

```markdown
# ADR-121: Multi-domínios via Cloudflare Tunnel (Produção)

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim (basta remover rotas no painel Zero Trust)

---

## 📋 Contexto

O sistema Radar Conta Certa rodava exclusivamente em `localhost`, acessível apenas na máquina de desenvolvimento. Para disponibilizar o sistema a clientes reais (acesso remoto, mobile, home office), era necessário expor os serviços à internet.

**Restrições:**
- Não abrir portas no roteador (risco de segurança)
- Não depender de servidor cloud dedicado (custo inicial)
- Manter SSL/HTTPS em todos os domínios
- Suportar múltiplos subdomínios (site, radar, api, extrator)

---

## 🎯 Decisão

Adotar **Cloudflare Tunnel** (`cloudflared`) como camada de exposição pública, instalado como **serviço do Windows** para persistência entre reinicializações.

### Arquitetura

[Cliente Internet]
│
▼
[Cloudflare Edge] ← SSL termination
│
▼
[Cloudflare Tunnel] ← criptografado
│
▼
[cloudflared no Windows] ← serviço
│
├──► localhost:5173 → www.contacerta.com.br (Site Vite)
├──► localhost:4000 → api.contacerta.com.br (Backend Site Node)
├──► localhost:3000 → radar.contacerta.com.br (Frontend Radar Next.js)
├──► localhost:3001 → radar-api.contacerta.com.br (Backend Radar NestJS)
└──► localhost:5174 → extrator.contacerta.com.br (Frontend Extrator Vite)


### Rotas configuradas no Cloudflare Zero Trust

| Hostname | Service | Aplicação |
|----------|---------|-----------|
| `www.contacerta.com.br` | `http://127.0.0.1:5173` | Site institucional (Vite/React) |
| `api.contacerta.com.br` | `http://127.0.0.1:4000` | Backend do site (Node/Express) |
| `radar.contacerta.com.br` | `http://127.0.0.1:3000` | Frontend do Radar (Next.js 16) |
| `radar-api.contacerta.com.br` | `http://127.0.0.1:3001` | API do Radar (NestJS) |
| `extrator.contacerta.com.br` | `http://127.0.0.1:5174` | Frontend do Extrator Bancário (Vite) |

---

## 💡 Implementação

### 1. Instalação do cloudflared como serviço

```powershell
# PowerShell como Administrador
cloudflared service install <TOKEN_DO_TUNNEL>

Verificação:

Get-Service -Name cloudflared   # Status: Running, Startup: Automatic

2. Configuração do Backend (backend/.env)
# Provider de e-mail (SMTP real, não LOG)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=atendimento@contacerta.com.br
SMTP_PASS=<senha_de_app_16_caracteres>
SMTP_FROM=atendimento@contacerta.com.br

# URL pública (usada em links de tracking, download, reset de senha)
PUBLIC_BASE_URL=https://radar-api.contacerta.com.br

⚠️ Senha de App Gmail: gerada em myaccount.google.com → Segurança → Verificação em 2 etapas → Senhas de app. A senha normal da conta é rejeitada pelo Google.
3. Configuração do Frontend Radar (frontend/.env.local)
NEXT_PUBLIC_API_URL=https://radar-api.contacerta.com.br
4. CORS no Backend (backend/src/main.ts)
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://radar.contacerta.com.br',
    'https://www.contacerta.com.br',
    'https://extrator.contacerta.com.br',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
5. Configuração do Vite (Site conta-certa/frontend/vite.config.ts)
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'www.contacerta.com.br',
      'contacerta.com.br',
      '.contacerta.com.br', // qualquer subdomínio
    ],
  },
});
✅ Consequências
Positivas
Zero configuração de rede: sem abrir portas, sem DDNS, sem IP fixo
SSL automático: Cloudflare gerencia certificados Let's Encrypt
CDN global: conteúdo estático servido de edge locations próximas ao cliente
Proteção DDoS: filtro do Cloudflare antes de chegar ao servidor local
Multi-domínio: um único túnel serve 5 aplicações diferentes
Custo zero: plano free do Cloudflare suporta tráfego ilimitado para tunnels
Negativas
Dependência de uptime local: se o PC desligar, o site sai do ar (mitigável no futuro com VPS)
Latência adicional: ~20-50ms de overhead pelo túnel criptografado
Limitação de upload: Cloudflare free tem limite de 100MB por request
Riscos mitigados
Queda do túnel: serviço Windows reinicia automaticamente; alertas configuráveis no Zero Trust
Exposição indevida: apenas as portas mapeadas nas rotas são acessíveis; o resto do PC permanece invisível
Ataque direto ao IP: IP real do servidor fica oculto atrás da rede Cloudflare
📚 Referências
ADRs relacionadas: ADR-079 (Túnel único — predecessora), ADR-105 (CORS multi-origem)
Documentação oficial: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
Arquivos modificados:
backend/.env
frontend/.env.local
backend/src/main.ts (CORS)
Site conta-certa/frontend/vite.config.ts (allowedHosts)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial — 5 rotas configuradas e testadas via 4G/5G
2026-10-09
Marcos Toledo
Adicionado allowedHosts no Vite para evitar "Invalid Host header"

