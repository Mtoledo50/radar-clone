# =================================================================
# ARQUIVO: backup-radar-db.ps1
# =================================================================
# Script de backup automático do PostgreSQL via Task Scheduler (ADR-088).
# Mantém os últimos 7 dias de backups, compactados em .zip.
# =================================================================

# --- CONFIGURAÇÕES ---
$DB_HOST = "localhost"
$DB_PORT = "5432" # Altere para 5433 se estiver usando o container Docker como fonte
$DB_NAME = "radar_db"
$DB_USER = "postgres"
$DB_PASS = "postgres_password" # ⚠️ Em produção, use variáveis de ambiente ou Credential Manager

$BACKUP_DIR = "C:\radar-backups"
$PG_DUMP_PATH = "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" # Ajuste conforme sua instalação
$RETENTION_DAYS = 7

# --- INÍCIO DO SCRIPT ---
Write-Host "🚀 Iniciando backup do banco $DB_NAME..." -ForegroundColor Cyan

# Cria diretório se não existir
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Define nome do arquivo com timestamp
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\radar_db_$TIMESTAMP.sql"
$ZIP_FILE = "$BACKUP_DIR\radar_db_$TIMESTAMP.zip"

# Define variável de ambiente para a senha (evita prompt interativo)
$env:PGPASSWORD = $DB_PASS

try {
    # Executa o pg_dump
    Write-Host "📦 Dumping database..." -ForegroundColor Yellow
    & $PG_DUMP_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dump concluído com sucesso." -ForegroundColor Green
        
        # Compacta o arquivo SQL para economizar espaço
        Write-Host "🗜️ Compactando backup..." -ForegroundColor Yellow
        Compress-Archive -Path $BACKUP_FILE -DestinationPath $ZIP_FILE -Force
        Remove-Item $BACKUP_FILE # Remove o .sql não compactado
        
        Write-Host "🎉 Backup salvo em: $ZIP_FILE" -ForegroundColor Green
    } else {
        throw "pg_dump falhou com código de saída $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ ERRO ao realizar backup: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Limpa a variável de ambiente por segurança
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# --- LIMPEZA DE BACKUPS ANTIGOS (Rotação) ---
Write-Host "🧹 Limpando backups antigos (>$RETENTION_DAYS dias)..." -ForegroundColor Yellow
$CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
Get-ChildItem -Path $BACKUP_DIR -Filter "*.zip" | Where-Object { $_.CreationTime -lt $CutoffDate } | Remove-Item -Force
Write-Host "✅ Limpeza concluída." -ForegroundColor Green