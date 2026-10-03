
---

### 📂 `docs/adrs/ADR-103-iniciar-tudo-boot-unificado.md`

```markdown
# ADR-103: Script `Iniciar-Tudo.ps1` com Boot Unificado e Kill Cirúrgico

**Data:** 2026-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Não

---

## 📋 Contexto

O projeto tem múltiplos serviços (Postgres Docker, Backend NestJS, Frontend Next.js, Extrator Python). Iniciar manualmente cada um em terminais separados é lento e propenso a erros (esquecer um serviço, porta ocupada, etc.).

**Problema:**
- Desenvolvedor precisa abrir 4 terminais
- Portas podem estar ocupadas de execuções anteriores
- Docker pode não estar rodando
- Não há healthcheck para saber se tudo está pronto

## 🎯 Decisão

Criar script PowerShell `Iniciar-Tudo.ps1` com:

1. **Boot Unificado:** Um comando inicia todos os serviços
2. **Kill Cirúrgico por Porta:** Mata apenas processos nas portas específicas (3001, 3002, 5433, 8000, 5174), **NUNCA** mata containers Docker
3. **Healthcheck do Postgres:** Aguarda Postgres estar saudável antes de iniciar backend (lê healthcheck do Docker, não `sleep` fixo)
4. **Menu Interativo:** 2 modos (dev/prod) com opções claras
5. **ASCII Puro:** Script em ASCII (PowerShell 5.1 CP1252 corrompe Unicode)

## 💡 Implementação

### Script Principal

```powershell
# Iniciar-Tudo.ps1

# ═══════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO
# ═══════════════════════════════════════════════════════════════════
$PORTAS = @(3001, 3002, 5433, 8000, 5174)
$ROOT = $PSScriptRoot

# ═══════════════════════════════════════════════════════════════════
# FUNÇÃO: Kill cirúrgico por porta (NÃO mata Docker)
# ═══════════════════════════════════════════════════════════════════
function Free-Port {
  param([int]$Port)
  
  $pids = netstat -ano | Select-String ":$Port\s" | ForEach-Object {
    ($_ -split '\s+')[-1]
  } | Select-Object -Unique | Where-Object { $_ -ne '0' }
  
  foreach ($pid in $pids) {
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -ne 'com.docker*' -and $process.ProcessName -ne 'docker*') {
      Write-Host "  Matando PID $pid ($($process.ProcessName)) na porta $Port"
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
}

# ═══════════════════════════════════════════════════════════════════
# FUNÇÃO: Aguardar Postgres saudável
# ═══════════════════════════════════════════════════════════════════
function Wait-PostgresHealthy {
  $maxAttempts = 30
  $attempt = 0
  
  while ($attempt -lt $maxAttempts) {
    $health = docker inspect --format='{{.State.Health.Status}}' radar-clone-postgres-1 2>$null
    if ($health -eq 'healthy') {
      Write-Host "✅ Postgres saudável"
      return
    }
    $attempt++
    Write-Host "  Aguardando Postgres... ($attempt/$maxAttempts)"
    Start-Sleep -Seconds 2
  }
  
  throw "❌ Postgres não ficou saudável em 60s"
}

# ═══════════════════════════════════════════════════════════════════
# MENU PRINCIPAL
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n🚀 RADAR CONTA CERTA - Boot Unificado"
Write-Host "════════════════════════════════════════`n"
Write-Host "1) Modo DEV (com hot-reload)"
Write-Host "2) Modo PROD (Docker completo)"
Write-Host "3) Parar tudo"
Write-Host "4) Sair`n"

$choice = Read-Host "Escolha uma opção"

switch ($choice) {
  '1' {
    Write-Host "`n🔧 Iniciando modo DEV...`n"
    
    # 1. Matar processos nas portas
    foreach ($port in $PORTAS) {
      Free-Port -Port $port
    }
    
    # 2. Subir Docker (Postgres)
    Write-Host "`n🐳 Iniciando Docker Compose..."
    docker compose up -d postgres
    
    # 3. Aguardar Postgres saudável
    Wait-PostgresHealthy
    
    # 4. Iniciar Backend
    Write-Host "`n🔧 Iniciando Backend (NestJS)..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\backend'; npm run start:dev"
    
    # 5. Iniciar Frontend
    Write-Host "`n🎨 Iniciando Frontend (Next.js)..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\frontend'; npm run dev"
    
    Write-Host "`n✅ Boot concluído!"
    Write-Host "   Frontend: http://localhost:3002"
    Write-Host "   Backend:  http://localhost:3001"
    Write-Host "   Postgres: localhost:5433`n"
  }
  
  '2' {
    Write-Host "`n🚀 Iniciando modo PROD..."
    docker compose up -d --build
    Write-Host "`n✅ Todos os serviços rodando em Docker`n"
  }
  
  '3' {
    Write-Host "`n🛑 Parando tudo..."
    docker compose down
    foreach ($port in $PORTAS) {
      Free-Port -Port $port
    }
    Write-Host "✅ Tudo parado`n"
  }
  
  '4' { exit }
}

✅ Consequências

Positivas

✅ One-Command Boot: Um comando inicia tudo
✅ Seguro: Não mata containers Docker acidentalmente
✅ Healthcheck Real: Aguarda Postgres estar pronto (não sleep cego)
✅ Modos Separados: Dev (hot-reload) vs Prod (Docker completo)


Negativas

❌ Windows-Only: Script PowerShell não funciona em Linux/Mac (requer versão Bash)
❌ Complexidade: Script tem ~150 linhas (mas é bem comentado)

📚 Referências

Arquivos que usam esta ADR:
Iniciar-Tudo.ps1 (raiz do projeto)
ADRs relacionadas:
ADR-025 (Script em ASCII puro)
ADR-027 (Boot em 2 modos)
ADR-077-082 (Docker e Cloudflare)

🔄 Histórico de Revisões

Data        Autor               Mudança
2026-09-29  Marcos Toledo       Criação inicial (Sprint 31)