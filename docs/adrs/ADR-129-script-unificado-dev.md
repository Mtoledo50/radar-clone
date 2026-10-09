
---

## 📄 `docs/ADR-129-script-unificado-dev.md`

```markdown
# ADR-122: Script unificado de inicialização (`iniciar-radar.ps1`)

**Data:** 2026-10-09  
**Status:** ✅ Aceita  
**Decisor:** Marcos Toledo  
**Reversível:** Sim (script pode ser deletado sem impacto)

---

## 📋 Contexto

O ambiente de desenvolvimento do projeto Conta Certa envolve **múltiplos serviços independentes**:

1. **PostgreSQL** (Docker, porta 5433)
2. **Backend Radar** (NestJS, porta 3001)
3. **Frontend Radar** (Next.js, porta 3000)
4. **Site Conta Certa** (Node backend 4000 + Vite frontend 5173)
5. **Extrator Bancário** (FastAPI 8000 + Vite 5174)

Cada desenvolvedor precisava abrir 5-7 terminais manualmente, lembrar a ordem correta de inicialização (Postgres primeiro!), e lidar com processos "zumbis" que seguravam portas após fechamento abrupto de janelas.

**Problemas recorrentes:**
- `EADDRINUSE: address already in use` ao reiniciar serviços
- Containers Docker do backend/frontend brigando com processos locais pelas mesmas portas
- Postgres não estar healthy antes do backend tentar conectar
- Dificuldade de onboarding de novos desenvolvedores

---

##  Decisão

Criar um **script PowerShell unificado** (`iniciar-radar.ps1`) que:

1. Oferece **menu interativo** para escolher modo (dev/prod) e serviços opcionais
2. Garante **ordem correta** de inicialização (Postgres → libera portas → apps)
3. **Libera portas automaticamente** matando processos zumbis (apenas node/python/powershell — nunca Docker)
4. **Aguarda healthcheck** do Postgres antes de subir apps
5. **Para containers Docker** de backend/frontend no modo dev (para não conflitar com locais)
6. Gera **log em arquivo** para auditoria de boot

### Princípios
- **ASCII-only:** sem acentos/emojis no código (PowerShell 5.1 usa CP1252)
- **Não destrutivo:** nunca mata processos Docker/vpnkit (causaria P1001 no Postgres)
- **Idempotente:** pode ser rodado múltiplas vezes sem efeitos colaterais
- **Flexível:** flags para automação/CI (`-ComSite`, `-ComExtrator`, `-Modo prod`)

---

## 💡 Implementação

### Estrutura do script

```powershell
#Requires -Version 5.1
param(
    [ValidateSet('dev','prod')] [string]$Modo = 'dev',
    [switch]$ComSite,
    [switch]$ComExtrator,
    [switch]$SkipPortCheck
)

Funções auxiliares

# Mata apenas processos de app (node/python/powershell), NUNCA Docker
$MATABLES = @('node','python','python3','uvicorn','deno','powershell','pwsh')

function Free-Port([int]$Port) {
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($cn in $conns) {
        $p = Get-Process -Id $cn.OwningProcess -ErrorAction SilentlyContinue
        if ($p -and ($p.ProcessName -in $MATABLES)) {
            Stop-Process -Id $p.Id -Force
        }
    }
}

# Aguarda porta TCP abrir (mais confiável que /health HTTP)
function Wait-Port([int]$Port, [int]$TimeoutSec = 90) { ... }

# Aguarda healthcheck do container Postgres
function Wait-PostgresHealthy([int]$TimeoutSec = 60) { ... }

# Abre nova janela PowerShell no diretório especificado
function Open-Window([string]$WorkDir, [string]$Command) {
    Start-Process powershell -ArgumentList '-NoExit','-Command',
        ("Set-Location '" + $WorkDir + "'; " + $Command)
}

Fluxo de execução (modo dev)

[1/5] Postgres Docker (5433)
      ↓ docker compose up -d postgres
      ↓ Wait-PostgresHealthy (60s)
      ↓ docker compose stop backend frontend  # evita conflito com locais
      ↓ docker compose rm -f backend frontend # remove para não voltarem

[2/5] Libera portas locais
      ↓ Free-Port 3001, 3000, [4000, 5173], [8000, 5174]

[3/5] Radar (backend 3001 + frontend 3000)
      ↓ Open-Window backend  → npm run start:dev
      ↓ Wait-Port 3001 (90s)
      ↓ Open-Window frontend → npm run dev
      ↓ Wait-Port 3000 (90s)

[4/5] Site Conta Certa (opcional)
      ↓ Open-Window backend  → node server.js (4000)
      ↓ Open-Window frontend → npm run dev (5173)

[5/5] Extrator Bancário (opcional)
      ↓ Open-Window backend  → venv + uvicorn (8000)
      ↓ Open-Window frontend → npm run dev -- --port 5174

Uso

# Menu interativo (caso diário)
.\iniciar-radar.ps1

# Automação / atalho
.\iniciar-radar.ps1 -ComSite              # dev + site
.\iniciar-radar.ps1 -ComSite -ComExtrator # dev + site + extrator
.\iniciar-radar.ps1 -Modo prod            # tudo no Docker

# Pula verificação de portas (útil em CI)
.\iniciar-radar.ps1 -SkipPortCheck

✅ Consequências
Positivas
Onboarding em 1 comando: novo dev roda o script e tem tudo no ar
Zero EADDRINUSE: portas são liberadas automaticamente
Ordem garantida: Postgres sempre healthy antes dos apps
Flexibilidade: desenvolvedor escolhe o que subir (nem sempre precisa do Extrator)
Logs auditáveis: arquivo em logs/boot-radar-YYYY-MM-DD-HHmmss.log
Reinício rápido: fechar janela preta + rodar script novamente = ambiente limpo
Negativas
Dependência de PowerShell 5.1+: não funciona em bash/linux (mas o projeto é Windows-only)
Múltiplas janelas abertas: pode poluir a taskbar (mitigável com --no-new-window no futuro)
Tempo de boot: ~90s no pior caso (Postgres + compilação Next.js)
Riscos mitigados
Matar Docker acidentalmente: $MATABLES exclui com.docker.backend, vpnkit, docker-desktop
Postgres cair durante boot: Wait-PostgresHealthy com timeout e log de erro
Porta presa por processo não-matável: log warning amarelo, não bloqueia o boot
📚 Referências
ADRs relacionadas: ADR-103 (Iniciar-Tudo.ps1 — predecessora), ADR-077 (Postgres host.docker.internal)
Arquivo: iniciar-radar.ps1 (raiz do projeto C:\radar-clone)
Dependências externas: Docker Desktop, Node.js 18+, Python 3.11+ (para Extrator)
🔄 Histórico de Revisões
Data
Autor
Mudança
2026-10-09
Marcos Toledo
Criação inicial — unifica Radar + Site + Extrator
2026-10-09
Marcos Toledo
Adiciona docker compose rm -f para evitar containers zumbis
2026-10-09
Marcos Toledo
Adiciona powershell/pwsh em $MATABLES para matar janelas órfãs

