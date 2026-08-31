# ============================================================
# RADAR CONTA CERTA - Iniciar Ambiente de Desenvolvimento
# ============================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO RADAR CONTA CERTA (SaaS Enterprise)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. DEFINIR CAMINHOS (Ajustado para o seu ambiente real)
$projectPath = "C:\Site conta-certa\radar-clone"
$backendPath = "$projectPath\backend"
$frontendPath = "$projectPath\frontend"

Write-Host "[1/4] Verificando estrutura de pastas..." -ForegroundColor Yellow
if (!(Test-Path $backendPath) -or !(Test-Path $frontendPath)) {
    Write-Host "ERRO CRÍTICO: Pastas 'backend' ou 'frontend' não encontradas." -ForegroundColor Red
    Write-Host "Verifique se o caminho está correto: $projectPath" -ForegroundColor Red
    pause
    exit
}
Write-Host "OK! Estrutura validada." -ForegroundColor Green
Write-Host ""

# 2. GARANTIR QUE O BANCO DE DADOS (DOCKER) ESTÁ RODANDO
Write-Host "[2/4] Garantindo que o Banco de Dados (Docker) está ativo..." -ForegroundColor Yellow
Set-Location $projectPath
# O comando abaixo inicia o postgres em background. Se já estiver rodando, o Docker ignora silenciosamente.
docker compose up -d postgres | Out-Null
Write-Host "OK! Banco de dados garantido na porta 5433." -ForegroundColor Green
Write-Host ""

# 3. INICIAR BACKEND (Nova Janela)
Write-Host "[3/4] Iniciando BACKEND (NestJS - Porta 3001)..." -ForegroundColor Yellow
$backendCmd = "cd '$backendPath'; Write-Host 'Backend rodando...' -ForegroundColor Green; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Sleep -Seconds 3 # Aguarda um pouco para a janela abrir e o Node.js inicializar

# 4. INICIAR FRONTEND (Nova Janela)
Write-Host "[4/4] Iniciando FRONTEND (Next.js - Porta 3000)..." -ForegroundColor Yellow
$frontendCmd = "cd '$frontendPath'; Write-Host 'Frontend rodando...' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  AMBIENTE INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciais de Teste (Seed):" -ForegroundColor Yellow
Write-Host "  Email: admin@contacerta.com.br" -ForegroundColor White
Write-Host "  Senha: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "Para parar o sistema, basta fechar as janelas do PowerShell que abriram." -ForegroundColor Gray
Write-Host ""