# =================================================================
# deploy-local.ps1 — CD local: rebuild + up dos containers do Radar
# Uso: quando o Docker Desktop estiver estável (paridade dev/prod).
# =================================================================
param([string]$ComposeDir = "C:\Site conta-certa")

pushd $ComposeDir
docker compose build radar-backend radar-frontend
docker compose up -d radar-backend radar-frontend
Start-Sleep -Seconds 20
docker compose ps
popd

$r = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 30
if ($r.StatusCode -eq 200) { Write-Host "✅ Deploy local OK (frontend 200)" }
else { throw "Frontend respondeu $($r.StatusCode)" }