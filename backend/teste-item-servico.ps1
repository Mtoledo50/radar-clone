# ==========================================================
# 🧪 TESTE E2E: Criação de Item de Serviço
# ==========================================================

$api = "http://localhost:3001"

# ⚠️ AJUSTE com um usuário real do seu banco
$email = "admin@contacerta.com.br"
$senha = "123456"

Write-Host "`n🔐 [1/4] Fazendo login..." -ForegroundColor Cyan
try {
    $loginBody = @{ email = $email; password = $senha } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    
    # ⚠️ Se o seu login retornar "token" em vez de "access_token", ajuste aqui
    $token = $login.access_token
    if (-not $token) { $token = $login.token }
    
    Write-Host "✅ Login OK! Token obtido." -ForegroundColor Green
} catch {
    Write-Host "❌ Falha no login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Verifique se o usuário existe e se o backend está rodando." -ForegroundColor Yellow
    exit
}

$headers = @{ Authorization = "Bearer $token" }

# ----------------------------------------------------------
Write-Host "`n📂 [2/4] Buscando categorias existentes..." -ForegroundColor Cyan
$categories = Invoke-RestMethod -Uri "$api/commercial-plans/categories" -Headers $headers
$categoryId = $categories.data[0].id
Write-Host "✅ Categoria encontrada: $($categories.data[0].name) ($categoryId)" -ForegroundColor Green

if (-not $categoryId) {
    Write-Host "❌ Nenhuma categoria encontrada. Rode o seed primeiro: npx prisma db seed" -ForegroundColor Red
    exit
}

# ----------------------------------------------------------
Write-Host "`n📦 [3/4] Criando item de serviço de teste (IRPF Completo)..." -ForegroundColor Cyan
$itemBody = @{
    categoryId      = $categoryId
    name            = "IRPF Completo - Teste API"
    description     = "Declaração completa do IRPF com análise de deduções"
    scope           = "Análise de documentos, transmissão e acompanhamento"
    outOfScope      = "Retificações por omissão de documentos do cliente"
    requiredDocs    = "Informes de rendimentos, recibos médicos, extratos"
    basePrice       = 350.00
    estimatedHours  = 3.0
    slaDays         = 5
    recurrence      = "AVULSO"
    isActive        = $true
} | ConvertTo-Json

try {
    $newItem = Invoke-RestMethod -Uri "$api/commercial-plans/items" -Method Post -Headers $headers -ContentType "application/json" -Body $itemBody
    Write-Host "✅ Item criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $($newItem.data.id)"
    Write-Host "   Nome: $($newItem.data.name)"
    Write-Host "   Preço: R$ $($newItem.data.basePrice)"
} catch {
    Write-Host "❌ Erro ao criar item: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd() -ForegroundColor Yellow
    exit
}

# ----------------------------------------------------------
Write-Host "`n🔍 [4/4] Verificando se o item aparece na listagem..." -ForegroundColor Cyan
$items = Invoke-RestMethod -Uri "$api/commercial-plans/items" -Headers $headers
$found = $items.data | Where-Object { $_.name -like "*Teste API*" }

if ($found) {
    Write-Host "✅ SUCESSO TOTAL! Item encontrado na listagem." -ForegroundColor Green
    Write-Host "   Total de itens no catálogo: $($items.data.Count)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Item criado mas não encontrado na listagem." -ForegroundColor Yellow
}

Write-Host "`n🎉 Teste concluído!`n" -ForegroundColor Cyan