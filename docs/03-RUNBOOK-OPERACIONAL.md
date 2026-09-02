# 🚨 Runbook Operacional

## Boot local
`powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1`

## Migrações
- DEV: `npx prisma db push` (ADR-026: evita shadow database)
- PROD: `npx prisma migrate deploy` (somente migrations commitadas)
- NUNCA alterar tabelas em produção manualmente.

## Backup
- Diário: `pg_dump -h localhost -p 5433 -U postgres radar_db > backup-$(date +%F).dump`
- Manter 30 dias; teste de restore **mensal** em banco temporário.

## Incidente: "frontend não carrega / ERR_CONNECTION_REFUSED"
1. Backend no ar? `Invoke-WebRequest http://localhost:3001/health`
2. Se não: `npm run start:dev` no backend e leia a PRIMEIRA linha de erro.
3. Erro de módulo não encontrado → ver 01-PADRAO (regra 4).
4. EPERM/lock de arquivo → `taskkill /F /IM node.exe` e reiniciar.
5. Postgres fora → subir Docker/serviço e retestar health.

## Rollback
`git tag` lista checkpoints → `git checkout <tag>` → boot.
Produção: deploy sempre a partir de tag `stable-*`.