#Requires -Version 5.1
# =================================================================
# iniciar-radar.ps1 - Inicializador Unificado (Radar + Site + Extrator)
# =================================================================
# ASCII ONLY: este arquivo NAO pode conter acento, emoji ou travessao.
# Motivo: Windows PowerShell 5.1 le .ps1 na code page do sistema (CP1252);
# caractere unicode vira byte lixo e corrompe as strings do parser.
# =================================================================
<#
.SYNOPSIS
    Inicializador do Radar, Site Conta Certa e (opcionalmente) Extrator.
.DESCRIPTION
    DOIS MODOS - nunca misture Docker e local no MESMO servico:
      -Modo dev  (padrao): Postgres no Docker (5433) + Apps LOCAIS (hot reload).
      -Modo prod          : sobe TUDO no Docker (docker compose up -d --build).
.USAGE
    Rodar sem argumento abre um MENU interativo.
    Rodar com flag pula o menu e usa a flag (modo automacao / CI).
.EXAMPLE
    .\iniciar-radar.ps1                  # abre o menu interativo
    .\iniciar-radar.ps1 -ComSite         # dev + site, sem perguntar
    .\iniciar-radar.ps1 -ComSite -ComExtrator # dev + site + extrator
    .\iniciar-radar.ps1 -Modo prod       # valida build de producao no Docker
#>
param(
    [ValidateSet('dev','prod')] [string]$Modo = 'dev',
    [switch]$ComSite,
    [switch]$ComExtrator,
    [switch]$SkipPortCheck
)

$RAIZ = $PSScriptRoot

# -- Servicos do RADAR -------------------------------------------------------
$RADAR_BE = @{ Port = 3001; Path = "$RAIZ\backend";  Cmd = 'npm run start:dev' }
$RADAR_FE = @{ Port = 3000; Path = "$RAIZ\frontend"; Cmd = 'npm run dev' }

# -- Servicos do SITE CONTA CERTA --------------------------------------------
$SITE_BE  = @{ Port = 4000; Path = "C:\Site conta-certa\backend";  Cmd = 'node server.js' }
$SITE_FE  = @{ Port = 5173; Path = "C:\Site conta-certa\frontend"; Cmd = 'npm run dev' }

# -- Servicos do EXTRATOR (so quando ligado) ---------------------------------
$EXT_BE = @{ Port = 8000; Path = "$RAIZ\extrator-bancario\backend";  Venv = "$RAIZ\extrator-bancario\venv" }
$EXT_FE = @{ Port = 5174; Path = "$RAIZ\extrator-bancario\frontend"; Cmd  = 'npm run dev -- --port 5174' }

# -- Log em arquivo ----------------------------------------------------------
$LOG_DIR  = "$RAIZ\logs"
$LOG_FILE = "$LOG_DIR\boot-radar-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"

