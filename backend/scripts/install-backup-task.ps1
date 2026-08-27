# =================================================================
# install-backup-task.ps1 — agenda backup diário 02:00 (Sprint 33)
# Requer: PowerShell como Administrador (tarefa roda como SYSTEM).
# =================================================================
$script = Join-Path $PSScriptRoot "backup-radar-db.ps1"

schtasks /Create /TN "RadarBackupDaily" `
  /TR "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`"" `
  /SC DAILY /ST 02:00 /RU SYSTEM /F

schtasks /Query /TN "RadarBackupDaily"
Write-Host "✅ Tarefa RadarBackupDaily instalada (diária 02:00)"