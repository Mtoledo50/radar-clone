#Requires -Version 5.1
<#
.SYNOPSIS
    Inicializador do Radar + Extrator Bancario.
#>

param([switch]$SkipPostgres, [switch]$SkipPortCheck)

$RAIZ = $PSScriptRoot # Pega automaticamente C:\radar-clone
$RADAR_BE = @{ Port = 3001; Path = "$RAIZ\backend";  Cmd = 'npm run start:dev' }
$RADAR_FE = @{ Port = 3002; Path = "$RAIZ\frontend"; Cmd = 'npm run dev -- -p 3002' }
$EXT_BE   = @{ Port = 8000; Path = "$RAIZ\extrator-bancario\backend"; Venv = "$RAIZ\extrator-bancario\venv" }
$EXT_FE   = @{ Port = 5174; Path = "$RAIZ\extrator-bancario\frontend"; Cmd  = 'npm run dev -- --port 5174' }

$LOG_DIR  = "$RAIZ\logs"
$LOG_FILE = "$LOG_DIR\boot-radar-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"

function Write-Log([string]$Msg, [string]$Color = 'White') {
    $line = '[' + (Get-Date -Format 'HH:mm:ss') + '] ' + $Msg
    Write-Host $line -ForegroundColor $Color
    if (-not (Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR | Out-Null }
    Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8 -ErrorAction SilentlyContinue
}

function Test-Port([int]$Port) {
    $c = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $c.TcpTestSucceeded
}

function Free-Port([int]$Port) {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($cn in $conns) {
        $p = Get-Process -Id $cn.OwningProcess -ErrorAction SilentlyContinue
        if ($p) {
            Write-Log ("  Liberando porta {0} (PID {1})" -f $Port, $p.Id) Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    if ($conns) { Start-Sleep -Seconds 2 }
}

function Open-Window([string]$WorkDir, [string]$Command) {
    $cmd = "Set-Location '" + $WorkDir + "'; " + $Command
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $cmd
}

function Wait-Health([string]$Url, [int]$TimeoutSec = 60) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { return $true }
        } catch { }
        Start-Sleep -Seconds 2
    }
    return $false
}

Write-Host '================================================' -ForegroundColor Magenta
Write-Host '  INICIANDO RADAR + EXTRATOR BANCARIO' -ForegroundColor Magenta
Write-Host '================================================' -ForegroundColor Magenta

# [1] Docker / Postgres
if (-not $SkipPostgres) {
    Write-Log '[1/4] Garantindo Postgres Docker (5433)...' Cyan
    Push-Location $RAIZ
    docker compose up -d postgres 2>&1 | Out-Null
    Pop-Location
    Start-Sleep -Seconds 3
    if (Test-Port 5433) { Write-Log '  Postgres Docker OK' Green }
    else { Write-Log '  Postgres Docker nao subiu' Red }
}

# [2] Liberar Portas
if (-not $SkipPortCheck) {
    Write-Log '[2/4] Liberando portas ocupadas...' Cyan
    Free-Port $RADAR_BE.Port; Free-Port $RADAR_FE.Port
    Free-Port $EXT_BE.Port; Free-Port $EXT_FE.Port
}

# [3] Radar
Write-Log '[3/4] Iniciando Radar...' Cyan
if (-not (Test-Port $RADAR_BE.Port)) {
    Open-Window $RADAR_BE.Path $RADAR_BE.Cmd
    Write-Log '  Aguardando health do Radar-BE (ate 60s)...' Yellow
    if (Wait-Health 'http://localhost:3001/health' 60) { Write-Log '  Radar Backend OK (3001)' Green }
    else { Write-Log '  Radar Backend sem resposta' Red }
}
if (-not (Test-Port $RADAR_FE.Port)) {
    Open-Window $RADAR_FE.Path $RADAR_FE.Cmd
    Start-Sleep -Seconds 6
    Write-Log '  Radar Frontend OK (3002)' Green
}

# [4] Extrator
Write-Log '[4/4] Iniciando Extrator Bancario...' Cyan
if (-not (Test-Port $EXT_BE.Port)) {
    $extCmd = "& '" + $EXT_BE.Venv + "\Scripts\Activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0 --port " + $EXT_BE.Port
    Open-Window $EXT_BE.Path $extCmd
    Write-Log '  Aguardando FastAPI /docs (ate 45s)...' Yellow
    if (Wait-Health ('http://localhost:' + $EXT_BE.Port + '/docs') 45) { Write-Log '  Extrator Backend OK (8000)' Green }
    else { Write-Log '  Extrator Backend sem resposta' Yellow }
}
if (-not (Test-Port $EXT_FE.Port)) {
    Open-Window $EXT_FE.Path $EXT_FE.Cmd
    Start-Sleep -Seconds 6
    Write-Log '  Extrator Frontend OK (5174)' Green
}

Write-Host ''
Write-Host '✅ RADAR E EXTRATOR INICIADOS.' -ForegroundColor Green
Write-Host "Log: $LOG_FILE" -ForegroundColor Gray
