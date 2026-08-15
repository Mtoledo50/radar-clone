# =================================================================
# INÍCIO: backend/start-clean.ps1
# =================================================================
# Script de limpeza: mata processos que seguram a porta 3001
# antes de subir o backend em modo dev.
# Uso: .\start-clean.ps1
# =================================================================

Write-Host "🔍 Procurando processos na porta 3001..." -ForegroundColor Cyan

$conexoes = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue

if ($conexoes) {
    foreach ($conexao in $conexoes) {
        $processo = Get-Process -Id $conexao.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "🔪 Matando processo: $($processo.ProcessName) (PID $($conexao.OwningProcess))" -ForegroundColor Yellow
        Stop-Process -Id $conexao.OwningProcess -Force
    }
    Start-Sleep -Seconds 2
    Write-Host "✅ Porta 3001 liberada!" -ForegroundColor Green
} else {
    Write-Host "✅ Porta 3001 já está livre." -ForegroundColor Green
}

Write-Host "🚀 Iniciando o backend..." -ForegroundColor Cyan
npm run start:dev
# =================================================================
# FIM: backend/start-clean.ps1
# =================================================================