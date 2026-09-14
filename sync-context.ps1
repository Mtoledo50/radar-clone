# ============================================================================
#  SYNC-CONTEXT.PS1 - Snapshot de contexto do projeto radar-clone
# ----------------------------------------------------------------------------
#  OBJETIVO:
#    Gerar um arquivo (context-snapshot.md) com TUDO que a IA precisa para
#    se recontextualizar em uma nova sessao:
#      - Git: branch, HEAD, ultimos commits, working directory
#      - Estrutura de modulos do backend e paginas do frontend
#      - Arvores de arquivos dos modulos criticos (comunicados/tracking/memoria)
#      - Ultimas migrations do Prisma
#      - Variaveis de ambiente NAO sensiveis (segredos filtrados)
#      - Status do build TypeScript
#      - Rotas principais dos controllers criticos
#      - Estatisticas rapidas
#
#  COMO USAR:
#    cd C:\radar-clone
#    .\sync-context.ps1
#    (opcional) .\sync-context.ps1 -OutputFile "meu-snapshot.md"
#
#  DEPOIS:
#    Abra o context-snapshot.md, copie TODO o conteudo e cole no chat da IA:
#    "Atualize-se com este contexto e me diga o proximo passo."
#
#  SEGURANCA:
#    Linhas do .env contendo PASSWORD/SECRET/TOKEN/KEY/PASS sao FILTRADAS.
#
#  NOTA DE ENCODING:
#    Este arquivo e 100% ASCII (sem acentos, sem emojis). Assim ele funciona
#    em qualquer PowerShell (5.1 ou 7+) independente de BOM/UTF-8.
# ============================================================================

param(
    # Nome/caminho do arquivo de saida (relativo a raiz do repositorio)
    [string]$OutputFile = "context-snapshot.md"
)

# Nao interrompe o script se algum comando falhar (pasta inexistente, etc.)
$ErrorActionPreference = "SilentlyContinue"

# ----------------------------------------------------------------------------
# 1. DETECAO DA RAIZ DO REPOSITORIO
#    Usa o proprio git: funciona de qualquer subpasta.
# ----------------------------------------------------------------------------
$root = (git rev-parse --show-toplevel 2>$null) | Select-Object -First 1
if (-not $root) {
    Write-Host "[ERRO] Este diretorio nao e um repositorio git." -ForegroundColor Red
    exit 1
}
Set-Location $root

$outPath = Join-Path $root $OutputFile
$now     = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host ""
Write-Host "[SYNC] Gerando snapshot em: $outPath" -ForegroundColor Cyan

# ----------------------------------------------------------------------------
# 2. BUFFER DO RELATORIO
#    Acumulamos todas as linhas nesta lista e gravamos UMA vez no final.
# ----------------------------------------------------------------------------
$report = [System.Collections.Generic.List[string]]::new()

# Helper: adiciona um titulo de secao
function Add-Title([string]$t) {
    $report.Add("")
    $report.Add("## $t")
    $report.Add("")
}

# Helper: adiciona um bloco de texto preservando quebras de linha
function Add-Block([string]$content) {
    if ([string]::IsNullOrWhiteSpace($content)) {
        $report.Add("(vazio)")
    } else {
        foreach ($line in ($content -split '\r?\n')) { $report.Add($line) }
    }
}

# ----------------------------------------------------------------------------
# 3. CABECALHO DO RELATORIO
# ----------------------------------------------------------------------------
$branch = (git rev-parse --abbrev-ref HEAD 2>$null) | Select-Object -First 1
$head   = (git rev-parse --short HEAD 2>$null)      | Select-Object -First 1

$report.Add("# CONTEXTO DO PROJETO - radar-clone")
$report.Add("")
$report.Add("**Gerado em:** $now")
$report.Add("**Raiz:** $root")
$report.Add("**Branch:** $branch  |  **HEAD:** $head")

