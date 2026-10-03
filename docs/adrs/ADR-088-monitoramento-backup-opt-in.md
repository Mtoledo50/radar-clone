
---

### 📂 `docs/adrs/ADR-088-monitoramento-backup-opt-in.md`

```markdown
# ADR-088: Monitoramento e Backup Opt-In por Variável de Ambiente

**Data:** 2026-08-27  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim

---

## 📋 Contexto

O sistema precisa de monitoramento de erros (Sentry) e backup automático do banco de dados, mas nem todos os ambientes (dev, staging, produção) devem ter essas features ativas.

**Problema:**
- Sentry sem DSN configurado gera erros de inicialização
- Backup automático em dev é desnecessário e consome recursos

## 🎯 Decisão

**Opt-In por Variável de Ambiente:**

1. **Sentry:**
   - Se `SENTRY_DSN` não estiver definido, Sentry é desativado silenciosamente
   - Zero erros de inicialização, zero overhead em dev

2. **Backup Automático:**
   - Script `backup-radar-db.ps1` só executa se `BACKUP_ENABLED=true`
   - Agendado via Task Scheduler (Windows) ou cron (Linux)

3. **CD Local:**
   - Script de deploy local é idempotente e seguro
   - Produção on-prem (sem CI/CD complexo)

## 💡 Implementação

### Sentry Opt-In

```typescript
// backend/src/main.ts

import * as Sentry from '@sentry/node';

const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
  console.log('✅ Sentry inicializado');
} else {
  console.log('ℹ️  Sentry desativado (SENTRY_DSN não definido)');
}

Backup Script

# backup-radar-db.ps1

if ($env:BACKUP_ENABLED -ne 'true') {
  Write-Host "ℹ️  Backup desativado (BACKUP_ENABLED != 'true')"
  exit 0
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "C:\backups\radar_$timestamp.sql"

pg_dump -h localhost -p 5433 -U postgres -d radar -F c -f $backupFile

Write-Host "✅ Backup criado: $backupFile"

# Remover backups antigos (> 30 dias)
Get-ChildItem "C:\backups\radar_*.sql" | Where-Object {
  $_.CreationTime -lt (Get-Date).AddDays(-30)
} | Remove-Item

Variáveis de Ambiente

# backend/.env

# Sentry (opcional)
SENTRY_DSN=  # Se vazio, Sentry desativado

# Backup (opcional)
BACKUP_ENABLED=false  # true apenas em produção

✅ Consequências

Positivas

✅ Zero Overhead em Dev: Sentry e backup não rodam em dev
✅ Flexibilidade: Cada ambiente controla suas features
✅ Seguro: Script de backup é idempotente


Negativas

❌ Configuração: Exige definir variáveis de ambiente corretamente

📚 Referências

Arquivos que usam esta ADR:

backend/src/main.ts (Sentry opt-in)
scripts/backup-radar-db.ps1 (backup opt-in)

ADRs relacionadas:

ADR-089 (Ajuda contextual)
ADR-090 (Catálogo de ajuda)

🔄 Histórico de Revisões

Data                    Autor                   Mudança
2026-08-27              Marcos Toledo           Criação inicial