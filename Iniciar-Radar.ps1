#Requires -Version 5.1
# =================================================================
# iniciar-radar.ps1 - Inicializador do Radar Conta Certa
# =================================================================
# ASCII ONLY: este arquivo NAO pode conter acento, emoji ou travessao.
# Motivo: Windows PowerShell 5.1 le .ps1 na code page do sistema (CP1252);
# caractere unicode vira byte lixo e corrompe as strings do parser.
# =================================================================
<#
.SYNOPSIS
    Inicializador do Radar Conta Certa (e, opcionalmente, do Extrator Bancario).
.DESCRIPTION
    DOIS MODOS - nunca misture Docker e local no MESMO servico:
      -Modo dev  (padrao): Postgres no Docker (5433) + Backend/Frontend LOCAIS (3001/3000, hot reload).
                           O script PARA os containers backend/frontend do Docker pra nao brigar por porta.
      -Modo prod          : sobe TUDO no Docker (docker compose up -d --build). Nada local.
    O Extrator Bancario (FastAPI 8000 + Vite 5174) e OUTRO produto e so sobe com -ComExtrator.
.USAGE
    Rodar sem argumento abre um MENU interativo (escolhe modo + extrator).
    Rodar com flag pula o menu e usa a flag (modo automacao / CI).
.EXAMPLE
    .\iniciar-radar.ps1                 # abre o menu (caso diario)
    .\iniciar-radar.ps1 -ComExtrator    # dev + extrator, sem perguntar
    .\iniciar-radar.ps1 -Modo prod      # valida build de producao no Docker, sem perguntar
#>
param(
    [ValidateSet('dev','prod')] [string]$Modo = 'dev',
    [switch]$ComExtrator,
    [switch]$SkipPortCheck
)

$RAIZ = $PSScriptRoot

# -- Servicos do RADAR -------------------------------------------------------
# frontend LOCAL em 3000 (nao 3002) pra nao duplicar com o Docker e bater com o .env.local.
$RADAR_BE = @{ Port = 3001; Path = "$RAIZ\backend";  Cmd = 'npm run start:dev' }
$RADAR_FE = @{ Port = 3000; Path = "$RAIZ\frontend"; Cmd = 'npm run dev' }

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

# Free-Port so mata processos de APP (node/python/uvicorn). NUNCA toca em
# com.docker.backend / vpnkit / Docker Desktop - matar esses derruba o tunnel
# e leva o Postgres junto (a causa raiz do P1001).
$MATABLES = @('node','python','python3','uvicorn','deno')
function Free-Port([int]$Port) {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($cn in $conns) {
        $p = Get-Process -Id $cn.OwningProcess -ErrorAction SilentlyContinue
        if ($p -and ($p.ProcessName -in $MATABLES)) {
            Write-Log ("  Liberando porta {0} ({1} PID {2})" -f $Port, $p.ProcessName, $p.Id) Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        } elseif ($p) {
            Write-Log ("  Porta {0} segurada por '{1}' (nao-matavel) - ignore se for modo dev" -f $Port, $p.ProcessName) DarkYellow
        }
    }
    Start-Sleep -Seconds 1
}

function Open-Window([string]$WorkDir, [string]$Command) {
    Start-Process powershell -ArgumentList '-NoExit','-Command',("Set-Location '" + $WorkDir + "'; " + $Command)
}

# Espera a PORTA abrir (TCP), nao uma rota HTTP. Mais confiavel que /health.
function Wait-Port([int]$Port, [int]$TimeoutSec = 90) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-Port $Port) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

# Espera o Postgres ficar HEALTHY de verdade, lendo o healthcheck do Docker.
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
# CAMADA DE ENTRADA: menu interativo OU respeito as flags (hibrido)
# =====================================================================
# Se foi chamado pelado (nenhum parametro passado), abre o menu.
# Se veio com flag, pula o menu e usa a flag (automacao / CI / atalho).
$LigaExtrator = $false
$interativo = ($PSBoundParameters.Count -eq 0)

if ($interativo) {
    Write-Host ''
    Write-Host '================================================' -ForegroundColor Cyan
    Write-Host '   RADAR CONTA CERTA - BOOT INTERATIVO' -ForegroundColor Cyan
    Write-Host '================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  Modo de execucao:' -ForegroundColor White
    Write-Host '    [1] DEV  (padrao) - Postgres no Docker + backend/frontend locais (hot reload)' -ForegroundColor Gray
    Write-Host '    [2] PROD          - tudo no Docker (valida o build de producao)' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  Extrator Bancario (app separada, OCR/parsing de extrato):' -ForegroundColor White
    Write-Host '    [s] Sim    [n] Nao (padrao)' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  Digite as opcoes (ex: 1 n) ou ENTER para o padrao [1 n].' -ForegroundColor DarkGray
    Write-Host '  Digite q para sair.' -ForegroundColor DarkGray
    Write-Host ''

    while ($true) {
        $resp = Read-Host '  Escolha'
        if ([string]::IsNullOrWhiteSpace($resp)) { $Modo = 'dev'; $LigaExtrator = $false; break }
        $tok = $resp.Trim() -split '\s+'
        if ($tok[0] -eq 'q' -or $tok[0] -eq 'sair') { Write-Host '  Saindo sem iniciar.' -ForegroundColor Yellow; return }
        $mOk = ($tok[0] -eq '1' -or $tok[0] -eq '2')
        $eOk = ($tok.Count -lt 2) -or ($tok[1] -eq 's' -or $tok[1] -eq 'n')
        if ($mOk -and $eOk) {
            $Modo = if ($tok[0] -eq '1') { 'dev' } else { 'prod' }
            $LigaExtrator = ($tok.Count -ge 2 -and $tok[1] -eq 's')
            break
        }
        Write-Host '  Opcao invalida. Use 1 ou 2, e depois s ou n. ENTER = padrao [1 n].' -ForegroundColor Yellow
    }
} else {
    # Veio com flag: respeita e nao pergunta.
    $LigaExtrator = $ComExtrator.IsPresent
}