# ----------------------------------------------------------------------------
# 4. GIT - LINHA DO TEMPO + WORKING DIRECTORY
# ----------------------------------------------------------------------------
Add-Title "1. ULTIMOS 15 COMMITS"
Add-Block ((git log --oneline -15 2>$null | Out-String).Trim())

Add-Title "2. WORKING DIRECTORY (alteracoes nao commitadas)"
Add-Block ((git status --short 2>$null | Out-String).Trim())

# ----------------------------------------------------------------------------
# 5. ESTRUTURA DO BACKEND (modulos + arvores dos modulos criticos)
# ----------------------------------------------------------------------------
Add-Title "3. MODULOS DO BACKEND (backend/src)"
Add-Block (((Get-ChildItem "$root\backend\src" -Directory | Select-Object -ExpandProperty Name) -join ", "))

Add-Title "3.1 Modulo comunicados (Sprint F13) - arquivos"
Add-Block (((Get-ChildItem "$root\backend\src\comunicados" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName.Replace($root, ".") }) -join "`n"))

Add-Title "3.2 Modulo tracking - arquivos"
Add-Block (((Get-ChildItem "$root\backend\src\tracking" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName.Replace($root, ".") }) -join "`n"))

Add-Title "3.3 Modulo memoria (Sprint F14) - arquivos"
Add-Block (((Get-ChildItem "$root\backend\src\memoria" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName.Replace($root, ".") }) -join "`n"))

# ----------------------------------------------------------------------------
# 6. ESTRUTURA DO FRONTEND (paginas do dashboard + raiz do app)
# ----------------------------------------------------------------------------
Add-Title "4. PAGINAS DO DASHBOARD (frontend/src/app/dashboard)"
Add-Block (((Get-ChildItem "$root\frontend\src\app\dashboard" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name) -join ", "))

Add-Title "4.1 PASTAS DA RAIZ DO APP (frontend/src/app)"
Add-Block (((Get-ChildItem "$root\frontend\src\app" -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name) -join ", "))

# ----------------------------------------------------------------------------
# 7. MIGRATIONS DO PRISMA (5 mais recentes)
# ----------------------------------------------------------------------------
Add-Title "5. ULTIMAS 5 MIGRATIONS APLICADAS"
Add-Block (((Get-ChildItem "$root\backend\prisma\migrations" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 5 -ExpandProperty Name) -join "`n"))

# ----------------------------------------------------------------------------
# 8. VARIAVEIS DE AMBIENTE - FILTRANDO SEGREDOS
#    So linhas CHAVE=valor que NAO contenham palavras sensiveis.
# ----------------------------------------------------------------------------
Add-Title "6. VARIAVEIS DE AMBIENTE NAO SENSIVEIS (backend/.env)"
$envFile = "$root\backend\.env"
if (Test-Path $envFile) {
    $safe = Get-Content $envFile | Where-Object {
        $_ -match '^\s*[A-Z0-9_]+\s*=' -and
        $_ -notmatch '(PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|_KEY|_PASS)\s*='
    }
    Add-Block (($safe -join "`n"))
} else {
    Add-Block "(arquivo .env nao encontrado)"
}

# ----------------------------------------------------------------------------
# 9. STATUS DO BUILD TYPESCRIPT (10 primeiras linhas de erro, se houver)
# ----------------------------------------------------------------------------
Add-Title "7. STATUS DO BUILD (npx tsc --noEmit no backend)"
Push-Location "$root\backend"
$tscOut = (npx tsc --noEmit 2>&1 | Select-Object -First 10 | Out-String).Trim()
Pop-Location
if ([string]::IsNullOrWhiteSpace($tscOut)) {
    Add-Block "OK: sem erros de compilacao."
} else {
    Add-Block $tscOut
}

