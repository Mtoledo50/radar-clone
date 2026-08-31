# =================================================================
# ARQUIVO: backup-radar-db.ps1
# =================================================================
# Script de backup automatico do PostgreSQL via Docker (ADR-088).
# Mantem os ultimos 7 dias de backups, compactados em .zip.
# Configurado para o docker-compose.yml do Radar Conta Certa.
# =================================================================

# --- CONFIGURACOES (Baseadas no docker-compose.yml) ---
$CONTAINER_NAME = "radar_postgres"
$DB_NAME = "radar_db"
$DB_USER = "postgres"
$DB_PASS = "postgres_password"

$BACKUP_DIR = "C:\radar-backups"
$RETENTION_DAYS = 7

# --- INICIO DO SCRIPT ---
Write-Host "Iniciando backup do banco $DB_NAME via Docker..." -ForegroundColor Cyan
Write-Host "   Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# 1. Verifica se o container esta rodando
$containerStatus = docker inspect -f '{{.State.Running}}' $CONTAINER_NAME 2>$null
if ($containerStatus -ne "true") {
    Write-Host "   ERRO: Container $CONTAINER_NAME nao esta rodando." -ForegroundColor Red
    Write-Host "   Execute: docker compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

# 2. Cria diretorio se nao existir
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "   Diretorio criado: $BACKUP_DIR" -ForegroundColor Green
}

# 3. Define nome do arquivo com timestamp
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\radar_db_$TIMESTAMP.sql"
$ZIP_FILE = "$BACKUP_DIR\radar_db_$TIMESTAMP.zip"

try {
    # 4. Executa o pg_dump dentro do container e redireciona a saida para o arquivo local
    Write-Host "   Executando pg_dump no container..." -ForegroundColor Yellow
    
    $dockerCommand = "docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME -F p"
    Invoke-Expression "$dockerCommand > `"$BACKUP_FILE`"" 2>$null
    
    # 5. Verifica se o arquivo foi criado e tem tamanho maior que 0
    if ((Test-Path $BACKUP_FILE) -and ((Get-Item $BACKUP_FILE).Length -gt 0)) {
        Write-Host "   Dump concluido com sucesso." -ForegroundColor Green
        
        # Compacta o arquivo SQL
        Write-Host "   Compactando backup..." -ForegroundColor Yellow
        Compress-Archive -Path $BACKUP_FILE -DestinationPath $ZIP_FILE -Force
        Remove-Item $BACKUP_FILE
        
        $fileSize = (Get-Item $ZIP_FILE).Length / 1MB
        Write-Host "   Backup salvo: $ZIP_FILE ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
    } else {
        throw "Falha ao gerar o dump. O arquivo esta vazio ou nao foi criado."
    }
}
catch {
    Write-Host "   ERRO ao realizar backup: $_" -ForegroundColor Red
    exit 1
}

# 6. LIMPEZA DE BACKUPS ANTIGOS (Rotacao)
Write-Host "   Limpando backups antigos (>$RETENTION_DAYS dias)..." -ForegroundColor Yellow
$CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
$deletedFiles = Get-ChildItem -Path $BACKUP_DIR -Filter "*.zip" | Where-Object { $_.CreationTime -lt $CutoffDate }

if ($deletedFiles) {
    $deletedFiles | Remove-Item -Force
    Write-Host "   $($deletedFiles.Count) backup(s) antigo(s) removido(s)." -ForegroundColor Green
} else {
    Write-Host "   Nenhum backup antigo para remover." -ForegroundColor Gray
}

Write-Host "Backup concluido com sucesso!" -ForegroundColor Green