function Write-Log([string]$Msg, [string]$Color = 'White') {
    $line = '[' + (Get-Date -Format 'HH:mm:ss') + '] ' + $Msg
    Write-Host $line -ForegroundColor $Color
    if (-not (Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR | Out-Null }
    Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8 -ErrorAction SilentlyContinue
}

function Test-Port([int]$Port) {
    (Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue).TcpTestSucceeded
}

$MATABLES = @('node','python','python3','uvicorn','deno','powershell','pwsh')
function Free-Port([int]$Port) {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($cn in $conns) {
        $p = Get-Process -Id $cn.OwningProcess -ErrorAction SilentlyContinue
        if ($p -and ($p.ProcessName -in $MATABLES)) {
            Write-Log ("  Liberando porta {0} ({1} PID {2})" -f $Port, $p.ProcessName, $p.Id) Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        } elseif ($p) {
            Write-Log ("  Porta {0} segurada por '{1}' (nao-matavel)" -f $Port, $p.ProcessName) DarkYellow
        }
    }
    Start-Sleep -Seconds 1
}

function Open-Window([string]$WorkDir, [string]$Command) {
    Start-Process powershell -ArgumentList '-NoExit','-Command',("Set-Location '" + $WorkDir + "'; " + $Command)
}

function Wait-Port([int]$Port, [int]$TimeoutSec = 90) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $Port) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Wait-PostgresHealthy([int]$TimeoutSec = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $st = docker inspect -f '{{.State.Health.Status}}' radar_postgres 2>$null
        if ($st -eq 'healthy') { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

# =====================================================================
# CAMADA DE ENTRADA: menu interativo OU respeito as flags
# =====================================================================
$LigaSite = $false
$LigaExtrator = $false
$interativo = ($PSBoundParameters.Count -eq 0)

if ($interativo) {
    Write-Host ''
    Write-Host '================================================' -ForegroundColor Cyan
    Write-Host '   INICIALIZADOR UNIFICADO CONTA CERTA' -ForegroundColor Cyan
    Write-Host '================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  [1] Modo DEV  (padrao) - Postgres Docker + Apps locais' -ForegroundColor White
    Write-Host '  [2] Modo PROD         - Tudo no Docker (valida build)' -ForegroundColor White
    Write-Host ''
    
    $respModo = Read-Host '  Escolha o modo (1 ou 2, ENTER=1)'
    $Modo = if ($respModo -eq '2') { 'prod' } else { 'dev' }

    Write-Host ''
    $respSite = Read-Host '  Iniciar Site Conta Certa (4000/5173)? (s/n, ENTER=n)'
    $LigaSite = ($respSite.Trim().ToLower() -eq 's')

    $respExt = Read-Host '  Iniciar Extrator Bancario (8000/5174)? (s/n, ENTER=n)'
    $LigaExtrator = ($respExt.Trim().ToLower() -eq 's')

} else {
    # Veio com flag: respeita e nao pergunta.
    $LigaSite = $ComSite.IsPresent
    $LigaExtrator = $ComExtrator.IsPresent
}

Write-Log ("Boot: modo={0} site={1} extrator={2}" -f $Modo, $(if ($LigaSite) {'sim'} else {'nao'}), $(if ($LigaExtrator) {'sim'} else {'nao'}))

Write-Host ''
Write-Host '================================================' -ForegroundColor Magenta
Write-Host ("  INICIANDO SISTEMAS [modo: {0}]" -f $Modo) -ForegroundColor Magenta
if ($LigaSite) { Write-Host '  + SITE CONTA CERTA' -ForegroundColor Magenta }
if ($LigaExtrator) { Write-Host '  + EXTRATOR BANCARIO' -ForegroundColor Magenta }
Write-Host '================================================' -ForegroundColor Magenta

Push-Location $RAIZ

if ($Modo -eq 'prod') {
    Write-Log '[prod] docker compose up -d --build...' Cyan
    docker compose up -d --build
    Write-Log '[prod] Aguardando Postgres healthy...' Yellow
    if (Wait-PostgresHealthy 60) { Write-Log '  Postgres healthy (5433)' Green } else { Write-Log '  Postgres NAO ficou healthy' Red }
    Start-Sleep -Seconds 5
    docker compose ps
    Pop-Location
    Write-Host ''
    Write-Host '[OK] MODO PROD: Docker completo no ar.' -ForegroundColor Green
    Write-Host "Log: $LOG_FILE" -ForegroundColor Gray
    return
}

# =====================================================================
# MODO DEV (padrao): Postgres no Docker + Apps locais.
# =====================================================================

# [1] Postgres no Docker
Write-Log '[1/5] Subindo/verificando Postgres Docker (5433)...' Cyan
docker compose up -d postgres 2>&1 | Out-Null
if (Wait-PostgresHealthy 60) { Write-Log '  Postgres Docker OK (healthy)' Green }
else { Write-Log '  Postgres Docker NAO ficou healthy' Red }

Write-Log '  Parando e removendo containers backend/frontend do Docker (modo dev usa locais)...' DarkGray
docker compose stop backend frontend 2>&1 | Out-Null
docker compose rm -f backend frontend 2>&1 | Out-Null

# [2] Liberar portas DOS PROCESSOS LOCAIS
if (-not $SkipPortCheck) {
    Write-Log '[2/5] Liberando portas de apps locais...' Cyan
    Free-Port $RADAR_BE.Port
    Free-Port $RADAR_FE.Port
    if ($LigaSite) { Free-Port $SITE_BE.Port; Free-Port $SITE_FE.Port }
    if ($LigaExtrator) { Free-Port $EXT_BE.Port; Free-Port $EXT_FE.Port }
}

# [3] Radar LOCAL (hot reload)
Write-Log '[3/5] Iniciando Radar (local)...' Cyan
Open-Window $RADAR_BE.Path $RADAR_BE.Cmd
if (Wait-Port $RADAR_BE.Port 90) { Write-Log '  Radar Backend OK (3001)' Green } else { Write-Log '  Radar Backend FALHOU' Red }

Open-Window $RADAR_FE.Path $RADAR_FE.Cmd
if (Wait-Port $RADAR_FE.Port 90) { Write-Log '  Radar Frontend OK (3000)' Green } else { Write-Log '  Radar Frontend FALHOU' Red }

# [4] Site Conta Certa LOCAL (se solicitado)
if ($LigaSite) {
    Write-Log '[4/5] Iniciando Site Conta Certa (local)...' Cyan
    Open-Window $SITE_BE.Path $SITE_BE.Cmd
    if (Wait-Port $SITE_BE.Port 30) { Write-Log '  Site Backend OK (4000)' Green } else { Write-Log '  Site Backend FALHOU' Red }
    
    Open-Window $SITE_FE.Path $SITE_FE.Cmd
    if (Wait-Port $SITE_FE.Port 30) { Write-Log '  Site Frontend OK (5173)' Green } else { Write-Log '  Site Frontend FALHOU' Red }
} else {
    Write-Log '[4/5] Site Conta Certa NAO iniciado.' DarkGray
}

# [5] Extrator (SO se ligado)
if ($LigaExtrator) {
    Write-Log '[5/5] Iniciando Extrator Bancario (8000/5174)...' Cyan
    $extCmd = "& '" + $EXT_BE.Venv + "\Scripts\Activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0 --port " + $EXT_BE.Port
    Open-Window $EXT_BE.Path $extCmd
    if (Wait-Port $EXT_BE.Port 45) { Write-Log '  Extrator Backend OK (8000)' Green } else { Write-Log '  Extrator Backend FALHOU' Yellow }
    
    Open-Window $EXT_FE.Path $EXT_FE.Cmd
    if (Wait-Port $EXT_FE.Port 30) { Write-Log '  Extrator Frontend OK (5174)' Green } else { Write-Log '  Extrator Frontend FALHOU' Yellow }
} else {
    Write-Log '[5/5] Extrator NAO iniciado.' DarkGray
}

Pop-Location
Write-Host ''
Write-Host '[OK] SISTEMAS INICIADOS (modo dev).' -ForegroundColor Green
Write-Host '   Site Conta Certa: http://localhost:5173 | https://www.contacerta.com.br' -ForegroundColor Gray
Write-Host '   Radar Frontend:   http://localhost:3000 | https://radar.contacerta.com.br' -ForegroundColor Gray
Write-Host '   Radar Backend:    http://localhost:3001 | https://radar-api.contacerta.com.br' -ForegroundColor Gray
Write-Host ''
Write-Host 'DICA: Para reiniciar apenas um terminal, feche a janela preta dele e rode este script novamente.' -ForegroundColor Yellow
Write-Host "Log: $LOG_FILE" -ForegroundColor Gray