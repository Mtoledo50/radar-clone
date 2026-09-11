# backend/backup-db.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$backupFile = "$backupDir\radar_db_$timestamp.sql"
Write-Host "📦 Fazendo backup para: $backupFile" -ForegroundColor Cyan

docker exec -t radar_postgres pg_dump -U postgres radar_db > $backupFile

if ($LASTEXITCODE -eq 0 -and (Test-Path $backupFile)) {
    $size = (Get-Item $backupFile).Length
    Write-Host "✅ Backup concluído: $size bytes" -ForegroundColor Green
} else {
    Write-Host "❌ Backup falhou" -ForegroundColor Red
}