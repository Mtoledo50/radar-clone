# =================================================================
# backup-radar-db.ps1 — Sprint 33 (ADR-088)
# Dump do radar_db c/ verificação de integridade + retenção.
# Uso manual: powershell -File backup-radar-db.ps1
# Uso agendado: install-backup-task.ps1
# =================================================================
param(
  [string]$PgBin     = "C:\Program Files\PostgreSQL\18\bin",
  [string]$BackupDir = (Join-Path $PSScriptRoot "..\..\backups"),
  [string]$DbUser    = "radar_user",
  [string]$DbName    = "radar_db",
  [int]   $Keep      = 14
)
$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$file  = Join-Path $BackupDir "radar_db_$stamp.dump"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# 1) Dump (formato custom = compacto + restore seletivo)
$env:PGPASSWORD = "radar_password"
& "$PgBin\pg_dump.exe" -U $DbUser -h localhost -p 5432 -d $DbName -F c -f $file
if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou (exit $LASTEXITCODE)" }

# 2) Verificação de integridade (lista o índice do dump)
& "$PgBin\pg_restore.exe" --list $file | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Backup CORROMPIDO: $file" }

# 3) Retenção: mantém os $Keep mais recentes
Get-ChildItem $BackupDir -Filter "radar_db_*.dump" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip $Keep |
  Remove-Item -Force

# 4) Log
$size = (Get-Item $file).Length
"[$(Get-Date -Format 's')] OK $file ($size bytes)" |
  Add-Content (Join-Path $BackupDir "backup.log")

Write-Host "✅ Backup OK: $file ($size bytes)"