# ----------------------------------------------------------------------------
# 10. ROTAS PRINCIPAIS DOS MODULOS CRITICOS
#     Extrai so os decorators @Get/@Post/... para a IA ver a superficie da API.
# ----------------------------------------------------------------------------
Add-Title "8. ROTAS - tracking.controller.ts"
Add-Block (((Select-String -Path "$root\backend\src\tracking\tracking.controller.ts" -Pattern "@(Get|Post|Put|Patch|Delete)\(" -ErrorAction SilentlyContinue | ForEach-Object { $_.Line.Trim() }) -join "`n"))

Add-Title "8.1 ROTAS - memoria.controller.ts"
Add-Block (((Select-String -Path "$root\backend\src\memoria\memoria.controller.ts" -Pattern "@(Get|Post|Put|Patch|Delete)\(" -ErrorAction SilentlyContinue | ForEach-Object { $_.Line.Trim() }) -join "`n"))

Add-Title "8.2 ROTAS - comunicados (todos os controllers)"
Add-Block (((Select-String -Path "$root\backend\src\comunicados\*\*.controller.ts" -Pattern "@(Get|Post|Put|Patch|Delete)\(" -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Filename): $($_.Line.Trim())" }) -join "`n"))

# ----------------------------------------------------------------------------
# 11. ESTATISTICAS RAPIDAS (tamanho do codebase + estado da watch folder)
# ----------------------------------------------------------------------------
Add-Title "9. ESTATISTICAS RAPIDAS"
$stats = @(
    "Commits totais:              $(git rev-list --count HEAD 2>$null)",
    "Arquivos .ts no backend:     $((Get-ChildItem "$root\backend\src" -Recurse -Filter *.ts -ErrorAction SilentlyContinue).Count)",
    "Arquivos .tsx no frontend:   $((Get-ChildItem "$root\frontend\src" -Recurse -Filter *.tsx -ErrorAction SilentlyContinue).Count)",
    "Modulos no backend:          $((Get-ChildItem "$root\backend\src" -Directory -ErrorAction SilentlyContinue).Count)",
    "Paginas no dashboard:        $((Get-ChildItem "$root\frontend\src\app\dashboard" -Directory -ErrorAction SilentlyContinue).Count)",
    "Arquivos em C:\Documentos\Enviar: $((Get-ChildItem 'C:\Documentos\Enviar' -Recurse -File -ErrorAction SilentlyContinue).Count)"
)
Add-Block (($stats -join "`n"))

# ----------------------------------------------------------------------------
# 12. RODAPE - INSTRUCAO PARA O USUARIO E PARA A IA
# ----------------------------------------------------------------------------
$report.Add("")
$report.Add("---")
$report.Add("")
$report.Add("## INSTRUCOES")
$report.Add("")
$report.Add("**Usuario:** copie TODO este arquivo e cole no chat da IA com a frase:")
$report.Add('> "Atualize-se com este contexto e me diga qual o proximo passo."')
$report.Add("")
$report.Add("**IA:** ao receber este snapshot: (1) identifique a sprint em andamento")
$report.Add("pelos commits recentes; (2) levante pendencias via git status + build;")
$report.Add("(3) proponha o proximo bloco de trabalho alinhado ao estado real acima.")
$report.Add("")
$report.Add("*Fim do snapshot - $now*")

# ----------------------------------------------------------------------------
# 13. GRAVACAO DO ARQUIVO + RESUMO NO CONSOLE
# ----------------------------------------------------------------------------
$report | Set-Content -Path $outPath -Encoding UTF8

Write-Host ""
Write-Host "[OK] Snapshot gerado com sucesso!" -ForegroundColor Green
Write-Host "[ARQUIVO] $outPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "   Branch:  $branch"
Write-Host "   HEAD:    $head"
Write-Host "   Commits: $(git rev-list --count HEAD 2>$null)"
Write-Host "   Linhas do relatorio: $($report.Count)"
Write-Host ""
Write-Host "Proximo passo: abra o arquivo, copie TUDO e cole no chat da IA." -ForegroundColor Yellow
Write-Host ""