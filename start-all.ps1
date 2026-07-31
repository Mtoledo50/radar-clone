# ============================================================
# RADAR CLONE - Iniciar Backend e Frontend juntos
# ============================================================

Write-Host "Iniciando Radar Clone..." -ForegroundColor Cyan
Write-Host ""

$projectPath = "H:\radar-clone"
$backendPath = "$projectPath\backend"
$frontendPath = "$projectPath\frontend"

Write-Host "Backend: $backendPath" -ForegroundColor Green
Write-Host "Frontend: $frontendPath" -ForegroundColor Green
Write-Host ""

# INICIAR BACKEND
Write-Host "Iniciando BACKEND (porta 3001)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend iniciando...' -ForegroundColor Cyan; npm run start:dev"

Start-Sleep -Seconds 2

# INICIAR FRONTEND  
Write-Host "Iniciando FRONTEND (porta 3000)..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend iniciando...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "OK! Dois terminais foram abertos!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar: feche os terminais ou pressione Ctrl+C" -ForegroundColor Gray
Write-Host ""