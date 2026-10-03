
---

### 📂 `docs/adrs/ADR-105-cors-multi-origem.md`

```markdown
# ADR-105: CORS Multi-Origem para Comunicação entre Apps

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O ecossistema tem múltiplos frontends comunicando com múltiplos backends:
- Site Conta Certa (5173) → Backend Express (4000)
- Radar Frontend (3002) → Radar Backend (3001)
- Extrator Frontend (5174) → Extrator Backend (8000)
- Radar Frontend (3002) → Extrator Backend (8000) (via proxy)

**Problema:**
CORS bloqueia requisições cross-origin por segurança. Configurar CORS para aceitar todas as origens é inseguro.

## 🎯 Decisão

Configurar CORS para aceitar **lista explícita de origens** via variável de ambiente `CORS_ORIGIN`:

```env
# backend/.env
CORS_ORIGIN=http://localhost:3002,http://localhost:5173,http://localhost:5174,https://radar.contacerta.com.br

Regras:
Lista Branca: Apenas origens listadas em CORS_ORIGIN são aceitas
Credenciais: credentials: true para permitir cookies/JWT
Métodos Permitidos: GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers Permitidos: Content-Type, Authorization

💡 Implementação

Backend NestJS

// backend/src/main.ts

const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

Backend Python (Extrator)

Backend Python (Extrator)


✅ Consequências
Positivas
✅ Seguro: Apenas origens conhecidas são aceitas
✅ Flexível: Fácil adicionar novas origens via .env
✅ Produção: Suporta localhost (dev) e domínio real (prod)
Negativas
❌ Configuração: Exige definir CORS_ORIGIN corretamente em cada ambiente
📚 Referências
Arquivos que usam esta ADR:
backend/src/main.ts
extrator-bancario/backend/app/main.py
ADRs relacionadas:
ADR-106 (Proxy NestJS → Python)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-09
Marcos Toledo
Criação inicial
