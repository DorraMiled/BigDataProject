# Test Backend API - Création de transactions de test
# Ce script crée quelques transactions via l'API pour tester le backend et ELK stack

Write-Host "`n=== Test API Backend - Création de transactions ===" -ForegroundColor Cyan

# Transaction 1
Write-Host "`n1. Creation transaction reussie..." -ForegroundColor Yellow
$body1 = @{
    transactionId = "TEST-API-001"
    userId = "user1@example.com"
    amount = 1250.75
    currency = "USD"
    status = "completed"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    products = @(
        @{
            id = "P001"
            name = "Laptop Dell XPS 13"
            price = 1250.75
            quantity = 1
        }
    )
} | ConvertTo-Json

$result1 = curl.exe -X POST http://localhost:3001/api/transactions `
    -H "Content-Type: application/json" `
    -d $body1 2>$null | ConvertFrom-Json

Write-Host "Résultat: " -NoNewline
if ($result1.success) {
    Write-Host "✓ Success" -ForegroundColor Green
} else {
    Write-Host "✗ Failed: $($result1.error)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Transaction 2
Write-Host "`n2. Creation transaction en euros..." -ForegroundColor Yellow
$body2 = @{
    transactionId = "TEST-API-002"
    userId = "user2@example.com"
    amount = 589.99
    currency = "EUR"
    status = "pending"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    products = @(
        @{
            id = "P002"
            name = "iPhone 15 Pro"
            price = 589.99
            quantity = 1
        }
    )
} | ConvertTo-Json

$result2 = curl.exe -X POST http://localhost:3001/api/transactions `
    -H "Content-Type: application/json" `
    -d $body2 2>$null | ConvertFrom-Json

Write-Host "Résultat: " -NoNewline
if ($result2.success) {
    Write-Host "✓ Success" -ForegroundColor Green
} else {
    Write-Host "✗ Failed: $($result2.error)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Transaction 3 - Montant élevé pour test de fraude
Write-Host "`n3. Creation transaction montant eleve (test fraude)..." -ForegroundColor Yellow
$body3 = @{
    transactionId = "TEST-API-003"
    userId = "user3@example.com"
    amount = 15000.00
    currency = "GBP"
    status = "completed"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    products = @(
        @{
            id = "P003"
            name = "MacBook Pro 16"
            price = 15000.00
            quantity = 1
        }
    )
} | ConvertTo-Json

$result3 = curl.exe -X POST http://localhost:3001/api/transactions `
    -H "Content-Type: application/json" `
    -d $body3 2>$null | ConvertFrom-Json

Write-Host "Résultat: " -NoNewline
if ($result3.success) {
    Write-Host "✓ Success" -ForegroundColor Green
} else {
    Write-Host "✗ Failed: $($result3.error)" -ForegroundColor Red
}

# Vérifier les statistiques
Write-Host "`n`n=== Verification des statistiques ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2

$stats = curl.exe -s http://localhost:3001/api/stats 2>$null | ConvertFrom-Json

if ($stats.success) {
Write-Host "`nStatistiques disponibles:" -ForegroundColor Green
    $stats | Select-Object -Property * -ExcludeProperty success, cached | Format-List
} else {
    Write-Host "`nErreur lors de la recuperation des stats: $($stats.error)" -ForegroundColor Red
}

# Vérifier dans Elasticsearch
Write-Host "`n=== Verification Elasticsearch ===" -ForegroundColor Cyan
$esCount = curl.exe -s http://localhost:9200/ecommerce-*/_count 2>$null | ConvertFrom-Json
Write-Host "Total documents dans Elasticsearch: $($esCount.count)" -ForegroundColor Green

Write-Host "`n=== Tests termines ===" -ForegroundColor Cyan
