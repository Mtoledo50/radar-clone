# Ordem correta de boot (evita ERR_CONNECTION_REFUSED)
Write-Host "🧹 Limpando processos node..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

Write-Host "🐘 Checando PostgreSQL (5433)..." -ForegroundColor Yellow
$c = Test-NetConnection -ComputerName localhost -Port 5433 -WarningAction SilentlyContinue
if (-not $c.TcpTestSucceeded) { Write-Host "❌ Postgres fora. Suba o Docker/serviço." -ForegroundColor Red; exit 1 }

Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$PSScriptRoot\..\backend'; npm run start:dev"

Write-Host "⏳ Aguardando backend (health)..." -ForegroundColor Yellow
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep 2
  try { $r = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $ok = $true; break } } catch {}
}
if (-not $ok) { Write-Host "❌ Backend não respondeu em 60s." -ForegroundColor Red; exit 1 }

Write-Host "✅ Backend OK. Subindo frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$PSScriptRoot\..\frontend'; npm run dev"