Write-Log ("Boot: modo={0} extrator={1} interativo={2}" -f $Modo, $(if ($LigaExtrator) {'sim'} else {'nao'}), $interativo)

Write-Host ''
Write-Host '================================================' -ForegroundColor Magenta
Write-Host ("  INICIANDO RADAR  [modo: {0}]" -f $Modo) -ForegroundColor Magenta
if ($LigaExtrator) { Write-Host '  + EXTRATOR BANCARIO' -ForegroundColor Magenta }
Write-Host '================================================' -ForegroundColor Magenta

Push-Location $RAIZ

if ($Modo -eq 'prod') {
    # =================================================================
    # MODO PROD: tudo no Docker. Nada local. Valida o build de producao.
    # =================================================================
    Write-Log '[prod] docker compose up -d --build (postgres+backend+frontend)...' Cyan
    docker compose up -d --build
    Write-Log '[prod] Aguardando Postgres healthy...' Yellow
    if (Wait-PostgresHealthy 60) { Write-Log '  Postgres healthy (5433)' Green } else { Write-Log '  Postgres NAO ficou healthy' Red }
    Write-Log '[prod] Aguardando Backend healthy (healthcheck do compose)...' Yellow
    Start-Sleep -Seconds 5
    docker compose ps
    Pop-Location
    Write-Host ''
    Write-Host '[OK] MODO PROD: Docker completo no ar. Acesse http://localhost:3000' -ForegroundColor Green
    Write-Host "Log: $LOG_FILE" -ForegroundColor Gray
    return
}

# =====================================================================
# MODO DEV (padrao): Postgres no Docker + Backend/Frontend locais.
# =====================================================================

# [1] Postgres no Docker (persistente) - e ESPERA ficar healthy de verdade
Write-Log '[1/4] Subindo/verificando Postgres Docker (5433)...' Cyan
docker compose up -d postgres 2>&1 | Out-Null
if (Wait-PostgresHealthy 60) { Write-Log '  Postgres Docker OK (healthy)' Green }
else { Write-Log '  Postgres Docker NAO ficou healthy - cheque: docker compose logs postgres' Red }

# [1b] No modo dev, os containers backend/frontend do Docker NAO devem rodar
# (brigam por 3001/3000 com os locais). Para eles. (O Postgres continua.)
Write-Log '  Parando containers backend/frontend do Docker (modo dev usa locais)...' DarkGray
docker compose stop backend frontend 2>&1 | Out-Null

# [2] Liberar portas DOS PROCESSOS LOCAIS (so node/python - nunca Docker)
if (-not $SkipPortCheck) {
    Write-Log '[2/4] Liberando portas de apps locais (3001/3000)...' Cyan
    Free-Port $RADAR_BE.Port
    Free-Port $RADAR_FE.Port
    if ($LigaExtrator) { Free-Port $EXT_BE.Port; Free-Port $EXT_FE.Port }
}

# [3] Radar LOCAL (hot reload)
Write-Log '[3/4] Iniciando Radar (local, hot reload)...' Cyan
Open-Window $RADAR_BE.Path $RADAR_BE.Cmd
Write-Log '  Aguardando Backend local abrir a 3001 (ate 90s)...' Yellow
if (Wait-Port 3001 90) { Write-Log '  Radar Backend OK (3001)' Green } else { Write-Log '  Radar Backend NAO abriu a 3001' Red }
Open-Window $RADAR_FE.Path $RADAR_FE.Cmd
Write-Log '  Aguardando Frontend local abrir a 3000 (ate 90s)...' Yellow
if (Wait-Port 3000 90) { Write-Log '  Radar Frontend OK (3000)' Green } else { Write-Log '  Radar Frontend NAO abriu a 3000' Red }

# [4] Extrator (SO se ligado no menu ou via flag)
if ($LigaExtrator) {
    Write-Log '[4/4] Iniciando Extrator Bancario (8000/5174)...' Cyan
    $extCmd = "& '" + $EXT_BE.Venv + "\Scripts\Activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0 --port " + $EXT_BE.Port
    Open-Window $EXT_BE.Path $extCmd
    if (Wait-Port 8000 45) { Write-Log '  Extrator Backend OK (8000)' Green } else { Write-Log '  Extrator Backend sem resposta' Yellow }
    Open-Window $EXT_FE.Path $EXT_FE.Cmd
    if (Wait-Port 5174 30) { Write-Log '  Extrator Frontend OK (5174)' Green } else { Write-Log '  Extrator Frontend sem resposta' Yellow }
} else {
    Write-Log '[4/4] Extrator NAO iniciado (ligue pelo menu ou com -ComExtrator).' DarkGray
}

Pop-Location
Write-Host ''
Write-Host '[OK] RADAR INICIADO (modo dev). Acesse http://localhost:3000' -ForegroundColor Green
Write-Host '   Login seed: admin@contacerta.com.br / Admin@123456' -ForegroundColor Gray
Write-Host "Log: $LOG_FILE" -ForegroundColor Gray